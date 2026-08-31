/**
 * Playwright: central reveal timing + safe bounds + rarity-after-character.
 * Run: node scripts/gacha-reveal-timing-check.mjs
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { existsSync } from 'node:fs'

const PORT = 4186
const BASE = `http://127.0.0.1:${PORT}`
const STORAGE_KEY = 'shinobi-keys-data'
const SAFE_MARGIN = 20

const results = { passed: [], failed: [] }

function pass(name, detail = '') {
  results.passed.push({ name, detail })
}

function fail(name, detail) {
  results.failed.push({ name, detail: String(detail) })
}

async function waitForServer() {
  for (let i = 0; i < 50; i += 1) {
    try {
      const res = await fetch(BASE)
      if (res.ok) return
    } catch {
      /* wait */
    }
    await delay(400)
  }
  throw new Error('preview server did not start')
}

function seedEconomy(page) {
  return page.addInitScript(
    ({ key }) => {
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
    },
    { key: STORAGE_KEY },
  )
}

function measureBounds(page) {
  return page.evaluate((margin) => {
    const el =
      document.querySelector('[data-testid="gacha-central-safe-area"]') ??
      document.querySelector('[data-testid="gacha-single-scroll-slot"]')
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const vw = window.visualViewport?.width ?? window.innerWidth
    const vh = window.visualViewport?.height ?? window.innerHeight
    return {
      rect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right },
      viewport: { w: vw, h: vh },
      ok:
        rect.top >= margin &&
        rect.left >= margin &&
        rect.right <= vw - margin &&
        rect.bottom <= vh - margin,
    }
  }, SAFE_MARGIN)
}

async function runChecks() {
  if (!existsSync('dist/index.html')) {
    const build = spawn('npm', ['run', 'build'], {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: true,
    })
    await new Promise((resolve, reject) => {
      build.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('build failed'))))
    })
  }

  const preview = spawn(
    'npm',
    ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(PORT)],
    { cwd: process.cwd(), stdio: 'pipe', shell: true },
  )

  await delay(1500)
  await waitForServer()

  const browser = await chromium.launch({ headless: true })

  try {
    for (const viewport of [
      { width: 1280, height: 800, label: '1280x800' },
      { width: 1512, height: 982, label: '1512x982' },
    ]) {
      const context = await browser.newContext({ viewport })
      const page = await context.newPage()
      await seedEconomy(page)
      await page.goto(BASE, { waitUntil: 'domcontentloaded' })
      await page.getByRole('button', { name: 'ガチャ' }).click()

      await page.evaluate(() => {
        window.__SHINOBI_KEYS_TEST__ = {
          ...(window.__SHINOBI_KEYS_TEST__ ?? {}),
          gachaRng: () => 0.35,
        }
      })

      await page.getByTestId('gacha-single').click()
      await page.waitForSelector('[data-testid="gacha-single-scroll-slot"][data-state="revealed"]', {
        timeout: 15000,
      })
      await delay(500)

      const bounds = await measureBounds(page)
      console.log(`${viewport.label} single bounds:`, JSON.stringify(bounds))

      if (bounds?.ok) {
        pass(`${viewport.label} single safe-area in viewport`)
      } else {
        fail(`${viewport.label} single safe-area clipped`, JSON.stringify(bounds))
      }

      const labelOrder = await page.evaluate(() => ({
        hasBanner: Boolean(document.querySelector('[data-testid="gacha-rarity-banner"]')),
      }))

      if (!labelOrder.hasBanner) {
        pass(`${viewport.label} no pre-result rarity banner in FX`)
      } else {
        fail(`${viewport.label} rarity banner in FX`)
      }

      await context.close()
    }

    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const page = await context.newPage()
    await seedEconomy(page)
    await page.goto(BASE, { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: 'ガチャ' }).click()

    await page.evaluate(() => {
      window.__SHINOBI_KEYS_TEST__ = {
        ...(window.__SHINOBI_KEYS_TEST__ ?? {}),
        gachaRng: () => 0.35,
      }
    })

    await page.getByTestId('gacha-multi').click()
    await page.waitForSelector('[data-testid="gacha-central-reveal"]', { timeout: 8000 })

    const t0 = Date.now()

    await page.waitForFunction(() => {
      const char = document.querySelector(
        '[data-testid="gacha-central-scroll-slot"] [data-testid="gacha-result-character"]',
      )
      return Boolean(char)
    }, null, { timeout: 20000 })
    const characterVisible = Date.now()

    await page.waitForFunction(() => {
      const label = document.querySelector(
        '[data-testid="gacha-central-scroll-slot"] [data-testid="gacha-result-rarity-label"]',
      )
      if (!label) return false
      return Number(getComputedStyle(label).opacity) > 0.5
    }, null, { timeout: 5000 })
    const labelVisible = Date.now()

    await page.waitForFunction(
      () => !document.querySelector('[data-testid="gacha-central-reveal"]'),
      null,
      { timeout: 20000 },
    )
    const returnGrid = Date.now()

    await page.waitForSelector('[data-testid="gacha-central-reveal"]', { timeout: 20000 })
    const nextOpen = Date.now()

    const holdMs = returnGrid - characterVisible
    const labelDelay = labelVisible - characterVisible
    const gapMs = nextOpen - returnGrid

    console.log('Multi timing:', { t0, holdMs, labelDelay, gapMs })

    if (labelDelay >= 0) {
      pass(`rarity label after character (+${labelDelay}ms)`)
    } else {
      fail('rarity before character', String(labelDelay))
    }

    if (holdMs >= 1000) {
      pass(`result hold before return ${holdMs}ms`)
    } else {
      fail(`result hold too short ${holdMs}ms`)
    }

    if (gapMs >= 200) {
      pass(`grid settle + gap before next ${gapMs}ms`)
    } else {
      fail(`gap before next too short ${gapMs}ms`)
    }

    await context.close()
  } finally {
    await browser.close()
    preview.kill('SIGTERM')
  }
}

runChecks()
  .then(() => {
    console.log('\n=== Gacha Reveal Timing Check ===')
    for (const p of results.passed) {
      console.log('PASS:', p.name, p.detail ? `(${p.detail})` : '')
    }
    for (const f of results.failed) {
      console.log('FAIL:', f.name, '->', f.detail)
    }
    if (results.failed.length > 0) process.exit(1)
  })
  .catch((error) => {
    console.error(error)
    process.exit(2)
  })
