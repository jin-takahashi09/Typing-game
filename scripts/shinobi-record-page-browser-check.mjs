/**
 * Shinobi record dedicated page browser check.
 * Screenshots → test-results/shinobi-record-page/
 * Run: node scripts/shinobi-record-page-browser-check.mjs
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const PORT = 4193
const BASE = `http://127.0.0.1:${PORT}`
const STORAGE_KEY = 'shinobi-keys-data'
const SHOT_DIR = join(process.cwd(), 'test-results', 'shinobi-record-page')
const CHARACTER_COUNT = 16

const results = { passed: [], failed: [] }

function pass(name) {
  results.passed.push(name)
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

function seedEconomy(page, economyPatch = {}) {
  return page.addInitScript(
    ({ key, economyPatch: eco }) => {
      const seed = {
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
          coins: 50_000,
          ownedCharacterIds: [
            'shinobi-default',
            'shinobi-kage',
            'shinobi-red',
            'shinobi-blue',
          ],
          selectedCharacterId: 'shinobi-default',
          gachaHistory: [],
          ...eco,
        },
      }
      const existing = localStorage.getItem(key)
      if (!existing) {
        localStorage.setItem(key, JSON.stringify(seed))
      }
    },
    { key: STORAGE_KEY, economyPatch },
  )
}

async function runChecks() {
  mkdirSync(SHOT_DIR, { recursive: true })

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
  const consoleErrors = []

  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const page = await context.newPage()
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('pageerror', (err) => consoleErrors.push(err.message))

    await seedEconomy(page)
    await page.goto(BASE, { waitUntil: 'domcontentloaded' })

    if ((await page.getByTestId('shinobi-record-grid').count()) === 0) {
      pass('title: no record grid')
    } else {
      fail('title: no record grid', 'grid visible on title')
    }

    const recordBtn = page.getByTestId('title-open-shinobi-record')
    if (await recordBtn.isVisible()) {
      pass('title: shinobi record button')
    } else {
      fail('title: shinobi record button', 'missing')
    }

    const btnClass = await recordBtn.evaluate((el) => el.className)
    const gachaClass = await page.getByRole('button', { name: 'ガチャ' }).evaluate((el) => el.className)
    if (btnClass === gachaClass) pass('title: record button matches menu style')
    else fail('title: record button matches menu style', 'class mismatch')

    await page.screenshot({
      path: join(SHOT_DIR, 'title-with-record-button.png'),
      fullPage: false,
    })

    await recordBtn.click()
    await page.waitForFunction(() => window.location.hash === '#shinobi-record')
    pass('nav: opens shinobi-record hash')

    await page.waitForSelector('[data-testid="shinobi-record-grid"]')
    await page.waitForSelector('[data-testid="shinobi-record-owned-count"]')

    const ownedText = await page.getByTestId('shinobi-record-owned-count').innerText()
    if (ownedText.includes('4 / 16')) pass('page: owned count display')
    else fail('page: owned count display', ownedText)

    await page.screenshot({
      path: join(SHOT_DIR, 'shinobi-record-desktop.png'),
      fullPage: false,
    })

    const cardCount = await page.getByTestId(/shinobi-record-card-/).count()
    if (cardCount === CHARACTER_COUNT) pass('page: all 16 characters')
    else fail('page: all 16 characters', `count=${cardCount}`)

    const gridCols = await page.evaluate(() => {
      const grid = document.querySelector('[data-testid="shinobi-record-grid"]')
      return grid
        ? getComputedStyle(grid).gridTemplateColumns.split(' ').length
        : 0
    })
    if (gridCols >= 4) pass('page: desktop grid columns')
    else fail('page: desktop grid columns', `cols=${gridCols}`)

    const unownedGray = await page.evaluate(() => {
      const el = document.querySelector(
        '[data-testid="shinobi-record-card-shinobi-gold"] .shinobi-record-card__figure--unowned',
      )
      if (!el) return false
      const filter = getComputedStyle(el).filter
      return filter.includes('grayscale') && filter.includes('brightness')
    })
    if (unownedGray) pass('page: unowned grayscale')
    else fail('page: unowned grayscale', 'missing filter')

    const ownedColor = await page.evaluate(() => {
      const el = document.querySelector(
        '[data-testid="shinobi-record-card-shinobi-red"] .shinobi-record-card__figure',
      )
      if (!el) return false
      const filter = getComputedStyle(el).filter
      return filter === 'none' || filter === ''
    })
    if (ownedColor) pass('page: owned in color')
    else fail('page: owned in color', 'filtered')

    await page.screenshot({
      path: join(SHOT_DIR, 'shinobi-record-owned-unowned.png'),
      fullPage: false,
    })

    await page.getByTestId('shinobi-record-card-shinobi-gold').click()
    await page.waitForSelector('[data-testid="shinobi-record-detail"][data-owned="false"]')
    const noSelect = (await page.getByTestId('shinobi-record-select').count()) === 0
    if (noSelect) pass('page: unowned not selectable')
    else fail('page: unowned not selectable', 'select shown')
    await page.getByTestId('shinobi-record-detail-close').click()

    await page.getByTestId('shinobi-record-card-shinobi-kage').click()
    await page.waitForSelector('[data-testid="shinobi-record-detail"]')
    await page.screenshot({
      path: join(SHOT_DIR, 'shinobi-record-detail.png'),
      fullPage: false,
    })
    await page.getByTestId('shinobi-record-select').click()
    await delay(200)

    await page.getByTestId('back-button').click()
    await page.waitForFunction(() => window.location.hash === '#title' || window.location.hash === '')
    pass('nav: back button to title')

    const titleName = await page.getByTestId('title-selected-name').innerText()
    if (titleName.includes('影丸')) pass('title: selection reflected')
    else fail('title: selection reflected', titleName)

    await page.screenshot({
      path: join(SHOT_DIR, 'title-after-character-change.png'),
      fullPage: false,
    })

    await page.getByTestId('title-open-shinobi-record').click()
    await page.waitForFunction(() => window.location.hash === '#shinobi-record')
    await page.goBack()
    await page.waitForFunction(
      () => window.location.hash === '#title' || window.location.hash === '',
    )
    pass('nav: browser back to title')
    await page.goForward()
    await page.waitForFunction(() => window.location.hash === '#shinobi-record')
    pass('nav: browser forward to record')

    await page.reload({ waitUntil: 'domcontentloaded' })
    const afterReload = await page.getByTestId('title-selected-name').innerText()
    if (afterReload.includes('影丸')) pass('title: selection persists reload')
    else fail('title: selection persists reload', afterReload)

    await page.setViewportSize({ width: 320, height: 700 })
    await page.getByTestId('title-open-shinobi-record').click()
    await page.waitForSelector('[data-testid="shinobi-record-grid"]')
    const mobileCols = await page.evaluate(() => {
      const grid = document.querySelector('[data-testid="shinobi-record-grid"]')
      return grid
        ? getComputedStyle(grid).gridTemplateColumns.split(' ').length
        : 0
    })
    const scrollX = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 2,
    )
    await page.screenshot({
      path: join(SHOT_DIR, 'shinobi-record-mobile-320.png'),
      fullPage: false,
    })
    if (mobileCols === 2 && !scrollX) pass('page: mobile 2 columns no scroll')
    else fail('page: mobile 2 columns no scroll', `cols=${mobileCols} scroll=${scrollX}`)

    await context.close()

    if (consoleErrors.length === 0) pass('console: no errors')
    else fail('console: no errors', consoleErrors.slice(0, 5).join('\n'))
  } finally {
    await browser.close()
    preview.kill('SIGTERM')
  }
}

runChecks()
  .then(() => {
    console.log('\n=== Shinobi Record Page Browser Check ===')
    for (const p of results.passed) console.log('PASS:', p)
    for (const f of results.failed) console.log('FAIL:', f.name, '->', f.detail)
    if (results.failed.length > 0) process.exit(1)
  })
  .catch((error) => {
    console.error('runChecks error:', error)
    process.exit(2)
  })
