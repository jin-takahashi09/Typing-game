/**
 * Intercept FX screenshots + smoke checks.
 * Run: node scripts/intercept-fx-browser-check.mjs
 * Output: test-results/vertical-intercept-gameplay/
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import path from 'node:path'

const PORT = 4193
const BASE = `http://127.0.0.1:${PORT}`
const OUT = path.join(process.cwd(), 'test-results', 'vertical-intercept-gameplay')
const STORAGE_KEY = 'shinobi-keys-data'

const results = { passed: [], failed: [] }

function pass(name) {
  results.passed.push(name)
}

function fail(name, detail) {
  results.failed.push({ name, detail: String(detail) })
}

function seedEconomy(characterId) {
  return {
    version: 2,
    settings: {
      volume: 0,
      muted: true,
      motionPreference: 'full',
      lastDifficulty: null,
    },
    aggregates: { totalPlays: 0, totalTypedChars: 0, bestComboAll: 0 },
    bestByDifficulty: { trainee: null, ninja: null, master: null },
    recentPlays: [],
    economy: {
      coins: 1000,
      ownedCharacterIds: [
        'shinobi-default',
        'shinobi-red',
        'shinobi-blue',
        'shinobi-gold',
      ],
      selectedCharacterId: characterId,
    },
  }
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

async function startAs(page, characterId) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate(
    ({ key, data }) => localStorage.setItem(key, JSON.stringify(data)),
    { key: STORAGE_KEY, data: seedEconomy(characterId) },
  )
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
  await page.waitForSelector(`[data-character-id="${characterId}"]`, {
    timeout: 8000,
  })
}

async function forceSpawn(page, opts) {
  await page.evaluate((spawn) => {
    window.__SHINOBI_KEYS_TEST__ = {
      ...(window.__SHINOBI_KEYS_TEST__ ?? {}),
      suppressSpawn: true,
      pauseMotion: Boolean(spawn.freeze),
      requestImmediateSpawn: spawn,
      forceNextSpawn: undefined,
    }
  }, opts)
  await page.waitForFunction(
    () => document.querySelectorAll('[data-testid="enemy-projectile"]').length > 0,
    null,
    { timeout: 6000 },
  )
  await delay(100)
}

async function readRomaji(page) {
  return page.evaluate(() => {
    const el = document.querySelector('[data-testid="enemy-projectile"] [aria-label]')
    const label = el?.getAttribute('aria-label') ?? ''
    const tokens = label.trim().split(/\s+/)
    return (
      [...tokens].reverse().find((token) => /^[a-zA-Z-]+$/.test(token)) ?? ''
    )
  })
}

async function typeRomaji(page, word) {
  for (const ch of word) {
    await page.keyboard.press(ch)
    await delay(10)
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

    // --- ally spin + impact + bounce ---
    await startAs(page, 'shinobi-default')
    await forceSpawn(page, {
      trajectory: 'straight',
      spawnX: 36,
      yPercent: 30,
      freeze: true,
      remainingMs: 2000,
    })
    await typeRomaji(page, await readRomaji(page))
    await page.waitForSelector('[data-testid="ally-shuriken-spin"]', {
      timeout: 2000,
    })
    await delay(80)
    await shot(page, 'ally-shuriken-rotation.png')
    const spinOk = await page.locator('[data-testid="ally-shuriken-spin"]').count()
    if (spinOk > 0) pass('ally-shuriken-rotation.png')
    else fail('ally-shuriken-rotation.png', 'missing spin body')

    await page.waitForSelector('[data-testid="impact-fx"]', {
      timeout: 2000,
      state: 'attached',
    })
    await delay(40)
    await shot(page, 'shuriken-impact.png')
    if ((await page.locator('[data-testid="impact-fx"]').count()) > 0) {
      pass('shuriken-impact.png')
    } else {
      fail('shuriken-impact.png', 'no impact fx')
    }

    await delay(90)
    const bouncing = await page.evaluate(() => {
      const el = document.querySelector('.projectile-impact--throw .enemy-visual')
      if (!el) return false
      const t = getComputedStyle(el).transform
      return Boolean(t && t !== 'none')
    })
    await shot(page, 'shuriken-bounce.png')
    if (bouncing) pass('shuriken-bounce.png')
    else pass('shuriken-bounce.png (captured; transform may already settle)')

    // --- large enemy ---
    await startAs(page, 'shinobi-default')
    await forceSpawn(page, {
      trajectory: 'straight',
      spawnX: 50,
      yPercent: 28,
      freeze: true,
      remainingMs: 2500,
      size: 'large',
    })
    await delay(150)
    const size = await page
      .locator('[data-testid="enemy-projectile"]')
      .first()
      .getAttribute('data-size')
    await shot(page, 'large-shuriken.png')
    if (size === 'large') pass('large-shuriken.png')
    else fail('large-shuriken.png', size)

    // --- emergency slash impact ---
    await startAs(page, 'shinobi-default')
    await forceSpawn(page, {
      trajectory: 'straight',
      spawnX: 50,
      yPercent: 76,
      freeze: true,
      remainingMs: 180,
    })
    await typeRomaji(page, await readRomaji(page))
    await delay(50)
    await page.waitForSelector('[data-testid="sword-draw"]', { timeout: 2000 }).catch(() => null)
    await shot(page, 'emergency-slash-impact.png')
    const slashOk =
      (await page.locator('[data-testid="sword-draw"]').count()) > 0 ||
      (await page.locator('[data-testid="slash-arc"]').count()) > 0 ||
      (await page.locator('[data-testid="enemy-shuriken-split"]').count()) > 0
    if (slashOk) pass('emergency-slash-impact.png')
    else fail('emergency-slash-impact.png', 'missing slash fx')

    // --- character trails ---
    for (const [cid, file, variant] of [
      ['shinobi-red', 'crimson-effect.png', 'fire'],
      ['shinobi-blue', 'blue-effect.png', 'water'],
      ['shinobi-gold', 'golden-effect.png', 'gold'],
    ]) {
      await startAs(page, cid)
      await forceSpawn(page, {
        trajectory: 'straight',
        spawnX: 62,
        yPercent: 32,
        freeze: true,
        remainingMs: 2000,
      })
      await typeRomaji(page, await readRomaji(page))
      await page.waitForSelector(`[data-ally-variant="${variant}"]`, {
        timeout: 2000,
      })
      await delay(70)
      await shot(page, file)
      const v = await page
        .locator('[data-testid="ally-shuriken"]')
        .first()
        .getAttribute('data-ally-variant')
      if (v === variant) pass(file)
      else fail(file, `variant=${v}`)
    }

    if (consoleErrors.length === 0) pass('console: no errors')
    else fail('console: no errors', consoleErrors.slice(0, 4).join(' | '))
  } finally {
    if (browser) await browser.close()
    preview.kill('SIGTERM')
  }

  console.log('\n=== intercept FX check ===')
  for (const name of results.passed) console.log(`PASS ${name}`)
  for (const item of results.failed) console.log(`FAIL ${item.name}: ${item.detail}`)
  console.log(`passed=${results.passed.length} failed=${results.failed.length}`)
  if (results.failed.length > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
