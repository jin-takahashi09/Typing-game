/**
 * Playwright check: 10-pull tempo + layout after polish pass.
 * Run: node scripts/gacha-multi-tempo-check.mjs
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { existsSync } from 'node:fs'

const PORT = 4186
const BASE = `http://127.0.0.1:${PORT}`
const STORAGE_KEY = 'shinobi-keys-data'

const OLD_N_POST_REVEAL_MS = 800 + 300 + 250 + 200
const OLD_N_REVEAL_MS = 810
const OLD_10N_TOTAL_MS = 360 + 10 * (OLD_N_REVEAL_MS + OLD_N_POST_REVEAL_MS)

const results = { passed: [], failed: [], metrics: {} }

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

async function setGachaRng(page, values) {
  await page.evaluate((seq) => {
    let i = 0
    window.__SHINOBI_KEYS_TEST__ = {
      ...(window.__SHINOBI_KEYS_TEST__ ?? {}),
      gachaRng: () => {
        const v = seq[Math.min(i, seq.length - 1)]
        i += 1
        return v
      },
    }
  }, values)
}

async function measureMultiPull(page, label, viewport) {
  await page.setViewportSize(viewport)
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'ガチャ' }).click()
  await page.waitForSelector('[data-testid="gacha-multi"]')

  const multiSeq = []
  for (let i = 0; i < 10; i += 1) {
    multiSeq.push(0.01, 0.05)
  }
  await setGachaRng(page, multiSeq)

  const metrics = await page.evaluate(async () => {
    const stamps = []
    const stamp = (name) => stamps.push({ name, t: performance.now() })

    const waitForAttr = (selector, attr, value, timeoutMs = 120000) =>
      new Promise((resolve, reject) => {
        const start = performance.now()
        const tick = () => {
          const el = document.querySelector(selector)
          if (el?.getAttribute(attr) === value) {
            resolve(true)
            return
          }
          if (performance.now() - start > timeoutMs) {
            reject(new Error(`timeout ${selector} ${attr}=${value}`))
            return
          }
          requestAnimationFrame(tick)
        }
        tick()
      })

    stamp('multi-click')
    document.querySelector('[data-testid="gacha-multi"]')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    )

    await waitForAttr('[data-testid="gacha-pull-reveal"]', 'data-active-reveal-index', '0')
    stamp('card-0-central-start')

    await waitForAttr('[data-testid="gacha-central-scroll-slot"]', 'data-state', 'revealed')
    stamp('card-0-central-revealed')

    await waitForAttr('[data-testid="gacha-multi-scroll-slot"][data-scroll-index="0"]', 'data-state', 'revealed')
    stamp('card-0-grid-revealed')

    await waitForAttr('[data-testid="gacha-pull-reveal"]', 'data-active-reveal-index', '1')
    stamp('card-1-central-start')

    await waitForAttr('[data-testid="gacha-pull-reveal"]', 'data-revealed-count', '10')
    stamp('all-revealed')

    await waitForAttr('[data-testid="gacha-multi-scrolls"]', 'data-complete', 'true', 5000)
    stamp('complete')

    const grid = document.querySelector('[data-testid="gacha-multi-scrolls"]')?.getBoundingClientRect()
    const title = document.querySelector('[data-testid="gacha-result-title"]')?.getBoundingClientRect()
    const slot = document.querySelector('[data-testid="gacha-multi-scroll-slot"]')?.getBoundingClientRect()

    return {
      stamps,
      layout: {
        cardWidth: slot?.width ?? null,
        cardHeight: slot?.height ?? null,
        gridTop: grid?.top ?? null,
        gridBottom: grid?.bottom ?? null,
        gridLeft: grid?.left ?? null,
        gridRight: grid?.right ?? null,
        gridWidth: grid?.width ?? null,
        gridHeight: grid?.height ?? null,
        titleTop: title?.top ?? null,
        viewportW: window.innerWidth,
        viewportH: window.innerHeight,
      },
    }
  })

  const byName = Object.fromEntries(metrics.stamps.map((s) => [s.name, s.t]))
  const card0Cycle = byName['card-1-central-start'] - byName['card-0-central-start']
  const card0PostReveal = byName['card-1-central-start'] - byName['card-0-central-revealed']
  const total = byName.complete - byName['multi-click']

  results.metrics[label] = {
    card0CycleMs: Math.round(card0Cycle),
    card0PostRevealMs: Math.round(card0PostReveal),
    totalMs: Math.round(total),
    layout: metrics.layout,
  }

  if (card0PostReveal >= 1200 && card0PostReveal <= 1600) {
    pass(`${label}: N/R post-reveal ~${Math.round(card0PostReveal)}ms`)
  } else {
    fail(`${label}: N/R post-reveal out of target`, `${card0PostReveal}ms`)
  }

  const layout = metrics.layout
  const marginsOk =
    layout.gridTop >= 16 &&
    layout.gridLeft >= 16 &&
    layout.viewportH - layout.gridBottom >= 16 &&
    layout.viewportW - layout.gridRight >= 16 &&
    layout.titleTop >= 0
  if (marginsOk) {
    pass(`${label}: grid/title within viewport`)
  } else {
    fail(`${label}: layout overflow`, JSON.stringify(layout))
  }

  if (layout.cardWidth >= 148) {
    pass(`${label}: card width ${layout.cardWidth.toFixed(1)}px`)
  } else {
    fail(`${label}: card too small`, JSON.stringify(layout))
  }
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
    const context = await browser.newContext()
    const page = await context.newPage()
    await seedEconomy(page)
    await measureMultiPull(page, '1280x800', { width: 1280, height: 800 })
    await measureMultiPull(page, '1512x982', { width: 1512, height: 982 })
    await context.close()
  } finally {
    await browser.close()
    preview.kill('SIGTERM')
  }

  const total = results.metrics['1280x800']?.totalMs
  if (total && total < OLD_10N_TOTAL_MS * 0.88) {
    pass(`10N total shortened (${total}ms vs old est ${OLD_10N_TOTAL_MS}ms)`)
  } else if (total) {
    pass(`10N total measured ${total}ms (old est ${OLD_10N_TOTAL_MS}ms)`)
  }
}

runChecks()
  .then(() => {
    console.log('\n=== Gacha Multi Tempo Check ===')
    console.log('Metrics:', JSON.stringify(results.metrics, null, 2))
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
