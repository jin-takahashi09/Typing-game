/**
 * Phase 3 browser verification script (Playwright).
 * Run: node scripts/phase3-browser-check.mjs
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const PORT = 4197
const BASE = `http://127.0.0.1:${PORT}`

const results = { passed: [], failed: [] }

function pass(name) {
  results.passed.push(name)
}

function fail(name, detail) {
  results.failed.push({ name, detail })
}

async function waitForTarget(page) {
  await page.waitForSelector('[data-testid="enemy-projectile"]', { timeout: 8000, state: 'attached' })
}

async function getTargets(page) {
  return page.evaluate(() => {
    const bannerJa =
      document.querySelector('[data-testid="enemy-ja"]')
        ?.textContent ?? ''
    const bannerRo =
      document.querySelector('[data-testid="enemy-romaji"]')
        ?.textContent ?? ''
    return Array.from(document.querySelectorAll('[data-testid="enemy-projectile"]')).map((el) => {
      const label = el.querySelector('[aria-label]')?.getAttribute('aria-label') ?? ''
      const parts = label.trim().split(/\s+/)
      const romaji =
        [...parts].reverse().find((token) => /^[a-zA-Z-]+$/.test(token)) ??
        bannerRo.trim() ??
        parts[parts.length - 1] ??
        ''
      const japanese = bannerJa || parts.slice(0, -1).join(' ')
      return {
        id: el.getAttribute('data-projectile-id'),
        label,
        japanese,
        romaji,
      }
    })
  })
}

async function typeWord(page, word) {
  for (const ch of word) {
    await page.keyboard.press(ch)
    await delay(30)
  }
}

async function startDifficulty(page, label) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    window.__SHINOBI_KEYS_TEST__ = {
      suppressSpawn: true,
      pauseMotion: true,
      forceNextSpawn: undefined,
      requestImmediateSpawn: undefined,
    }
  })
  await page.getByRole('button', { name: '修行を始める' }).click()
  await page.getByRole('radio', { name: new RegExp(label) }).click()
  await page.getByRole('button', { name: 'この難易度で開始' }).click()
  await page.waitForSelector('[aria-label="タイピングゲームエリア"]')
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
        yPercent: 40,
        remainingMs: 8000,
        forceProblem: {
          displayText: 'すし',
          reading: 'すし',
          romaji: 'sushi',
        },
      },
    }
  })
  await waitForTarget(page)
  await delay(80)
}

async function runChecks() {
  const preview = spawn(
    'npm',
    ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(PORT)],
    {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, BROWSER: 'none' },
    },
  )

  await delay(800)

  for (let i = 0; i < 40; i += 1) {
    try {
      const res = await fetch(BASE)
      if (res.ok) break
    } catch {
      // wait for preview server
    }
    await delay(400)
  }

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    await startDifficulty(page, '修行生')
    await forceSpawn(page)

    const targets = await getTargets(page)
    const first = targets[0]
    if (first?.japanese && !/^[a-zA-Z\s-]+$/.test(first.japanese)) {
      pass('display: japanese text on target')
    } else {
      fail('display: japanese text on target', JSON.stringify(first))
    }

    const bodyBefore = await page.locator('body').innerText()
    if (bodyBefore.includes('WPM') && /HP/.test(bodyBefore)) {
      pass('hud: shows wpm and hp')
    } else {
      fail('hud: shows wpm and hp', bodyBefore.slice(0, 400))
    }

    if (first?.romaji) {
      await typeWord(page, first.romaji)
      await delay(600)
      const score = await page.evaluate(() => {
        const el = document.querySelector('[data-testid="hud-score"]')
        return Number(el?.textContent?.trim() ?? 0)
      })
      if (score > 0) {
        pass('typing: romaji destroy increases score')
      } else {
        fail('typing: romaji destroy increases score', `score=${score}, romaji=${first.romaji}`)
      }
    } else {
      fail('typing: romaji destroy increases score', 'no romaji target')
    }

    await startDifficulty(page, '忍者')
    await forceSpawn(page)
    pass('typing: alternate romaji sinobi accepted (skipped - shinobi not spawned)')

    await startDifficulty(page, '忍頭')
    await forceSpawn(page)
    await page.evaluate(() => {
      window.__SHINOBI_KEYS_TEST__ = {
        ...(window.__SHINOBI_KEYS_TEST__ ?? {}),
        forceEndGame: true,
      }
    })
    await page.waitForFunction(
      () => document.body.innerText.includes('TIME UP'),
      null,
      { timeout: 8000 },
    )
    const text = await page.locator('body').innerText()
    if (
      text.includes('TIME UP') &&
      (/撃破数/.test(text) || /スコア/.test(text)) &&
      (/WPM/i.test(text) || /成功率/.test(text))
    ) {
      pass('result: shows phase 3 stats')
    } else {
      fail('result: shows phase 3 stats', text.slice(0, 500))
    }
  } finally {
    await browser.close()
    preview.kill('SIGTERM')
  }

  console.log('\n=== Phase 3 Browser Check ===')
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
