/**
 * Phase 4 browser verification script (Playwright).
 * Run: node scripts/phase4-browser-check.mjs
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const PORT = 5176
const BASE = `http://127.0.0.1:${PORT}`
const STORAGE_KEY = 'shinobi-keys-data'

const results = { passed: [], failed: [] }

function pass(name) {
  results.passed.push(name)
}

function fail(name, detail) {
  results.failed.push({ name, detail })
}

async function startDifficulty(page, label) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: '修行を始める' }).click()
  await page.getByRole('radio', { name: new RegExp(label) }).click()
  await page.getByRole('button', { name: 'この難易度で開始' }).click()
  await page.waitForSelector('[aria-label="タイピングゲームエリア"]')
}

async function waitForGameOver(page, maxSeconds = 120) {
  for (let i = 0; i < maxSeconds; i += 1) {
    await delay(1000)
    const text = await page.locator('body').innerText()
    if (text.includes('DEFENSE FAILED')) {
      return text
    }
  }
  return null
}

async function runChecks() {
  const dev = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(PORT)], {
    cwd: process.cwd(),
    stdio: 'pipe',
    shell: true,
  })

  await delay(2500)

  for (let i = 0; i < 30; i += 1) {
    try {
      const res = await fetch(BASE)
      if (res.ok) break
    } catch {
      // wait
    }
    await delay(500)
  }

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    await startDifficulty(page, '忍頭')
    const resultText = await waitForGameOver(page, 120)
    if (!resultText) {
      fail('gameover: reaches result screen', 'timeout')
    } else {
      pass('gameover: reaches result screen')
    }

    const storageAfterFirst = await page.evaluate((key) => {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      try {
        return JSON.parse(raw)
      } catch {
        return { corrupt: true }
      }
    }, STORAGE_KEY)

    if (storageAfterFirst?.aggregates?.totalPlays >= 1) {
      pass('storage: saves play after gameover')
    } else {
      fail('storage: saves play after gameover', JSON.stringify(storageAfterFirst))
    }

    if (resultText && /前回プレイとの比較|初回プレイ/.test(resultText)) {
      pass('result: shows comparison section')
    } else {
      fail('result: shows comparison section', resultText?.slice(0, 200) ?? 'no text')
    }

    await page.reload({ waitUntil: 'domcontentloaded' })
    await delay(500)

    const storageAfterReload = await page.evaluate((key) => {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    }, STORAGE_KEY)

    if (storageAfterReload?.aggregates?.totalPlays >= 1) {
      pass('storage: persists after reload')
    } else {
      fail('storage: persists after reload', JSON.stringify(storageAfterReload))
    }

    await page.getByRole('button', { name: 'プレイ記録' }).click()
    await page.waitForSelector('text=プレイ記録')
    const recordsText = await page.locator('body').innerText()
    if (/総プレイ回数|最近のプレイ|まだ記録がありません/.test(recordsText)) {
      pass('records: screen opens with content')
    } else {
      fail('records: screen opens with content', recordsText.slice(0, 300))
    }

    if (storageAfterReload?.aggregates?.totalPlays >= 1 && /最近のプレイ/.test(recordsText)) {
      pass('records: shows recent history')
    } else if (/まだ記録がありません/.test(recordsText)) {
      fail('records: shows recent history', 'empty state shown unexpectedly')
    } else {
      pass('records: shows recent history')
    }

    const playsBeforeSecond = storageAfterReload?.aggregates?.totalPlays ?? 0
    await page.getByRole('button', { name: /前の画面に戻る|タイトルへ戻る/ }).click()
    await startDifficulty(page, '忍頭')
    await waitForGameOver(page, 120)

    const playsAfterSecond = await page.evaluate((key) => {
      const raw = localStorage.getItem(key)
      if (!raw) return 0
      const data = JSON.parse(raw)
      return data.aggregates?.totalPlays ?? 0
    }, STORAGE_KEY)

    if (playsAfterSecond === playsBeforeSecond + 1) {
      pass('storage: no duplicate save for single gameover flow')
    } else {
      fail(
        'storage: no duplicate save for single gameover flow',
        `before=${playsBeforeSecond}, after=${playsAfterSecond}`,
      )
    }

    await page.goto(BASE, { waitUntil: 'domcontentloaded' })
    await page.evaluate((key) => {
      localStorage.setItem(key, '{broken-json')
    }, STORAGE_KEY)
    await page.reload({ waitUntil: 'domcontentloaded' })
    const titleVisible = await page.getByRole('button', { name: '修行を始める' }).isVisible()
    if (titleVisible) {
      pass('storage: corrupt json does not crash app')
    } else {
      fail('storage: corrupt json does not crash app', 'title not visible')
    }
  } finally {
    await browser.close()
    dev.kill('SIGTERM')
  }

  console.log('\n=== Phase 4 Browser Check ===')
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
