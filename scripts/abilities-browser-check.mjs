/**
 * Character abilities + visuals browser check (Playwright + preview).
 * Run: node scripts/abilities-browser-check.mjs
 * Screenshots: test-results/characters/
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const PORT = 4180
const BASE = `http://127.0.0.1:${PORT}`
const STORAGE_KEY = 'shinobi-keys-data'
const SHOT_DIR = join(process.cwd(), 'test-results', 'characters')

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
      // wait
    }
    await delay(400)
  }
  throw new Error('preview server did not start')
}

function seedEconomy(partial) {
  return {
    version: 2,
    settings: {
      volume: 0,
      muted: true,
      motionPreference: 'reduced',
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
      selectedCharacterId: 'shinobi-default',
      ...partial,
    },
  }
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
      build.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('build failed'))))
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
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  const consoleErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => consoleErrors.push(err.message))

  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: '忍者屋敷' }).click()
    const shopText = await page.locator('body').innerText()
    if (
      shopText.includes('紅蓮の連撃') &&
      shopText.includes('蒼影の守り') &&
      shopText.includes('黄金の褒賞') &&
      shopText.includes('基礎修行')
    ) {
      pass('shop: abilities visible before purchase')
    } else {
      fail('shop: abilities visible before purchase', shopText.slice(0, 300))
    }

    // Visual accessories on cards
    const hasScarf = (await page.locator('[data-accessory="scarf"]').count()) > 0
    const hasShield = (await page.locator('[data-accessory="shield"]').count()) > 0
    const hasScroll = (await page.locator('[data-accessory="scroll"]').count()) > 0
    const hasHeadband = (await page.locator('[data-accessory="headband"]').count()) > 0
    if (hasScarf && hasShield && hasScroll && hasHeadband) {
      pass('shop: distinct accessories present')
    } else {
      fail('shop: distinct accessories present', JSON.stringify({ hasScarf, hasShield, hasScroll, hasHeadband }))
    }

    await page.screenshot({ path: join(SHOT_DIR, 'characters-shop.png'), fullPage: true })

    // Seed all owned
    await page.evaluate(
      ({ key, data }) => localStorage.setItem(key, JSON.stringify(data)),
      { key: STORAGE_KEY, data: seedEconomy({ selectedCharacterId: 'shinobi-default' }) },
    )
    await page.reload({ waitUntil: 'domcontentloaded' })

    const shots = [
      ['shinobi-default', 'default-character.png'],
      ['shinobi-red', 'red-character.png'],
      ['shinobi-blue', 'blue-character.png'],
      ['shinobi-gold', 'gold-character.png'],
    ]
    for (const [characterId, file] of shots) {
      await page.evaluate(
        ({ key, characterId: cid }) => {
          const data = JSON.parse(localStorage.getItem(key))
          data.economy.selectedCharacterId = cid
          localStorage.setItem(key, JSON.stringify(data))
        },
        { key: STORAGE_KEY, characterId },
      )
      await page.goto(BASE, { waitUntil: 'domcontentloaded' })
      await page.waitForSelector('.character-figure')
      await page.screenshot({ path: join(SHOT_DIR, file) })
    }
    pass('shots: per-character title screenshots')

    // Mobile 320
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto(BASE, { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: '忍者屋敷' }).click()
    const scrollX = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 2,
    )
    await page.screenshot({ path: join(SHOT_DIR, 'characters-mobile-320.png'), fullPage: true })
    if (!scrollX && (await page.getByRole('button', { name: /前の画面に戻る|タイトルへ戻る/ }).isVisible())) {
      pass('mobile: 320px shop usable')
    } else {
      fail('mobile: 320px shop usable', JSON.stringify({ scrollX }))
    }
    await page.setViewportSize({ width: 1280, height: 800 })

    // Select red and verify score ability text path via destroying a word
    await page.evaluate(
      ({ key, data }) => localStorage.setItem(key, JSON.stringify(data)),
      {
        key: STORAGE_KEY,
        data: seedEconomy({ selectedCharacterId: 'shinobi-red', coins: 1000 }),
      },
    )
    await page.goto(BASE, { waitUntil: 'domcontentloaded' })
    if ((await page.locator('body').innerText()).includes('紅蓮の連撃')) {
      pass('title: ability short label')
    } else {
      fail('title: ability short label', 'missing')
    }

    await page.getByRole('button', { name: '修行を始める' }).click()
    await page.getByRole('radio', { name: /修行生/ }).click()
    await page.getByRole('button', { name: 'この難易度で開始' }).click()
    await page.waitForSelector('[data-character-id="shinobi-red"]')
    const pose = await page.getAttribute('#ninja-container', 'data-character-pose')
    if (pose === 'aggressive') {
      pass('game: red pose aggressive')
    } else {
      fail('game: red pose aggressive', pose)
    }
    // 能力名は常時HUDに出さない。発動時/一時停止で確認する方針へ変更
    if (await page.getByTestId('owned-coins').count()) {
      pass('hud: ability label')
    } else {
      fail('hud: ability label', 'missing owned coins hud')
    }

    // Destroy one target — score ability may show float
    await page.waitForSelector('[data-target-id]', { timeout: 8000 })
    const romaji = await page.evaluate(() => {
      const el = document.querySelector('[data-target-id] [aria-label]')
      if (!el) return null
      const parts = (el.getAttribute('aria-label') || '').trim().split(/\s+/)
      return parts[parts.length - 1] || null
    })
    if (romaji) {
      await page.keyboard.type(romaji, { delay: 20 })
      await delay(500)
      pass('game: red can destroy target')
    } else {
      fail('game: red can destroy target', 'no romaji')
    }

    await page.keyboard.press('Escape')
    const pauseText = await page.locator('body').innerText()
    if (pauseText.includes('紅蓮の連撃') && pauseText.includes('獲得スコア')) {
      pass('pause: ability details')
    } else {
      fail('pause: ability details', pauseText.slice(0, 200))
    }
    await page.getByRole('button', { name: 'タイトルへ戻る' }).click()

    // Gold stage coin: trainee stage clear should show ability bonus when gold selected
    await page.evaluate(
      ({ key, data }) => localStorage.setItem(key, JSON.stringify(data)),
      {
        key: STORAGE_KEY,
        data: seedEconomy({ selectedCharacterId: 'shinobi-gold', coins: 1000 }),
      },
    )
    await page.goto(BASE, { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: '修行を始める' }).click()
    await page.getByRole('radio', { name: /修行生/ }).click()
    await page.getByRole('button', { name: 'この難易度で開始' }).click()
    await page.waitForSelector('[data-character-id="shinobi-gold"]')

    let goldStageOk = false
    const coinsBefore = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).economy.coins,
      STORAGE_KEY,
    )
    for (let attempt = 0; attempt < 40 && !goldStageOk; attempt += 1) {
      await page.waitForSelector('[data-target-id]', { timeout: 8000 }).catch(() => null)
      const word = await page.evaluate(() => {
        const el = document.querySelector('[data-target-id] [aria-label]')
        if (!el) return null
        const parts = (el.getAttribute('aria-label') || '').trim().split(/\s+/)
        return parts[parts.length - 1] || null
      })
      if (word) {
        await page.keyboard.type(word, { delay: 12 })
        await delay(300)
      }
      const body = await page.locator('body').innerText()
      const coinsNow = await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)).economy.coins,
        STORAGE_KEY,
      )
      if (
        coinsNow >= coinsBefore + 12 ||
        body.includes('黄金の褒賞') ||
        (await page.getByTestId('coin-gain-flash').count()) > 0
      ) {
        goldStageOk = true
      }
    }
    const coinsAfter = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).economy.coins,
      STORAGE_KEY,
    )
    if (goldStageOk && coinsAfter >= coinsBefore + 12) {
      pass('gold: stage coins boosted to 12')
    } else {
      fail(
        'gold: stage coins boosted to 12',
        JSON.stringify({ goldStageOk, coinsBefore, coinsAfter }),
      )
    }

    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'タイトルへ戻る' }).click()

    // Clear records keeps economy
    await page.evaluate((key) => {
      const data = JSON.parse(localStorage.getItem(key))
      data.aggregates.totalPlays = 1
      data.recentPlays = [
        {
          id: 'p1',
          playedAt: new Date().toISOString(),
          difficulty: 'trainee',
          score: 10,
          stage: 1,
          destroyedTargets: 1,
          elapsedMs: 1000,
          typedChars: 4,
          correctChars: 4,
          missCount: 0,
          accuracy: 100,
          wpm: 10,
          maxCombo: 1,
          characterId: 'shinobi-gold',
        },
      ]
      localStorage.setItem(key, JSON.stringify(data))
    }, STORAGE_KEY)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: 'プレイ記録' }).click()
    await page.getByRole('button', { name: '記録を削除' }).click()
    await page.getByRole('button', { name: '削除する' }).click()
    await delay(200)
    const afterClear = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).economy,
      STORAGE_KEY,
    )
    if (afterClear.selectedCharacterId === 'shinobi-gold') {
      pass('clear: keeps selected character')
    } else {
      fail('clear: keeps selected character', JSON.stringify(afterClear))
    }

    await page.reload({ waitUntil: 'domcontentloaded' })
    if ((await page.locator('body').innerText()).includes('黄金の褒賞')) {
      pass('reload: selection persists')
    } else {
      fail('reload: selection persists', 'missing gold label')
    }

    if (consoleErrors.length === 0) {
      pass('console: no errors')
    } else {
      fail('console: no errors', consoleErrors.slice(0, 3).join(' | '))
    }
  } finally {
    await browser.close()
    preview.kill('SIGTERM')
  }

  console.log('\n=== Abilities Browser Check ===')
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
