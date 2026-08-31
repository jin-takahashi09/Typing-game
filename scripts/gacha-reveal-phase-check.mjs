/**
 * Measure gacha reveal phase progression in a real browser.
 * Run: node scripts/gacha-reveal-phase-check.mjs [port]
 */
import { chromium } from 'playwright'

const PORT = Number(process.argv[2] ?? 5174)
const BASE = `http://127.0.0.1:${PORT}`
const STORAGE_KEY = 'shinobi-keys-data'

function seed(page) {
  return page.addInitScript(({ key }) => {
    localStorage.setItem(
      key,
      JSON.stringify({
        version: 3,
        settings: {
          volume: 0,
          muted: true,
          lastDifficulty: 'trainee',
          motionPreference: 'full',
        },
        aggregates: { totalPlays: 0, totalTypedChars: 0, bestComboAll: 0 },
        bestByDifficulty: { trainee: null, ninja: null, master: null },
        recentPlays: [],
        economy: {
          coins: 10_000,
          ownedCharacterIds: ['shinobi-default'],
          selectedCharacterId: 'shinobi-default',
          gachaHistory: [],
        },
      }),
    )
  }, { key: STORAGE_KEY })
}

async function setRng(page, values) {
  await page.evaluate((seq) => {
    let i = 0
    window.__SHINOBI_KEYS_TEST__ = {
      gachaRng: () => {
        const v = seq[Math.min(i, seq.length - 1)]
        i += 1
        return v
      },
    }
  }, values)
}

async function pollReveal(page, label, maxMs = 12000) {
  const events = []
  const start = Date.now()

  while (Date.now() - start < maxMs) {
    const snap = await page.evaluate(() => {
      const screenPhase = document.querySelector('[data-testid="gacha-phase"]')?.getAttribute('data-phase')
      const reveal = document.querySelector('[data-testid="gacha-reveal"]')
      const portal = document.querySelector('[data-testid="gacha-fullscreen-overlay"]')
      const modal = document.querySelector('[data-testid="gacha-result-modal"]')
      const motion = document.documentElement.dataset.motion
      const reducedMedia = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (!reveal) {
        return {
          screenPhase,
          revealPresent: false,
          portalPresent: Boolean(portal),
          modalPresent: Boolean(modal),
          motion,
          reducedMedia,
        }
      }

      const portalStyle = portal ? getComputedStyle(portal) : null
      const style = getComputedStyle(reveal)
      const bundle = reveal.querySelector('[data-testid="gacha-scroll-bundle"]')
      const multiScrolls = reveal.querySelector('[data-testid="gacha-multi-scrolls"]')
      const visibleSlots = reveal.querySelectorAll('[data-testid="gacha-multi-scroll-slot"].gacha-multi-scrolls__slot--visible').length
      const scrollFx = reveal.querySelector('[data-testid="gacha-scroll-fx"]')
      const scrollFxStyle = scrollFx ? getComputedStyle(scrollFx) : null
      const bundleStyle = bundle ? getComputedStyle(bundle) : null
      const slot0 = reveal.querySelector('[data-scroll-index="0"]')
      const slot0Style = slot0 ? getComputedStyle(slot0) : null

      return {
        screenPhase,
        revealPresent: true,
        portalPresent: Boolean(portal),
        portalPosition: portalStyle?.position ?? null,
        portalHeight: portalStyle?.height ?? null,
        modalPresent: Boolean(modal),
        motion,
        reducedMedia,
        dataPhase: reveal.getAttribute('data-phase'),
        pullType: reveal.getAttribute('data-pull-type'),
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        zIndex: portalStyle?.zIndex ?? style.zIndex,
        position: style.position,
        width: style.width,
        height: style.height,
        bannerOpacity: bundleStyle?.opacity ?? null,
        bannerDisplay: bundleStyle?.display ?? null,
        scrollFxOpacity: scrollFxStyle?.opacity ?? null,
        multiScrollCount: multiScrolls ? multiScrolls.querySelectorAll('.gacha-multi-scrolls__slot').length : 0,
        visibleSlots,
        slot0Opacity: slot0Style?.opacity ?? null,
      }
    })

    const last = events[events.length - 1]
    const changed =
      !last ||
      last.screenPhase !== snap.screenPhase ||
      last.revealPresent !== snap.revealPresent ||
      last.modalPresent !== snap.modalPresent ||
      last.dataPhase !== snap.dataPhase ||
      last.visibleSlots !== snap.visibleSlots

    if (changed) {
      events.push({ t: Date.now() - start, ...snap })
    }

    if (snap.screenPhase === 'result' && snap.modalPresent) {
      break
    }

    await page.waitForTimeout(40)
  }

  console.log(`\n=== ${label} ===`)
  for (const e of events) {
    console.log(JSON.stringify(e))
  }

  const revealMs = events.find((e) => e.revealPresent)?.t ?? null
  const resultMs = events.find((e) => e.screenPhase === 'result')?.t ?? null
  console.log(`reveal first seen @ ${revealMs}ms, result @ ${resultMs}ms, reveal duration ~ ${revealMs != null && resultMs != null ? resultMs - revealMs : 'n/a'}ms`)

  return events
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await seed(page)
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'ガチャ' }).click()
  await page.waitForSelector('[data-testid="gacha-single"]')

  await setRng(page, [0.01, 0.5])
  await page.getByTestId('gacha-single').click()
  await pollReveal(page, 'single N full motion')

  await page.getByTestId('gacha-reveal-close').click()
  await page.waitForSelector('[data-testid="gacha-result-modal"]', { state: 'detached' })

  const multiSeq = []
  for (let i = 0; i < 10; i += 1) multiSeq.push(0.01, (i % 3) / 3)
  await setRng(page, multiSeq)
  await page.getByTestId('gacha-multi').click()
  await pollReveal(page, 'multi 10-pull full motion')

  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
