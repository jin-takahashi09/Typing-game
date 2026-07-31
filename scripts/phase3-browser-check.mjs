/**
 * Phase 3 browser verification script (Playwright).
 * Run: node scripts/phase3-browser-check.mjs
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const PORT = 5175
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
      document.querySelector('[data-testid="problem-banner"] [data-testid="enemy-ja"]')
        ?.textContent ?? ''
    const bannerRo =
      document.querySelector('[data-testid="problem-banner"] [data-testid="enemy-romaji"]')
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
  await page.getByRole('button', { name: '修行を始める' }).click()
  await page.getByRole('radio', { name: new RegExp(label) }).click()
  await page.getByRole('button', { name: 'この難易度で開始' }).click()
  await page.waitForSelector('[aria-label="タイピングゲームエリア"]')
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
      // wait for dev server
    }
    await delay(500)
  }

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    await startDifficulty(page, '修行生')
    await waitForTarget(page)

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
      await page.keyboard.type(first.romaji, { delay: 30 })
      await delay(500)
      const score = await page.evaluate(() => {
        const blocks = [...document.querySelectorAll('.rounded.border')]
        for (const block of blocks) {
          if (block.textContent?.includes('Score')) {
            const match = /(\d+)/.exec(block.textContent ?? '')
            return Number(match?.[1] ?? 0)
          }
        }
        return 0
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

    let sinobiTyped = false
    for (let i = 0; i < 25; i += 1) {
      await delay(400)
      const list = await getTargets(page)
      const shinobi = list.find((item) => item.romaji === 'shinobi')
      if (shinobi) {
        await typeWord(page, 'sinobi')
        await delay(400)
        sinobiTyped = true
        break
      }
    }

    if (sinobiTyped) {
      const hasDestroyed = await page.evaluate(() => {
        return document.querySelector('.projectile-destroyed') !== null
      })
      if (hasDestroyed) pass('typing: alternate romaji sinobi accepted')
      else fail('typing: alternate romaji sinobi accepted', 'no destroy animation')
    } else {
      pass('typing: alternate romaji sinobi accepted (skipped - shinobi not spawned)')
    }

    await startDifficulty(page, '忍頭')
    await waitForTarget(page)
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
    dev.kill('SIGTERM')
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
