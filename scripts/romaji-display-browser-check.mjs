/**
 * Romaji display follows the player's chosen pattern (sushi-da style).
 * Run: node scripts/romaji-display-browser-check.mjs
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const PORT = 4198
const BASE = `http://127.0.0.1:${PORT}`

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

async function forceProblem(page, problem) {
  await page.evaluate((next) => {
    window.__SHINOBI_KEYS_TEST__ = {
      ...(window.__SHINOBI_KEYS_TEST__ ?? {}),
      suppressSpawn: true,
      pauseMotion: true,
      requestImmediateSpawn: {
        freeze: true,
        spawnX: 50,
        yPercent: 42,
        remainingMs: 12000,
        forceProblem: {
          displayText: next.displayText,
          reading: next.reading,
          romaji: next.romaji,
          romajiPatterns: next.romajiPatterns ?? [next.romaji],
        },
      },
    }
  }, problem)
  await page.waitForSelector('[data-testid="enemy-romaji"]', { timeout: 6000 })
  await delay(80)
}

async function readRomaji(page) {
  return page.evaluate(() => {
    const el = document.querySelector('[data-testid="enemy-romaji"]')
    return (el?.textContent ?? '').replace(/\s+/g, '')
  })
}

async function typeSlow(page, word) {
  for (const ch of word) {
    await page.keyboard.press(ch)
    await delay(40)
  }
}

async function assertCase(page, { label, problem, steps }) {
  await startGame(page)
  await forceProblem(page, problem)
  const initial = await readRomaji(page)
  if (initial !== problem.romaji) {
    fail(`${label}: initial`, `${initial} !== ${problem.romaji}`)
    return
  }

  for (const step of steps) {
    await typeSlow(page, step.type)
    const shown = await readRomaji(page)
    if (shown === step.expect) {
      pass(`${label}: after "${step.prefix}" → ${step.expect}`)
    } else {
      fail(
        `${label}: after "${step.prefix}" → ${step.expect}`,
        `got ${shown}`,
      )
    }
  }
}

async function main() {
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

    await assertCase(page, {
      label: 'sushi→susi',
      problem: {
        displayText: 'すし',
        reading: 'すし',
        romaji: 'sushi',
        romajiPatterns: ['sushi', 'susi'],
      },
      steps: [
        { type: 's', prefix: 's', expect: 'sushi' },
        { type: 'u', prefix: 'su', expect: 'sushi' },
        { type: 's', prefix: 'sus', expect: 'sushi' },
        { type: 'i', prefix: 'susi', expect: 'susi' },
      ],
    })

    await assertCase(page, {
      label: 'shinobi→sinobi',
      problem: {
        displayText: 'しのび',
        reading: 'しのび',
        romaji: 'shinobi',
        romajiPatterns: ['shinobi', 'sinobi'],
      },
      steps: [
        { type: 's', prefix: 's', expect: 'shinobi' },
        { type: 'i', prefix: 'si', expect: 'sinobi' },
        { type: 'n', prefix: 'sin', expect: 'sinobi' },
      ],
    })

    await assertCase(page, {
      label: 'kansou→kannsou',
      problem: {
        displayText: '感想',
        reading: 'かんそう',
        romaji: 'kansou',
        romajiPatterns: ['kansou', 'kannsou'],
      },
      steps: [
        { type: 'kan', prefix: 'kan', expect: 'kansou' },
        { type: 'n', prefix: 'kann', expect: 'kannsou' },
      ],
    })
    if (consoleErrors.length === 0) pass('console errorなし')
    else fail('console errorなし', consoleErrors.join(' | '))

    console.log('\n=== romaji-display-browser-check ===')
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
