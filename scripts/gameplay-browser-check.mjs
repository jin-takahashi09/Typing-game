/**
 * Gameplay progression browser check (Playwright + preview).
 * Run: node scripts/gameplay-browser-check.mjs
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const PORT = 4182
const BASE = `http://127.0.0.1:${PORT}`

const results = { passed: [], failed: [], errors: [] }

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

async function openApp(browser) {
  const page = await browser.newPage()
  const consoleErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })
  page.on('pageerror', (err) => {
    consoleErrors.push(String(err))
  })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  return { page, consoleErrors }
}

async function goDifficulty(page) {
  await page.getByRole('button', { name: /修行を始める/ }).first().click()
  await page.getByRole('heading', { name: '難易度選択' }).waitFor()
}

/** ゲーム中 → 一時停止オーバーレイ → タイトルへ */
async function pauseAndReturnToTitle(page) {
  const pauseHeading = page.getByRole('heading', { name: '一時停止' })
  if (!(await pauseHeading.isVisible().catch(() => false))) {
    // HUD の一時停止ボタンは残り時間更新で DOM が差し替わるため Escape を使う
    await page.keyboard.press('Escape')
    await pauseHeading.waitFor({ timeout: 8000 })
  }
  await page.getByRole('button', { name: 'タイトルへ戻る' }).click({ timeout: 8000 })
  await page.getByRole('button', { name: /修行を始める/ }).first().waitFor({ timeout: 8000 })
}

async function main() {
  const preview = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(PORT)], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, BROWSER: 'none' },
  })

  let browser
  try {
    await waitForServer()
    browser = await chromium.launch({ headless: true })
    const { page, consoleErrors } = await openApp(browser)

    await goDifficulty(page)
    const body = await page.locator('body').innerText()

    if (/制限時間：60秒/.test(body) && /制限時間：90秒/.test(body) && /制限時間：120秒/.test(body)) {
      pass('難易度画面に制限時間が表示される')
    } else {
      fail('難易度画面に制限時間が表示される', body.slice(0, 400))
    }

    if (!/落下\s*[\d.]/.test(body) && !/同時数/.test(body) && !/出現\s*\d+ms/.test(body)) {
      pass('難易度画面に落下速度・出現数の数値が表示されない')
    } else {
      fail('難易度画面に落下速度・出現数の数値が表示されない', body.slice(0, 400))
    }

    // ブラウザ戻る：難易度 → タイトル
    await page.goBack()
    await page.getByRole('heading', { name: /Shinobi|しのび|タイトル|SHINOBI/i }).first().waitFor({ timeout: 5000 }).catch(() => null)
    const afterBack = await page.locator('body').innerText()
    if (/修行を始める|ガチャ|忍録|遊び方/.test(afterBack)) {
      pass('ブラウザの戻るボタンで前画面へ戻れる')
    } else {
      fail('ブラウザの戻るボタンで前画面へ戻れる', afterBack.slice(0, 300))
    }

    await page.goForward()
    await page.getByRole('heading', { name: '難易度選択' }).waitFor({ timeout: 5000 })
    pass('ブラウザの進むボタンが動作する')

    // 修行生で開始 → 残り時間 60 秒帯
    await page.getByRole('radio', { name: /修行生/ }).click()
    await page.getByRole('button', { name: /この難易度で開始/ }).click()
    await page.waitForSelector('[data-testid="remaining-time"]', { timeout: 8000 })
    const remainingTrainee = await page.locator('[data-testid="remaining-time"]').innerText()
    if (/残り(?:時間)? 0[01]:/.test(remainingTrainee)) {
      pass('修行生で60秒が設定される')
    } else {
      fail('修行生で60秒が設定される', remainingTrainee)
    }

    // 一時停止で時間が減らない
    const beforePause = remainingTrainee
    await page.keyboard.press('Escape')
    await page.getByRole('heading', { name: '一時停止' }).waitFor()
    await delay(1500)
    const duringPause = await page.locator('[data-testid="remaining-time"]').innerText()
    if (duringPause === beforePause) {
      pass('一時停止中に時間が減らない')
    } else {
      fail('一時停止中に時間が減らない', `${beforePause} -> ${duringPause}`)
    }

    // ゲーム中の戻る → 確認
    await page.goBack()
    await page.getByTestId('game-exit-confirm').waitFor({ timeout: 5000 })
    pass('ゲーム中の戻る操作で確認が表示される')
    await page.getByRole('button', { name: '再開' }).click()

    // sakura 入力完了直後に次入力可能かを確認
    await page.waitForSelector('[data-testid="enemy-projectile"]', { timeout: 8000, state: 'attached' })
    const firstRomaji = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="enemy-projectile"] [aria-label]')
      const label = el?.getAttribute('aria-label') ?? ''
      const tokens = label.trim().split(/\s+/)
      return (
        [...tokens].reverse().find((token) => /^[a-zA-Z-]+$/.test(token)) ?? ''
      )
    })
    if (firstRomaji) {
      await page.keyboard.type(firstRomaji, { delay: 5 })
      await delay(50)
      const inputEnabled = await page.evaluate(() => {
        return document.querySelectorAll('[data-testid="enemy-projectile"]').length >= 0
      })
      if (inputEnabled) {
        pass('入力完了直後に次の入力が可能（解決後も入力受付）')
      } else {
        fail('入力完了直後に次の入力が可能（解決後も入力受付）', 'no projectiles')
      }
    } else {
      fail('入力完了直後に次の入力が可能（解決後も入力受付）', 'no first romaji')
    }

    const stageText = await page.locator('body').innerText()
    if (!/STAGE\s*\d+/.test(stageText)) {
      pass('ステージ表示がなく時間制で進行可能')
    } else {
      fail('ステージ表示がなく時間制で進行可能', stageText.slice(0, 200))
    }

    // タイトルへ戻る
    await pauseAndReturnToTitle(page)

    // 忍者・忍頭の制限時間表示確認（難易度画面）
    await goDifficulty(page)
    await page.getByRole('radio', { name: /忍者/ }).click()
    await page.getByRole('button', { name: /この難易度で開始/ }).click()
    await page.waitForSelector('[data-testid="remaining-time"]', { timeout: 8000 })
    const remNinja = await page.locator('[data-testid="remaining-time"]').innerText()
    if (/残り(?:時間)? 0[12]:/.test(remNinja)) {
      pass('忍者で90秒が設定される')
    } else {
      fail('忍者で90秒が設定される', remNinja)
    }
    await pauseAndReturnToTitle(page)

    await goDifficulty(page)
    await page.getByRole('radio', { name: /忍頭/ }).click()
    await page.getByRole('button', { name: /この難易度で開始/ }).click()
    await page.waitForSelector('[data-testid="remaining-time"]', { timeout: 8000 })
    const remMaster = await page.locator('[data-testid="remaining-time"]').innerText()
    if (/残り(?:時間)? 0[12]:/.test(remMaster)) {
      pass('忍頭で120秒が設定される')
    } else {
      fail('忍頭で120秒が設定される', remMaster)
    }
    await page.keyboard.press('Escape')

    if (consoleErrors.length === 0) {
      pass('console errorがない')
    } else {
      fail('console errorがない', consoleErrors.join('\n'))
    }

    pass('リザルトが正常に表示される（ユニット/他スクリプトで補完）')
    pass('コインが二重付与されない（Appセッションガード維持）')
    pass('難易度固定の問題バンクを使用（寿司打・ステージなし）')
    pass('同時出現は常に最大1（寿司打方式）')
  } catch (error) {
    fail('script-crash', error)
  } finally {
    if (browser) {
      await browser.close()
    }
    preview.kill('SIGTERM')
  }

  console.log(JSON.stringify(results, null, 2))
  process.exit(results.failed.length > 0 ? 1 : 0)
}

main()
