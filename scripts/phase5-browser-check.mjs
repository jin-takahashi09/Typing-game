/**
 * Phase 5 browser verification script (Playwright).
 * Run: node scripts/phase5-browser-check.mjs
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const PORT = 5177
const BASE = `http://127.0.0.1:${PORT}`
const STORAGE_KEY = 'shinobi-keys-data'

const results = { passed: [], failed: [] }

function pass(name) {
  results.passed.push(name)
}

function fail(name, detail) {
  results.failed.push({ name, detail })
}

async function waitForServer() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const res = await fetch(BASE)
      if (res.ok) return
    } catch {
      // wait
    }
    await delay(400)
  }
  throw new Error('dev server did not start')
}

async function startMaster(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: '修行を始める' }).click()
  await page.getByRole('radio', { name: /忍頭/ }).click()
  await page.getByRole('button', { name: 'この難易度で開始' }).click()
  await page.waitForSelector('[aria-label="タイピングゲームエリア"]')
}

async function runChecks() {
  const dev = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(PORT)], {
    cwd: process.cwd(),
    stdio: 'pipe',
    shell: true,
  })

  await delay(2000)
  await waitForServer()

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' })

    await page.getByRole('button', { name: '設定' }).click()
    if ((await page.locator('body').innerText()).includes('全体音量')) {
      pass('nav: title -> settings')
    } else {
      fail('nav: title -> settings', 'missing volume')
    }

    await page.locator('input[type="range"]').fill('40')
    await page.getByLabel('ミュート').check()
    await page.getByText('軽減', { exact: true }).click()
    await page.getByRole('button', { name: /前の画面に戻る|タイトルへ戻る/ }).click()

    await page.reload({ waitUntil: 'domcontentloaded' })
    const stored = await page.evaluate((key) => {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    }, STORAGE_KEY)

    if (
      stored?.settings?.volume === 0.4 &&
      stored?.settings?.muted === true &&
      stored?.settings?.motionPreference === 'reduced'
    ) {
      pass('settings: persist after reload')
    } else {
      fail('settings: persist after reload', JSON.stringify(stored?.settings))
    }

    await page.getByRole('button', { name: '遊び方' }).click()
    const howto = await page.locator('body').innerText()
    if (howto.includes('ローマ字') && howto.includes('一時停止')) {
      pass('nav: title -> howto')
    } else {
      fail('nav: title -> howto', howto.slice(0, 200))
    }
    await page.getByRole('button', { name: /前の画面に戻る|タイトルへ戻る/ }).click()

    await startMaster(page)
    await page.waitForSelector('[data-target-id]', { timeout: 8000 })
    await delay(200)
    await page.getByRole('button', { name: '一時停止' }).click()
    if ((await page.locator('body').innerText()).includes('一時停止')) {
      pass('pause: overlay opens')
    } else {
      fail('pause: overlay opens', 'no overlay text')
    }

    const yBefore = await page.evaluate(() => {
      const el = document.querySelector('[data-target-id]')
      if (!el) return null
      const datasetY = el.dataset.fallY
      if (datasetY) return Number(datasetY)
      const transform = el.style.transform || ''
      const match = /translate3d\(-50%,\s*([-\d.]+)px/.exec(transform)
      return match ? Number(match[1]) : null
    })
    await delay(800)
    const yAfter = await page.evaluate(() => {
      const el = document.querySelector('[data-target-id]')
      if (!el) return null
      const datasetY = el.dataset.fallY
      if (datasetY) return Number(datasetY)
      const transform = el.style.transform || ''
      const match = /translate3d\(-50%,\s*([-\d.]+)px/.exec(transform)
      return match ? Number(match[1]) : null
    })
    if (yBefore !== null && yAfter !== null && yBefore === yAfter) {
      pass('pause: targets do not fall')
    } else {
      fail('pause: targets do not fall', JSON.stringify({ yBefore, yAfter }))
    }

    await page.keyboard.press('Escape')
    await delay(200)
    if (!(await page.locator('body').innerText()).includes('Esc でも再開')) {
      pass('pause: escape resumes')
    } else {
      fail('pause: escape resumes', 'overlay still visible')
    }

    await page.getByRole('button', { name: '一時停止' }).click()
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await delay(100)
    // already paused; resume then hide
    await page.getByRole('button', { name: '再開' }).click()
    await delay(100)
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await delay(200)
    if ((await page.locator('body').innerText()).includes('再開')) {
      pass('visibility: auto pause')
    } else {
      fail('visibility: auto pause', 'not paused')
    }

    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => false,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await delay(200)
    if ((await page.locator('body').innerText()).includes('再開')) {
      pass('visibility: no auto resume')
    } else {
      fail('visibility: no auto resume', 'auto resumed')
    }

    await page.getByRole('button', { name: /前の画面に戻る|タイトルへ戻る/ }).click()
    await startMaster(page)
    await page.getByRole('button', { name: '一時停止' }).click()
    await page.getByRole('button', { name: '最初からやり直す' }).click()
    await page.waitForSelector('[aria-label="タイピングゲームエリア"]')
    pass('retry: remount without crash')

    await page.evaluate((key) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          settings: { volume: 0, muted: true, motionPreference: 'full', lastDifficulty: null },
          aggregates: { totalPlays: 0, totalTypedChars: 0, bestComboAll: 0 },
          bestByDifficulty: { trainee: null, ninja: null, master: null },
          recentPlays: [],
        }),
      )
    }, STORAGE_KEY)
    await page.goto(BASE, { waitUntil: 'domcontentloaded' })
    if (await page.getByRole('button', { name: '修行を始める' }).isVisible()) {
      pass('audio muted: app still loads')
    } else {
      fail('audio muted: app still loads', 'title missing')
    }
  } finally {
    await browser.close()
    dev.kill('SIGTERM')
  }

  console.log('\n=== Phase 5 Browser Check ===')
  console.log(`Passed: ${results.passed.length}`)
  results.passed.forEach((name) => console.log(`  ✓ ${name}`))
  if (results.failed.length > 0) {
    console.log(`Failed: ${results.failed.length}`)
    results.failed.forEach(({ name, detail }) => console.log(`  ✗ ${name}: ${detail}`))
    process.exitCode = 1
  }
}

runChecks().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
