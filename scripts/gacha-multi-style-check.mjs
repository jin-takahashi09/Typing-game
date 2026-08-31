/**
 * Inspect GachaMultiScrolls computed styles in a real browser.
 * Run: npm run dev (or preview) then node scripts/gacha-multi-style-check.mjs [port]
 */
import { chromium } from 'playwright'

const PORT = Number(process.argv[2] ?? 5173)
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

function pickStyle(style, keys) {
  const out = {}
  for (const k of keys) {
    out[k] = style[k] ?? null
  }
  return out
}

async function inspectMultiScrolls(page) {
  return page.evaluate(() => {
    function pickStyle(style, keys) {
      const out = {}
      for (const k of keys) {
        out[k] = style[k] ?? null
      }
      return out
    }

    const overlay = document.querySelector('[data-testid="gacha-fullscreen-overlay"]')
    const positioner = document.querySelector('[data-testid="gacha-multi-positioner"]')
    const container = document.querySelector('[data-testid="gacha-multi-scrolls"]')
    const slots = [...document.querySelectorAll('[data-testid="gacha-multi-scroll-slot"]')]
    const scrolls = [...document.querySelectorAll('.gacha-multi-scroll')]

    const scrollKeys = [
      'width', 'height', 'aspectRatio', 'display', 'position', 'transform',
      'flexShrink', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight', 'borderRadius',
    ]
    const parentKeys = [
      'width', 'maxWidth', 'display', 'gridTemplateColumns', 'justifyContent',
      'justifyItems', 'alignItems', 'gap', 'left', 'right', 'top', 'transform', 'position',
    ]

    const overlayRect = overlay?.getBoundingClientRect()
    const containerRect = container?.getBoundingClientRect()

    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      overlay: overlay
        ? { ...pickStyle(getComputedStyle(overlay), parentKeys), rect: overlay.getBoundingClientRect() }
        : null,
      positioner: positioner
        ? { ...pickStyle(getComputedStyle(positioner), parentKeys), rect: positioner.getBoundingClientRect() }
        : null,
      container: container
        ? { ...pickStyle(getComputedStyle(container), parentKeys), rect: containerRect }
        : null,
      containerCenterOffset: containerRect && overlayRect
        ? {
            dx: containerRect.left + containerRect.width / 2 - window.innerWidth / 2,
            dy: containerRect.top + containerRect.height / 2 - window.innerHeight / 2,
          }
        : null,
      slotCount: slots.length,
      visibleSlots: slots.filter((s) => s.classList.contains('gacha-multi-scrolls__slot--visible')).length,
      slots: slots.slice(0, 3).map((slot, i) => ({
        index: i,
        ...pickStyle(getComputedStyle(slot), scrollKeys),
        rect: slot.getBoundingClientRect(),
        scroll: (() => {
          const el = slot.querySelector('.gacha-multi-scroll')
          if (!el) return null
          return { ...pickStyle(getComputedStyle(el), scrollKeys), rect: el.getBoundingClientRect() }
        })(),
      })),
      scrolls: scrolls.slice(0, 3).map((el, i) => ({
        index: i,
        ...pickStyle(getComputedStyle(el), scrollKeys),
        rect: el.getBoundingClientRect(),
      })),
      centerText: [...document.querySelectorAll('*')]
        .filter((el) => {
          const t = el.textContent?.trim() ?? ''
          if (t !== '10連' && t !== '十連' && !/^10連/.test(t)) return false
          if (el.children.length > 0) return false
          const style = getComputedStyle(el)
          if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) {
            return false
          }
          const rect = el.getBoundingClientRect()
          if (rect.width === 0 || rect.height === 0) return false
          return true
        })
        .map((el) => ({
          tag: el.tagName,
          class: el.className,
          text: el.textContent?.trim(),
          rect: el.getBoundingClientRect(),
        })),
      phase: document.querySelector('[data-testid="gacha-reveal"]')?.getAttribute('data-phase'),
      machineBundle: (() => {
        const b = document.querySelector('.scroll-shrine--multi [data-testid="gacha-scroll-bundle"], [data-testid="gacha-reveal"] [data-testid="gacha-scroll-bundle"]')
        if (!b) return null
        const card = b.querySelector('.gacha-scroll-bundle__card, .gacha-scroll-card')
        const cardStyle = card ? getComputedStyle(card) : null
        return {
          ...pickStyle(getComputedStyle(b), parentKeys),
          rect: b.getBoundingClientRect(),
          childCount: b.children.length,
          card: card
            ? {
                width: cardStyle.width,
                height: cardStyle.height,
                borderRadius: cardStyle.borderRadius,
                rect: card.getBoundingClientRect(),
              }
            : null,
          centerOffset: {
            dx: b.getBoundingClientRect().left + b.getBoundingClientRect().width / 2 - window.innerWidth / 2,
            dy: b.getBoundingClientRect().top + b.getBoundingClientRect().height / 2 - window.innerHeight / 2,
          },
        }
      })(),
    }
  })
}

async function waitForPhase(page, phase, timeout = 15000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const current = await page.evaluate(
      () => document.querySelector('[data-testid="gacha-reveal"]')?.getAttribute('data-phase') ?? null,
    )
    if (current === phase) return true
    await page.waitForTimeout(50)
  }
  return false
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await seed(page)
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'ガチャ' }).click()
  await page.waitForSelector('[data-testid="gacha-multi"]')

  const multiSeq = []
  for (let i = 0; i < 10; i += 1) multiSeq.push(0.01, (i % 3) / 3)
  await setRng(page, multiSeq)
  await page.getByTestId('gacha-multi').click()

  await page.waitForSelector('[data-testid="gacha-fullscreen-overlay"]')
  await page.waitForTimeout(900)
  const machineInspect = await inspectMultiScrolls(page)
  console.log('\n=== MACHINE (early) ===')
  console.log(JSON.stringify(machineInspect, null, 2))

  await page.waitForSelector('[data-testid="gacha-reveal"]', { timeout: 10000 })
  await waitForPhase(page, 'multi-scrolls')
  await page.waitForTimeout(600)
  const revealInspect = await inspectMultiScrolls(page)
  console.log('\n=== REVEAL multi-scrolls ===')
  console.log(JSON.stringify(revealInspect, null, 2))

  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
