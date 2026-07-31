/**
 * Character shop / economy browser check (Playwright + vite preview).
 * Run: node scripts/characters-browser-check.mjs
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { existsSync } from 'node:fs'

const PORT = 4179
const BASE = `http://127.0.0.1:${PORT}`
const STORAGE_KEY = 'shinobi-keys-data'

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
    { cwd: process.cwd(), stdio: 'pipe', shell: true },
  )

  await delay(1500)
  await waitForServer()

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const consoleErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => consoleErrors.push(err.message))

  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: '忍者屋敷' }).click()
    if ((await page.locator('body').innerText()).includes('見習い忍者')) {
      pass('nav: title -> characters')
    } else {
      fail('nav: title -> characters', 'missing shop')
    }

    // Cannot buy expensive character with 0 coins
    const redBuy = page.getByRole('button', { name: /コインが足りません|100コインで購入/ })
    if (await redBuy.first().isDisabled()) {
      pass('shop: cannot buy without coins')
    } else {
      const text = await page.locator('body').innerText()
      if (text.includes('コインが足りません')) {
        pass('shop: cannot buy without coins')
      } else {
        fail('shop: cannot buy without coins', 'buy still enabled')
      }
    }
    await page.getByRole('button', { name: /前の画面に戻る|タイトルへ戻る/ }).click()

    // Seed coins and owned state for purchase flow
    await page.evaluate((key) => {
      const raw = localStorage.getItem(key)
      const data = raw
        ? JSON.parse(raw)
        : {
            version: 2,
            settings: { volume: 0, muted: true, motionPreference: 'reduced', lastDifficulty: null },
            aggregates: { totalPlays: 0, totalTypedChars: 0, bestComboAll: 0 },
            bestByDifficulty: { trainee: null, ninja: null, master: null },
            recentPlays: [],
            economy: {
              coins: 0,
              ownedCharacterIds: ['shinobi-default'],
              selectedCharacterId: 'shinobi-default',
            },
          }
      data.version = 2
      data.economy = {
        coins: 150,
        ownedCharacterIds: ['shinobi-default'],
        selectedCharacterId: 'shinobi-default',
      }
      data.settings = {
        volume: 0,
        muted: true,
        motionPreference: 'reduced',
        lastDifficulty: null,
      }
      localStorage.setItem(key, JSON.stringify(data))
    }, STORAGE_KEY)

    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: '忍者屋敷' }).click()
    await page.getByRole('button', { name: '100コインで購入' }).click()
    if ((await page.locator('body').innerText()).includes('購入しますか')) {
      pass('shop: purchase confirm opens')
    } else {
      fail('shop: purchase confirm opens', 'no dialog')
    }
    await page.getByRole('button', { name: '購入する' }).click()
    await delay(300)

    let economy = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).economy, STORAGE_KEY)
    if (economy.coins === 50 && economy.ownedCharacterIds.includes('shinobi-red')) {
      pass('shop: purchase deducts coins')
    } else {
      fail('shop: purchase deducts coins', JSON.stringify(economy))
    }

    // Double purchase blocked
    if (!(await page.getByRole('button', { name: '100コインで購入' }).count())) {
      pass('shop: no duplicate buy button')
    } else {
      fail('shop: no duplicate buy button', 'buy still shown')
    }

    await page.getByRole('button', { name: 'このキャラクターを使う' }).first().click()
    await delay(200)
    economy = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).economy, STORAGE_KEY)
    if (economy.selectedCharacterId === 'shinobi-red') {
      pass('shop: select owned character')
    } else {
      fail('shop: select owned character', economy.selectedCharacterId)
    }

    await page.getByRole('button', { name: /前の画面に戻る|タイトルへ戻る/ }).click()
    await page.getByRole('button', { name: '修行を始める' }).click()
    await page.getByRole('radio', { name: /修行生/ }).click()
    await page.getByRole('button', { name: 'この難易度で開始' }).click()
    await page.waitForSelector('[data-character-id="shinobi-red"]', { timeout: 5000 })
    pass('game: selected character reflected')

    let stageClearSeen = false
    const coinsBefore = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).economy.coins,
      STORAGE_KEY,
    )
    for (let attempt = 0; attempt < 40 && !stageClearSeen; attempt += 1) {
      await page.waitForSelector('[data-testid="enemy-projectile"]', { timeout: 8000, state: 'attached' }).catch(() => null)
      const romaji = await page.evaluate(() => {
        const el = document.querySelector('[data-testid="enemy-projectile"] [aria-label]')
        if (!el) return null
        const label = el.getAttribute('aria-label') || ''
        const parts = label.trim().split(/\s+/)
        return parts[parts.length - 1] || null
      })
      if (romaji) {
        await page.keyboard.type(romaji, { delay: 15 })
        await delay(350)
      }
      const coinsNow = await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)).economy.coins,
        STORAGE_KEY,
      )
      const flash = await page.getByTestId('coin-gain-flash').count()
      if (coinsNow >= coinsBefore + 10 || flash > 0) {
        stageClearSeen = true
      }
    }
    const coinsAfterStage = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).economy.coins,
      STORAGE_KEY,
    )
    if (stageClearSeen && coinsAfterStage >= coinsBefore + 10) {
      pass('game: stage 1 clear shows coins')
    } else {
      fail(
        'game: stage 1 clear shows coins',
        JSON.stringify({ stageClearSeen, coinsBefore, coinsAfterStage }),
      )
    }

    // Second stage-1 award should not fire again in same play (coins shouldn't jump another +10 from same stage)
    const midCoins = coinsAfterStage
    await delay(500)
    const still = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).economy.coins,
      STORAGE_KEY,
    )
    if (still === midCoins || still === midCoins + 15) {
      // +15 would mean stage 2 clear, which is fine; not a duplicate stage 1
      pass('game: no duplicate idle coin drip')
    } else if (still === midCoins + 10) {
      fail('game: no duplicate idle coin drip', `unexpected +10 coins=${still}`)
    } else {
      pass('game: no duplicate idle coin drip')
    }

    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'タイトルへ戻る' }).click()

    // Seed records + economy, then clear records and ensure economy remains
    await page.evaluate((key) => {
      const data = JSON.parse(localStorage.getItem(key))
      data.aggregates.totalPlays = 2
      data.recentPlays = [
        {
          id: 'p1',
          playedAt: new Date().toISOString(),
          difficulty: 'trainee',
          score: 100,
          stage: 1,
          destroyedTargets: 1,
          elapsedMs: 1000,
          typedChars: 4,
          correctChars: 4,
          missCount: 0,
          accuracy: 100,
          wpm: 10,
          maxCombo: 1,
        },
      ]
      data.economy = {
        coins: 50,
        ownedCharacterIds: ['shinobi-default', 'shinobi-red'],
        selectedCharacterId: 'shinobi-red',
      }
      localStorage.setItem(key, JSON.stringify(data))
    }, STORAGE_KEY)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: 'プレイ記録' }).click()
    await page.getByRole('button', { name: '記録を削除' }).click()
    await page.getByRole('button', { name: '削除する' }).click()
    await delay(200)
    economy = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).economy, STORAGE_KEY)
    const aggregates = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).aggregates,
      STORAGE_KEY,
    )
    if (
      aggregates.totalPlays === 0 &&
      economy.coins === 50 &&
      economy.ownedCharacterIds.includes('shinobi-red') &&
      economy.selectedCharacterId === 'shinobi-red'
    ) {
      pass('clear records: keeps economy')
    } else {
      fail('clear records: keeps economy', JSON.stringify({ aggregates, economy }))
    }

    await page.reload({ waitUntil: 'domcontentloaded' })
    economy = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).economy, STORAGE_KEY)
    if (economy.selectedCharacterId === 'shinobi-red' && economy.coins === 50) {
      pass('reload: economy persists')
    } else {
      fail('reload: economy persists', JSON.stringify(economy))
    }

    // Force time-up and check coin summary on result
    await page.goto(BASE, { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: '修行を始める' }).click()
    await page.getByRole('radio', { name: /忍頭/ }).click()
    await page.getByRole('button', { name: 'この難易度で開始' }).click()
    await page.waitForSelector('[data-testid="game-area"]', { timeout: 8000 })
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
      text.includes('撃破ボーナス') &&
      text.includes('成績ボーナス') &&
      text.includes('今回の合計')
    ) {
      pass('result: coin summary visible')
    } else {
      fail('result: coin summary visible', text.slice(0, 300))
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

  console.log('\n=== Characters Browser Check ===')
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
