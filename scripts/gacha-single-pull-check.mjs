/**
 * Playwright check: single pull — one scroll, no giant scale, no bundle.
 * Run: node scripts/gacha-single-pull-check.mjs
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { existsSync } from 'node:fs'

const PORT = 4185
const BASE = `http://127.0.0.1:${PORT}`
const STORAGE_KEY = 'shinobi-keys-data'

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

async function runChecks() {
  if (!existsSync('dist/index.html')) {
    const build = spawn('npm', ['run', 'build'], {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: true,
    })
    await new Promise((resolve, reject) => {
      build.on('exit', (code) =>
        code === 0 ? resolve() : reject(new Error('build failed')),
      )
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
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const page = await context.newPage()
    await seedEconomy(page)
    await page.goto(BASE, { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: 'ガチャ' }).click()
    await page.waitForSelector('[data-testid="gacha-single"]')

    await page.evaluate(() => {
      window.__SHINOBI_KEYS_TEST__ = {
        ...(window.__SHINOBI_KEYS_TEST__ ?? {}),
        gachaRng: () => 0.01,
      }
    })

    await page.getByTestId('gacha-single').click()
    await page.waitForSelector('[data-testid="gacha-pull-reveal"]', { timeout: 5000 })

    const snapshot = await page.evaluate(() => {
      const slots = document.querySelectorAll('[data-testid="gacha-single-scroll-slot"]')
      const bundle = document.querySelector('[data-testid="gacha-scroll-bundle"]')
      const multiSlots = document.querySelectorAll('[data-testid="gacha-multi-scroll-slot"]')
      const modal = document.querySelector('[data-testid="gacha-result-modal"]')
      const revealFx = document.querySelector('[data-testid="gacha-card-reveal-fx"]')
      const viewport = { w: window.innerWidth, h: window.innerHeight }
      let maxScale = 1
      let maxRectRatio = 0
      slots.forEach((el) => {
        const style = getComputedStyle(el)
        const transform = style.transform
        const match = transform.match(/matrix\(([^)]+)\)/)
        if (match) {
          const parts = match[1].split(',').map(Number)
          const a = parts[0]
          const b = parts[1]
          const scale = Math.sqrt(a * a + b * b)
          if (scale > maxScale) maxScale = scale
        }
        const rect = el.getBoundingClientRect()
        maxRectRatio = Math.max(maxRectRatio, rect.width / viewport.w, rect.height / viewport.h)
      })
      const slot = slots[0]
      const slotRect = slot?.getBoundingClientRect()
      const aspect = slotRect ? slotRect.width / slotRect.height : 0
      return {
        slotCount: slots.length,
        multiSlotCount: multiSlots.length,
        hasBundle: Boolean(bundle),
        hasModal: Boolean(modal),
        hasRevealFx: Boolean(revealFx),
        maxScale,
        maxRectRatio,
        aspect,
        state: slot?.getAttribute('data-state') ?? null,
      }
    })

    console.log('Single snapshot:', JSON.stringify(snapshot))

    if (snapshot.slotCount === 1) {
      pass('single shows exactly 1 scroll slot')
    } else {
      fail('single should show 1 slot', JSON.stringify(snapshot))
    }

    if (snapshot.multiSlotCount === 0 && !snapshot.hasBundle) {
      pass('single does not render bundle or multi slots')
    } else {
      fail('single should not show bundle/multi', JSON.stringify(snapshot))
    }

    if (snapshot.aspect >= 0.78 && snapshot.aspect <= 0.95) {
      pass(`wider scroll aspect=${snapshot.aspect.toFixed(2)}`)
    } else {
      fail('scroll should be wider (aspect ~0.82-0.9)', JSON.stringify(snapshot))
    }

    if (snapshot.maxScale < 1.5 && snapshot.maxRectRatio < 0.45) {
      pass(`scale capped (maxScale=${snapshot.maxScale.toFixed(2)}, rectRatio=${snapshot.maxRectRatio.toFixed(2)})`)
    } else {
      fail('single scroll too large', JSON.stringify(snapshot))
    }

    await page.waitForFunction(() => {
      const fx = document.querySelector('[data-testid="gacha-card-reveal-fx"]')
      return Boolean(fx)
    }, null, { timeout: 3000 }).catch(() => null)

    const midFx = await page.evaluate(() => ({
      hasRevealFx: Boolean(document.querySelector('[data-testid="gacha-card-reveal-fx"]')),
      state: document.querySelector('[data-testid="gacha-single-scroll-slot"]')?.getAttribute('data-state'),
    }))

    if (midFx.hasRevealFx) {
      pass(`single uses shared gacha-card-reveal-fx (state=${midFx.state})`)
    } else {
      fail('single should use gacha-card-reveal-fx', JSON.stringify(midFx))
    }

    await page.waitForFunction(() => {
      const slot = document.querySelector('[data-testid="gacha-single-scroll-slot"]')
      return slot?.getAttribute('data-state') === 'revealed'
    }, null, { timeout: 8000 })

    const afterReveal = await page.evaluate(() => {
      const modal = document.querySelector('[data-testid="gacha-result-modal"]')
      const slot = document.querySelector('[data-testid="gacha-single-scroll-slot"]')
      const nameBeforeReveal = false
      return {
        hasModal: Boolean(modal),
        state: slot?.getAttribute('data-state'),
        hasResultInSlot: Boolean(slot?.querySelector('[data-testid="gacha-result-card"]')),
      }
    })

    if (afterReveal.hasResultInSlot && !afterReveal.hasModal) {
      pass('result stays in same single slot (no modal swap)')
    } else {
      fail('single result should stay in slot', JSON.stringify(afterReveal))
    }

    await context.close()
  } finally {
    await browser.close()
    preview.kill('SIGTERM')
  }
}

runChecks()
  .then(() => {
    console.log('\n=== Gacha Single Pull Check ===')
    for (const p of results.passed) {
      console.log('PASS:', p.name, p.detail ? `(${p.detail})` : '')
    }
    for (const f of results.failed) {
      console.log('FAIL:', f.name, '->', f.detail)
    }
    if (results.failed.length > 0) process.exit(1)
  })
  .catch((error) => {
    console.error('runChecks error:', error)
    process.exit(2)
  })
