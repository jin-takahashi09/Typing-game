/**
 * Romaji nowrap display checks + screenshots.
 * Run: node scripts/romaji-nowrap-browser-check.mjs
 * Output: test-results/romaji-nowrap/
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import path from 'node:path'

const PORT = 4199
const BASE = `http://127.0.0.1:${PORT}`
const OUT = path.join(process.cwd(), 'test-results', 'romaji-nowrap')

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
      forceNextSpawn: undefined,
      requestImmediateSpawn: undefined,
    }
  })
  await page.getByRole('button', { name: /修行を始める/ }).first().click()
  await page.getByRole('radio', { name: /修行生/ }).click()
  await page.getByRole('button', { name: /この難易度で開始/ }).click()
  await page.waitForSelector('[data-testid="game-area"]', { timeout: 8000 })
}

async function forceProblem(page, problem, spawnX = 50) {
  await page.evaluate(
    ({ next, x }) => {
      window.__SHINOBI_KEYS_TEST__ = {
        ...(window.__SHINOBI_KEYS_TEST__ ?? {}),
        suppressSpawn: true,
        pauseMotion: true,
        requestImmediateSpawn: {
          freeze: true,
          spawnX: x,
          yPercent: 40,
          remainingMs: 12000,
          forceProblem: {
            displayText: next.displayText,
            reading: next.reading,
            romaji: next.romaji,
            romajiPatterns: next.romajiPatterns ?? [next.romaji],
          },
        },
      }
    },
    { next: problem, x: spawnX },
  )
  await page.waitForSelector('[data-testid="enemy-romaji"]', { timeout: 6000 })
  await delay(100)
}

async function readRomajiMetrics(page) {
  return page.evaluate(() => {
    const el = document.querySelector('[data-testid="enemy-romaji"]')
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const spans = [...el.querySelectorAll('span')]
    const tops = spans.map((span) => Math.round(span.getBoundingClientRect().top))
    const uniqueTops = [...new Set(tops)]
    const style = getComputedStyle(el)
    return {
      text: (el.textContent ?? '').replace(/\s+/g, ''),
      height: rect.height,
      width: rect.width,
      left: rect.left,
      right: rect.right,
      uniqueTops,
      whiteSpace: style.whiteSpace,
      wordBreak: style.wordBreak,
      flexWrap: style.flexWrap,
      fontSize: Number.parseFloat(style.fontSize),
      lineHeight: Number.parseFloat(style.lineHeight),
    }
  })
}

function assertSingleLine(metrics, label) {
  if (!metrics) {
    fail(label, 'missing romaji')
    return false
  }
  if (metrics.uniqueTops.length !== 1) {
    fail(label, `span tops=${JSON.stringify(metrics.uniqueTops)}`)
    return false
  }
  const maxOneLine = metrics.lineHeight * 1.45 || metrics.fontSize * 2
  if (metrics.height > maxOneLine) {
    fail(label, `height=${metrics.height} font=${metrics.fontSize}`)
    return false
  }
  if (metrics.whiteSpace !== 'nowrap') {
    fail(label, `white-space=${metrics.whiteSpace}`)
    return false
  }
  pass(label)
  return true
}

async function typeSlow(page, word) {
  for (const ch of word) {
    await page.keyboard.press(ch)
    await delay(35)
  }
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
    await forceProblem(page, {
      displayText: 'スーパー',
      reading: 'すーぱー',
      romaji: 'su-pa-',
    })
    let metrics = await readRomajiMetrics(page)
    if (metrics?.text === 'su-pa-') pass('su-pa-が表示される')
    else fail('su-pa-が表示される', JSON.stringify(metrics))
    assertSingleLine(metrics, 'su-pa-が1行で表示される')
    await shot(page, 'super-desktop.png')

    await startGame(page)
    await forceProblem(page, {
      displayText: 'ラーメン',
      reading: 'らーめん',
      romaji: 'ra-men',
    })
    metrics = await readRomajiMetrics(page)
    if (metrics?.text === 'ra-men') pass('ra-menが表示される')
    else fail('ra-menが表示される', JSON.stringify(metrics))
    assertSingleLine(metrics, 'ra-menが1行で表示される')
    await shot(page, 'ramen-nowrap.png')

    await startGame(page)
    await forceProblem(page, {
      displayText: 'コーヒー',
      reading: 'こーひー',
      romaji: 'ko-hi-',
    })
    metrics = await readRomajiMetrics(page)
    assertSingleLine(metrics, 'ko-hi-が1行で表示される')

    await startGame(page)
    await forceProblem(
      page,
      {
        displayText: 'パフォーマンス',
        reading: 'ぱふぉーまんす',
        romaji: 'pafo-mansu',
      },
      18,
    )
    metrics = await readRomajiMetrics(page)
    assertSingleLine(metrics, '長いローマ字も途中改行しない')
    if (metrics && metrics.left >= -2 && metrics.right <= 1282) {
      pass('長いローマ字が画面内に表示される')
    } else fail('長いローマ字が画面内に表示される', JSON.stringify(metrics))
    await shot(page, 'long-romaji-nowrap.png')

    // hyphen / span boundaries: type part of su-pa-
    await startGame(page)
    await forceProblem(page, {
      displayText: 'スーパー',
      reading: 'すーぱー',
      romaji: 'su-pa-',
    })
    await typeSlow(page, 'su-')
    metrics = await readRomajiMetrics(page)
    assertSingleLine(metrics, 'ハイフン前後・入力済み境界で改行しない')

    await startGame(page)
    await forceProblem(page, {
      displayText: 'すし',
      reading: 'すし',
      romaji: 'sushi',
      romajiPatterns: ['sushi', 'susi'],
    })
    await typeSlow(page, 'susi')
    metrics = await readRomajiMetrics(page)
    if (metrics?.text === 'susi') pass('sushiからsusiへ切り替わる')
    else fail('sushiからsusiへ切り替わる', JSON.stringify(metrics))
    assertSingleLine(metrics, 'sushi→susiでも1行')
    await shot(page, 'candidate-switch-nowrap.png')

    await startGame(page)
    await forceProblem(page, {
      displayText: 'しのび',
      reading: 'しのび',
      romaji: 'shinobi',
      romajiPatterns: ['shinobi', 'sinobi'],
    })
    await typeSlow(page, 'sin')
    metrics = await readRomajiMetrics(page)
    if (metrics?.text === 'sinobi') pass('shinobiからsinobiへ切り替わる')
    else fail('shinobiからsinobiへ切り替わる', JSON.stringify(metrics))
    assertSingleLine(metrics, 'shinobi→sinobiでも1行')

    await startGame(page)
    await forceProblem(page, {
      displayText: '感想',
      reading: 'かんそう',
      romaji: 'kansou',
      romajiPatterns: ['kansou', 'kannsou'],
    })
    await typeSlow(page, 'kann')
    metrics = await readRomajiMetrics(page)
    if (metrics?.text === 'kannsou') pass('kansouからkannsouへ切り替わる')
    else fail('kansouからkannsouへ切り替わる', JSON.stringify(metrics))
    assertSingleLine(metrics, 'kansou→kannsouでも1行')

    await page.setViewportSize({ width: 320, height: 720 })
    await startGame(page)
    await forceProblem(page, {
      displayText: 'スーパー',
      reading: 'すーぱー',
      romaji: 'su-pa-',
    })
    metrics = await readRomajiMetrics(page)
    assertSingleLine(metrics, '320pxでもsu-pa-が1行')
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    if (overflow <= 1) pass('320pxで横スクロールなし')
    else fail('320pxで横スクロールなし', String(overflow))
    if (metrics && metrics.left >= -2 && metrics.right <= 322) {
      pass('320pxで全文字が画面内')
    } else fail('320pxで全文字が画面内', JSON.stringify(metrics))
    await shot(page, 'super-mobile-320.png')

    if (consoleErrors.length === 0) pass('console errorなし')
    else fail('console errorなし', consoleErrors.join(' | '))

    console.log('\n=== romaji-nowrap-browser-check ===')
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
