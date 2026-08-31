/**
 * Playwright check: 10-pull central reveal per card.
 * Run: node scripts/gacha-multi-stagger-check.mjs
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { existsSync } from 'node:fs'

const PORT = 4184
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

async function sampleState(page) {
  return page.evaluate(() => {
    const slots = [...document.querySelectorAll('[data-testid="gacha-multi-scroll-slot"]')]
    const states = slots.map((el) => el.getAttribute('data-state'))
    const revealed = states.filter((s) => s === 'revealed').length
    const closed = states.filter((s) => s === 'closed').length
    const opening = states.filter((s) => s === 'opening').length
    const central = document.querySelector('[data-testid="gacha-central-reveal"]')
    const centralSlot = document.querySelector('[data-testid="gacha-central-scroll-slot"]')
    const title = document.querySelector('[data-testid="gacha-result-title"]')
    const titleRect = title?.getBoundingClientRect()
    const gridRect = document.querySelector('[data-testid="gacha-multi-scrolls"]')?.getBoundingClientRect()
    return {
      slotCount: slots.length,
      states,
      revealed,
      closed,
      opening,
      hasCentral: Boolean(central),
      centralState: centralSlot?.getAttribute('data-state') ?? null,
      activeIndex: document.querySelector('[data-testid="gacha-pull-reveal"]')?.getAttribute('data-active-reveal-index'),
      titleAboveGrid: titleRect && gridRect ? titleRect.top < gridRect.top : false,
      hasResultModal: Boolean(document.querySelector('[data-testid="gacha-result-modal"]')),
    }
  })
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
    await page.waitForSelector('[data-testid="gacha-multi"]')

    const multiSeq = []
    for (let i = 0; i < 10; i += 1) {
      multiSeq.push(0.01, (i % 3) / 3)
    }
    await setGachaRng(page, multiSeq)
    await page.getByTestId('gacha-multi').click()

    await page.waitForSelector('[data-testid="gacha-pull-reveal"]', { timeout: 5000 })

    const start = await sampleState(page)
    console.log('Start:', JSON.stringify(start))

    if (start.slotCount === 10 && start.closed === 10) {
      pass('start: 10 closed slots')
    } else {
      fail('start: 10 closed slots', JSON.stringify(start))
    }

    if (start.titleAboveGrid) {
      pass('title ガチャ結果 is above grid')
    } else {
      fail('title should be above grid', JSON.stringify(start))
    }

    await delay(900)
    const mid = await sampleState(page)
    console.log('Mid:', JSON.stringify(mid))

    if (mid.hasCentral && mid.centralState && mid.centralState !== 'closed') {
      pass(`central reveal active (state=${mid.centralState}, index=${mid.activeIndex})`)
    } else {
      fail('central reveal should be visible mid-flow', JSON.stringify(mid))
    }

    if (mid.revealed <= 1) {
      pass(`grid reveals incrementally (revealed=${mid.revealed})`)
    } else {
      fail('grid should not reveal all at once early', JSON.stringify(mid))
    }

    await page.waitForFunction(() => {
      const root = document.querySelector('[data-testid="gacha-pull-reveal"]')
      return root?.getAttribute('data-revealed-count') === '10'
    }, null, { timeout: 120000 })

    const end = await sampleState(page)
    console.log('End:', JSON.stringify(end))

    if (end.revealed === 10 && !end.hasCentral) {
      pass('all 10 revealed, central overlay gone')
    } else {
      fail('final state', JSON.stringify(end))
    }

    if (!end.hasResultModal) {
      pass('no separate result modal')
    } else {
      fail('result modal should not appear')
    }

    await context.close()
  } finally {
    await browser.close()
    preview.kill('SIGTERM')
  }
}

runChecks()
  .then(() => {
    console.log('\n=== Gacha Multi Central Reveal Check ===')
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
