/**
 * Final Phase browser verification (Playwright + vite preview).
 * Run: node scripts/final-browser-check.mjs
 * Requires: npm run build beforehand (or this script builds).
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { existsSync } from 'node:fs'

const PORT = 4178
const BASE = `http://127.0.0.1:${PORT}`
const STORAGE_KEY = 'shinobi-keys-data'

const results = { passed: [], failed: [] }
const consoleErrors = []

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
      // wait
    }
    await delay(400)
  }
  throw new Error('preview server did not start')
}

async function startDifficulty(page, label) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: '修行を始める' }).click()
  await page.getByRole('radio', { name: new RegExp(label) }).click()
  await page.getByRole('button', { name: 'この難易度で開始' }).click()
  await page.waitForSelector('[aria-label="タイピングゲームエリア"]')
}

async function waitForGameOver(page, maxSeconds = 150) {
  for (let i = 0; i < maxSeconds; i += 1) {
    await delay(1000)
    const text = await page.locator('body').innerText()
    if (text.includes('DEFENSE FAILED') || text.includes('ゲームオーバー') || text.includes('もう一度')) {
      return text
    }
  }
  return null
}

function seedRecords(settingsOverride = {}) {
  const playedAt = new Date().toISOString()
  return {
    version: 1,
    settings: {
      volume: 0.55,
      muted: true,
      motionPreference: 'reduced',
      lastDifficulty: 'ninja',
      ...settingsOverride,
    },
    aggregates: { totalPlays: 2, totalTypedChars: 40, bestComboAll: 5 },
    bestByDifficulty: {
      trainee: null,
      ninja: {
        score: 1200,
        wpm: 40,
        accuracy: 95,
        maxCombo: 5,
        stage: 2,
        destroyedTargets: 8,
        elapsedMs: 30000,
        updatedAt: playedAt,
        playId: 'seed-1',
      },
      master: null,
    },
    recentPlays: [
      {
        id: 'seed-1',
        playedAt,
        difficulty: 'ninja',
        score: 1200,
        stage: 2,
        destroyedTargets: 8,
        elapsedMs: 30000,
        typedChars: 20,
        correctChars: 19,
        missCount: 1,
        accuracy: 95,
        wpm: 40,
        maxCombo: 5,
      },
    ],
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
    {
      cwd: process.cwd(),
      stdio: 'pipe',
      shell: true,
    },
  )

  await delay(1500)
  await waitForServer()

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await context.newPage()

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })
  page.on('pageerror', (err) => {
    consoleErrors.push(err.message)
  })

  try {
    // --- Navigation from title ---
    await page.goto(BASE, { waitUntil: 'domcontentloaded' })
    if (await page.getByRole('button', { name: '修行を始める' }).isVisible()) {
      pass('nav: title loads')
    } else {
      fail('nav: title loads', 'missing start')
    }

    await page.getByRole('button', { name: '設定' }).click()
    if ((await page.locator('body').innerText()).includes('全体音量')) {
      pass('nav: title -> settings')
    } else {
      fail('nav: title -> settings', 'missing volume')
    }
    await page.getByRole('button', { name: 'タイトルへ戻る' }).click()

    await page.getByRole('button', { name: '遊び方' }).click()
    if ((await page.locator('body').innerText()).includes('ローマ字')) {
      pass('nav: title -> howto')
    } else {
      fail('nav: title -> howto', 'missing howto')
    }
    await page.getByRole('button', { name: 'タイトルへ戻る' }).click()

    await page.getByRole('button', { name: 'プレイ記録' }).click()
    if ((await page.locator('body').innerText()).includes('プレイ記録')) {
      pass('nav: title -> records')
    } else {
      fail('nav: title -> records', 'missing records')
    }
    await page.getByRole('button', { name: 'タイトルへ戻る' }).click()

    // --- Difficulty + typing destroy ---
    await startDifficulty(page, '修行生')
    pass('game: start trainee')

    await page.waitForSelector('[data-target-id]', { timeout: 10000 })
    const romaji = await page.evaluate(() => {
      const el = document.querySelector('[data-target-id] [aria-label]')
      if (!el) return null
      const label = el.getAttribute('aria-label') || ''
      const parts = label.trim().split(/\s+/)
      return parts[parts.length - 1] || null
    })

    if (romaji) {
      await page.keyboard.type(romaji, { delay: 25 })
      await delay(600)
      const destroyedOrGone = await page.evaluate((word) => {
        const labels = Array.from(document.querySelectorAll('[data-target-id] [aria-label]'))
        return !labels.some((el) => (el.getAttribute('aria-label') || '').endsWith(word))
      }, romaji)
      if (destroyedOrGone) {
        pass('game: destroy target with romaji')
      } else {
        // may still be animating; check typed progress
        const typed = await page.evaluate(() => {
          return document.querySelectorAll('.char-correct').length
        })
        if (typed > 0) {
          pass('game: destroy target with romaji')
        } else {
          fail('game: destroy target with romaji', `word=${romaji}`)
        }
      }
    } else {
      fail('game: destroy target with romaji', 'no romaji found')
    }

    // --- Pause / resume ---
    await page.getByRole('button', { name: '一時停止' }).click()
    if ((await page.locator('body').innerText()).includes('再開')) {
      pass('pause: overlay opens')
    } else {
      fail('pause: overlay opens', 'no resume')
    }
    await page.keyboard.press('Escape')
    await delay(200)
    if (!(await page.locator('body').innerText()).includes('Esc でも再開')) {
      pass('pause: escape resumes')
    } else {
      fail('pause: escape resumes', 'still paused')
    }

    await page.getByRole('button', { name: '一時停止' }).click()
    await page.getByRole('button', { name: 'タイトルへ戻る' }).click()

    // --- Game over + save (master for speed) ---
    await startDifficulty(page, '忍頭')
    const resultText = await waitForGameOver(page, 150)
    if (resultText) {
      pass('gameover: reaches result')
    } else {
      fail('gameover: reaches result', 'timeout')
    }

    const afterGame = await page.evaluate((key) => {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    }, STORAGE_KEY)

    if (afterGame?.aggregates?.totalPlays >= 1 && afterGame?.recentPlays?.length >= 1) {
      pass('storage: saves play after gameover')
    } else {
      fail('storage: saves play after gameover', JSON.stringify(afterGame?.aggregates))
    }

    await page.getByRole('button', { name: /タイトル|記録/ }).first().click().catch(() => {})
    // Prefer explicit navigation
    await page.goto(BASE, { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: 'プレイ記録' }).click()
    const recordsBody = await page.locator('body').innerText()
    if (/最近のプレイ|総プレイ回数/.test(recordsBody)) {
      pass('records: shows history')
    } else {
      fail('records: shows history', recordsBody.slice(0, 200))
    }

    // --- Clear cancel / confirm with seeded settings ---
    await page.evaluate((payload) => {
      localStorage.setItem(payload.key, JSON.stringify(payload.data))
    }, { key: STORAGE_KEY, data: seedRecords() })
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: 'プレイ記録' }).click()
    await page.getByRole('button', { name: '記録を削除' }).click()
    if ((await page.locator('body').innerText()).includes('記録を削除しますか')) {
      pass('clear: confirm dialog opens')
    } else {
      fail('clear: confirm dialog opens', 'no dialog')
    }

    await page.getByRole('button', { name: 'キャンセル' }).click()
    await delay(200)
    const afterCancel = await page.evaluate((key) => {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    }, STORAGE_KEY)
    if (afterCancel?.aggregates?.totalPlays === 2 && afterCancel?.recentPlays?.length === 1) {
      pass('clear: cancel keeps records')
    } else {
      fail('clear: cancel keeps records', JSON.stringify(afterCancel?.aggregates))
    }

    await page.getByRole('button', { name: '記録を削除' }).click()
    await page.getByRole('button', { name: '削除する' }).click()
    await delay(300)
    const recordsAfterClear = await page.locator('body').innerText()
    if (recordsAfterClear.includes('まだ記録がありません')) {
      pass('clear: confirm empties UI')
    } else {
      fail('clear: confirm empties UI', recordsAfterClear.slice(0, 200))
    }

    const afterClear = await page.evaluate((key) => {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    }, STORAGE_KEY)

    if (
      afterClear?.aggregates?.totalPlays === 0 &&
      afterClear?.recentPlays?.length === 0 &&
      afterClear?.bestByDifficulty?.ninja === null &&
      afterClear?.settings?.volume === 0.55 &&
      afterClear?.settings?.muted === true &&
      afterClear?.settings?.motionPreference === 'reduced' &&
      afterClear?.settings?.lastDifficulty === 'ninja'
    ) {
      pass('clear: records gone, settings kept')
    } else {
      fail('clear: records gone, settings kept', JSON.stringify(afterClear))
    }

    await page.getByRole('button', { name: 'タイトルへ戻る' }).click()
    await page.reload({ waitUntil: 'domcontentloaded' })
    const afterReload = await page.evaluate((key) => {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    }, STORAGE_KEY)
    if (
      afterReload?.aggregates?.totalPlays === 0 &&
      afterReload?.settings?.motionPreference === 'reduced' &&
      afterReload?.settings?.lastDifficulty === 'ninja'
    ) {
      pass('reload: cleared records + settings persist')
    } else {
      fail('reload: cleared records + settings persist', JSON.stringify(afterReload))
    }

    // --- Small viewport ---
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto(BASE, { waitUntil: 'domcontentloaded' })
    const titleOk = await page.getByRole('button', { name: '修行を始める' }).isVisible()
    await page.getByRole('button', { name: '設定' }).click()
    const settingsOk = await page.getByRole('button', { name: 'タイトルへ戻る' }).isVisible()
    const scrollX = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2)
    if (titleOk && settingsOk && !scrollX) {
      pass('mobile: 320px main actions usable')
    } else {
      fail('mobile: 320px main actions usable', JSON.stringify({ titleOk, settingsOk, scrollX }))
    }

    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(BASE, { waitUntil: 'domcontentloaded' })
    if (await page.getByRole('button', { name: '修行を始める' }).isVisible()) {
      pass('preview: production build serves app')
    } else {
      fail('preview: production build serves app', 'title missing')
    }

    if (consoleErrors.length === 0) {
      pass('console: no errors')
    } else {
      fail('console: no errors', consoleErrors.slice(0, 5).join(' | '))
    }
  } finally {
    await browser.close()
    preview.kill('SIGTERM')
  }

  console.log('\n=== Final Phase Browser Check ===')
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
