/**
 * Simplified result screen + HP/coins layout checks.
 * Run: node scripts/result-hud-layout-browser-check.mjs
 * Output: test-results/result-hud-layout/
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import path from 'node:path'

const PORT = 4201
const BASE = `http://127.0.0.1:${PORT}`
const OUT = path.join(process.cwd(), 'test-results', 'result-hud-layout')

const results = { passed: [], failed: [] }

function pass(name) {
  results.passed.push(name)
}

function fail(name, detail) {
  results.failed.push({ name, detail: String(detail) })
}

async function waitForServer() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(BASE)
      if (res.ok) return
    } catch {
      // wait
    }
    await delay(400)
  }
  throw new Error('preview server did not start')
}

async function startGame(page) {
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    window.__SHINOBI_KEYS_TEST__ = {
      suppressSpawn: true,
      pauseMotion: true,
    }
  })
  await page.getByRole('button', { name: /修行を始める/ }).first().click()
  await page.getByRole('radio', { name: /修行生/ }).click()
  await page.getByRole('button', { name: /この難易度で開始/ }).click()
  await page.waitForSelector('[data-testid="game-area"]', { timeout: 8000 })
}

async function forceSpawn(page) {
  await page.evaluate(() => {
    window.__SHINOBI_KEYS_TEST__ = {
      ...(window.__SHINOBI_KEYS_TEST__ ?? {}),
      suppressSpawn: true,
      pauseMotion: true,
      requestImmediateSpawn: {
        freeze: true,
        spawnX: 50,
        yPercent: 42,
        remainingMs: 9000,
        forceProblem: {
          displayText: 'あ',
          reading: 'あ',
          romaji: 'a',
        },
      },
    }
  })
  await page.waitForSelector('[data-testid="enemy-projectile"]', { timeout: 6000 })
  await delay(80)
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, name), fullPage: false })
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const preview = spawn(
    'npm',
    ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(PORT)],
    {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, BROWSER: 'none' },
    },
  )

  let browser
  try {
    await waitForServer()
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    const consoleErrors = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('pageerror', (err) => consoleErrors.push(String(err)))

    await startGame(page)
    await forceSpawn(page)
    const overlap = await page.evaluate(() => {
      const hp = document.querySelector('[data-testid="defense-gauge"]')
      const coins = document.querySelector('[data-testid="owned-coins"]')
      if (!hp || !coins) return { ok: false, reason: 'missing' }
      const a = hp.getBoundingClientRect()
      const b = coins.getBoundingClientRect()
      const overlaps = !(
        a.right < b.left ||
        a.left > b.right ||
        a.bottom < b.top ||
        a.top > b.bottom
      )
      return { ok: true, overlaps, a, b }
    })
    if (overlap.ok && !overlap.overlaps) pass('デスクトップでHPと所持コインが重ならない')
    else fail('デスクトップでHPと所持コインが重ならない', JSON.stringify(overlap))
    await shot(page, 'hud-hp-coins-desktop.png')

    await page.setViewportSize({ width: 320, height: 720 })
    await delay(200)
    const overlapMobile = await page.evaluate(() => {
      const hp = document.querySelector('[data-testid="defense-gauge"]')
      const coins = document.querySelector('[data-testid="owned-coins"]')
      if (!hp || !coins) return { ok: false, reason: 'missing' }
      const a = hp.getBoundingClientRect()
      const b = coins.getBoundingClientRect()
      const overlaps = !(
        a.right < b.left ||
        a.left > b.right ||
        a.bottom < b.top ||
        a.top > b.bottom
      )
      const overflow = document.documentElement.scrollWidth - window.innerWidth
      return { ok: true, overlaps, overflow }
    })
    if (overlapMobile.ok && !overlapMobile.overlaps) {
      pass('320pxでHPと所持コインが重ならない')
    } else fail('320pxでHPと所持コインが重ならない', JSON.stringify(overlapMobile))
    if (overlapMobile.ok && overlapMobile.overflow <= 1) pass('320pxで横スクロールなし')
    else fail('320pxで横スクロールなし', JSON.stringify(overlapMobile))
    await shot(page, 'hud-hp-coins-mobile-320.png')

    await page.setViewportSize({ width: 1280, height: 800 })
    await startGame(page)
    await forceSpawn(page)
    await page.keyboard.press('a')
    await delay(500)
    await page.evaluate(() => {
      window.__SHINOBI_KEYS_TEST__.forceEndGame = true
    })
    await page.waitForSelector('[data-testid="result-summary"]', { timeout: 8000 })

    const resultCheck = await page.evaluate(() => {
      const text = document.body.innerText
      return {
        score: Boolean(document.querySelector('[data-testid="result-score"]')),
        miss: Boolean(document.querySelector('[data-testid="result-miss"]')),
        success: Boolean(document.querySelector('[data-testid="result-success-rate"]')),
        correct: Boolean(document.querySelector('[data-testid="result-correct-keys"]')),
        kps: Boolean(document.querySelector('[data-testid="result-kps"]')),
        coins: Boolean(document.querySelector('[data-testid="result-total-coins"]')),
        banned: [
          'NEW BEST',
          '前回プレイとの比較',
          '撃破ボーナス',
          '連続成功コイン',
          '成績ボーナス',
          '今回の合計',
          '現在の所持コイン',
          'WPM',
          '最大コンボ',
          '撃破数',
        ].filter((label) => text.includes(label)),
      }
    })

    if (resultCheck.score) pass('スコアが表示される')
    else fail('スコアが表示される', 'missing')
    if (resultCheck.miss) pass('ミス入力数が表示される')
    else fail('ミス入力数が表示される', 'missing')
    if (resultCheck.success) pass('成功率が表示される')
    else fail('成功率が表示される', 'missing')
    if (resultCheck.correct) pass('正しく打ったキー数が表示される')
    else fail('正しく打ったキー数が表示される', 'missing')
    if (resultCheck.kps) pass('平均キータイプ数が表示される')
    else fail('平均キータイプ数が表示される', 'missing')
    if (resultCheck.coins) pass('獲得コイン数が表示される')
    else fail('獲得コイン数が表示される', 'missing')
    if (resultCheck.banned.length === 0) pass('リザルトに不要な項目が表示されない')
    else fail('リザルトに不要な項目が表示されない', resultCheck.banned.join(','))

    await shot(page, 'result-simple-desktop.png')

    if (consoleErrors.length === 0) pass('console errorなし')
    else fail('console errorなし', consoleErrors.join(' | '))

    console.log('\n=== result-hud-layout-browser-check ===')
    console.log(`passed: ${results.passed.length}`)
    console.log(`failed: ${results.failed.length}`)
    for (const name of results.passed) console.log(`  PASS ${name}`)
    for (const item of results.failed) console.log(`  FAIL ${item.name}: ${item.detail}`)
    if (results.failed.length > 0) process.exitCode = 1
  } catch (error) {
    console.error(error)
    process.exitCode = 1
  } finally {
    if (browser) await browser.close()
    preview.kill('SIGTERM')
  }
}

main()
