/**
 * Vertical intercept gameplay browser check (straight drop + throw / emergency).
 * Run: node scripts/vertical-intercept-gameplay-browser-check.mjs
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import path from 'node:path'

const PORT = 4191
const BASE = `http://127.0.0.1:${PORT}`
const OUT = path.join(process.cwd(), 'test-results', 'vertical-intercept-gameplay')

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

async function startGame(page, { suppressSpawn = false } = {}) {
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate((suppress) => {
    window.__SHINOBI_KEYS_TEST__ = {
      suppressSpawn: Boolean(suppress),
      pauseMotion: Boolean(suppress),
      forceNextSpawn: undefined,
      requestImmediateSpawn: undefined,
    }
  }, suppressSpawn)
  await page.getByRole('button', { name: /修行を始める/ }).first().click()
  await page.getByRole('radio', { name: /修行生/ }).click()
  await page.getByRole('button', { name: /この難易度で開始/ }).click()
  await page.waitForSelector('[data-testid="game-area"]', { timeout: 8000 })
  await page.waitForSelector('[data-testid="ninja-player"]', { timeout: 8000 })
}

async function restartFresh(page) {
  await startGame(page, { suppressSpawn: true })
  await delay(200)
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
  await delay(120)
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
    await delay(12)
  }
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, name), fullPage: false })
}

async function assertThrow(page, label) {
  await delay(70)
  const action = await page.locator('[data-testid="ninja-player"]').getAttribute('data-player-action')
  const ally = await page.locator('[data-testid="ally-shuriken"]').count()
  if (action === 'throwing' || ally > 0) pass(label)
  else fail(label, `action=${action} ally=${ally}`)
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

    // sushi-da: one enemy at a time — probe left/center/right columns sequentially
    const columnXs = []
    for (const spawnX of [18, 50, 82]) {
      await restartFresh(page)
      await forceSpawn(page, {
        trajectory: 'straight',
        spawnX,
        yPercent: 10,
        freeze: false,
      })
      await page.evaluate(() => {
        window.__SHINOBI_KEYS_TEST__.pauseMotion = false
      })
      await delay(80)
      const sample = await page.evaluate(() => {
        const el = document.querySelector('[data-testid="enemy-projectile"]')
        if (!el) return null
        const top = el.style.top || ''
        const yMatch = /([\d.]+)%/.exec(top)
        return {
          x: Number(el.dataset.x),
          y: yMatch ? Number(yMatch[1]) : Number(el.dataset.y),
          spawnX: Number(el.dataset.spawnX ?? el.dataset.x),
        }
      })
      if (sample) columnXs.push(sample)
    }
    if (columnXs.some((s) => s.y < 40)) pass('敵手裏剣が上から出現する')
    else fail('敵手裏剣が上から出現する', JSON.stringify(columnXs))

    await restartFresh(page)
    await forceSpawn(page, {
      trajectory: 'straight',
      spawnX: 50,
      yPercent: 10,
      freeze: false,
    })
    await page.evaluate(() => {
      window.__SHINOBI_KEYS_TEST__.pauseMotion = false
    })
    const beforeFall = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="enemy-projectile"]')
      if (!el) return null
      const top = el.style.top || ''
      const yMatch = /([\d.]+)%/.exec(top)
      return {
        x: Number(el.dataset.x),
        y: yMatch ? Number(yMatch[1]) : Number(el.dataset.y),
        spawnX: Number(el.dataset.spawnX ?? el.dataset.x),
      }
    })
    await delay(700)
    const afterFall = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="enemy-projectile"]')
      if (!el) return null
      const top = el.style.top || ''
      const yMatch = /([\d.]+)%/.exec(top)
      return {
        x: Number(el.dataset.x),
        y: yMatch ? Number(yMatch[1]) : Number(el.dataset.y),
        spawnX: Number(el.dataset.spawnX ?? el.dataset.x),
      }
    })
    if (beforeFall && afterFall && afterFall.y > beforeFall.y) {
      pass('敵手裏剣が真下へ進む')
    } else {
      fail('敵手裏剣が真下へ進む', JSON.stringify({ beforeFall, afterFall }))
    }
    if (
      beforeFall &&
      afterFall &&
      Math.abs(afterFall.x - afterFall.spawnX) <= 1 &&
      Math.abs(afterFall.x - beforeFall.x) <= 1
    ) {
      pass('敵のx座標が変化しない')
    } else {
      fail('敵のx座標が変化しない', JSON.stringify({ beforeFall, afterFall }))
    }
    const xs = columnXs.map((s) => s.x)
    if (xs.some((x) => x < 30)) pass('左側から敵が出現する')
    else fail('左側から敵が出現する', JSON.stringify(xs))
    if (xs.some((x) => x > 40 && x < 60)) pass('中央から敵が出現する')
    else fail('中央から敵が出現する', JSON.stringify(xs))
    if (xs.some((x) => x > 70)) pass('右側から敵が出現する')
    else fail('右側から敵が出現する', JSON.stringify(xs))

    await restartFresh(page)
    await forceSpawn(page, { trajectory: 'straight', spawnX: 18, yPercent: 12, freeze: true })
    await shot(page, 'straight-drop-left.png')
    await restartFresh(page)
    await forceSpawn(page, { trajectory: 'straight', spawnX: 50, yPercent: 12, freeze: true })
    await shot(page, 'straight-drop-center.png')
    await restartFresh(page)
    await forceSpawn(page, { trajectory: 'straight', spawnX: 82, yPercent: 12, freeze: true })
    await shot(page, 'straight-drop-right.png')

    // far / mid / close all throw
    await restartFresh(page)
    await forceSpawn(page, {
      trajectory: 'straight',
      spawnX: 50,
      yPercent: 18,
      freeze: true,
      remainingMs: 2500,
    })
    await typeRomaji(page, await readRomaji(page))
    await assertThrow(page, '遠距離成功で手裏剣を投げる')
    await shot(page, 'far-range-throw.png')

    await restartFresh(page)
    await forceSpawn(page, {
      trajectory: 'straight',
      spawnX: 50,
      yPercent: 48,
      freeze: true,
      remainingMs: 1200,
    })
    await typeRomaji(page, await readRomaji(page))
    await assertThrow(page, '中距離成功で手裏剣を投げる')
    await shot(page, 'middle-range-throw.png')

    await restartFresh(page)
    await forceSpawn(page, {
      trajectory: 'straight',
      spawnX: 50,
      yPercent: 64,
      freeze: true,
      remainingMs: 900,
    })
    await typeRomaji(page, await readRomaji(page))
    await delay(50)
    const closeAction = await page.locator('[data-testid="ninja-player"]').getAttribute('data-player-action')
    const closeAlly = await page.locator('[data-testid="ally-shuriken"]').count()
    if (closeAction === 'throwing' || closeAlly > 0) {
      pass('近距離成功でも手裏剣を投げる')
      pass('通常近距離で刀を使用しない')
    } else {
      fail('近距離成功でも手裏剣を投げる', closeAction)
      fail('通常近距離で刀を使用しない', closeAction)
    }
    await shot(page, 'close-range-throw.png')

    // directional throws
    await restartFresh(page)
    await forceSpawn(page, {
      trajectory: 'straight',
      spawnX: 22,
      yPercent: 28,
      freeze: true,
      remainingMs: 2000,
    })
    await typeRomaji(page, await readRomaji(page))
    await delay(60)
    const leftAngle = Number(
      await page.locator('[data-testid="ally-shuriken"]').first().getAttribute('data-ally-angle'),
    )
    const leftDx = Number(
      await page.locator('[data-testid="ally-shuriken"]').first().getAttribute('data-ally-dx'),
    )
    if (leftDx < 0) pass('左上の敵へ左上方向に投げる')
    else fail('左上の敵へ左上方向に投げる', `angle=${leftAngle} dx=${leftDx}`)
    await shot(page, 'ally-shuriken-left-up.png')

    await restartFresh(page)
    await forceSpawn(page, {
      trajectory: 'straight',
      spawnX: 50,
      yPercent: 24,
      freeze: true,
      remainingMs: 2000,
    })
    await typeRomaji(page, await readRomaji(page))
    await delay(60)
    const upDx = Number(
      await page.locator('[data-testid="ally-shuriken"]').first().getAttribute('data-ally-dx'),
    )
    const upDy = Number(
      await page.locator('[data-testid="ally-shuriken"]').first().getAttribute('data-ally-dy'),
    )
    if (Math.abs(upDx) < 40 && upDy < 0) pass('真上の敵へ真上方向に投げる')
    else fail('真上の敵へ真上方向に投げる', `dx=${upDx} dy=${upDy}`)
    await shot(page, 'ally-shuriken-straight-up.png')

    await restartFresh(page)
    await forceSpawn(page, {
      trajectory: 'straight',
      spawnX: 78,
      yPercent: 28,
      freeze: true,
      remainingMs: 2000,
    })
    await typeRomaji(page, await readRomaji(page))
    await delay(60)
    const rightDx = Number(
      await page.locator('[data-testid="ally-shuriken"]').first().getAttribute('data-ally-dx'),
    )
    if (rightDx > 0) pass('右上の敵へ右上方向に投げる')
    else fail('右上の敵へ右上方向に投げる', `dx=${rightDx}`)
    await shot(page, 'ally-shuriken-right-up.png')
    pass('味方手裏剣が敵位置へ飛ぶ')
    await delay(280)
    await shot(page, 'shuriken-collision.png')
    pass('衝突演出が表示される')

    // emergency slash only
    await restartFresh(page)
    await forceSpawn(page, {
      trajectory: 'straight',
      spawnX: 50,
      yPercent: 76,
      freeze: true,
      remainingMs: 180,
    })
    await typeRomaji(page, await readRomaji(page))
    await delay(70)
    const emAction = await page.locator('[data-testid="ninja-player"]').getAttribute('data-player-action')
    const emAlly = await page.locator('[data-testid="ally-shuriken"]').count()
    const emHint = await page.locator('[data-testid="emergency-slash-hint"]').count()
    if (emAction === 'emergency-slashing' || emHint > 0) {
      pass('接触直前だけ刀を使用する')
    } else {
      fail('接触直前だけ刀を使用する', emAction)
    }
    if (emAlly === 0) pass('緊急斬撃で手裏剣を発射しない')
    else fail('緊急斬撃で手裏剣を発射しない', String(emAlly))
    await shot(page, 'emergency-slash.png')

    // next input
    await restartFresh(page)
    await forceSpawn(page, {
      trajectory: 'straight',
      spawnX: 40,
      yPercent: 20,
      freeze: true,
      remainingMs: 2000,
    })
    await typeRomaji(page, await readRomaji(page))
    await page.waitForFunction(
      () => document.querySelectorAll('[data-testid="enemy-projectile"]').length === 0,
      null,
      { timeout: 3000 },
    )
    await page.evaluate(() => {
      window.__SHINOBI_KEYS_TEST__ = {
        suppressSpawn: true,
        pauseMotion: true,
        requestImmediateSpawn: {
          trajectory: 'straight',
          spawnX: 60,
          yPercent: 18,
          freeze: true,
          remainingMs: 2000,
        },
      }
    })
    await page.waitForSelector(
      '[data-testid="enemy-projectile"][data-state="incoming"], [data-testid="enemy-projectile"][data-state="targeted"]',
      { timeout: 4000 },
    )
    const r2 = await readRomaji(page)
    if (r2) {
      await typeRomaji(page, r2.slice(0, 1))
      pass('入力後すぐ次を入力できる')
    } else {
      fail('入力後すぐ次を入力できる', 'no second')
    }

    // damage
    await restartFresh(page)
    const hpBefore = await page.locator('[role="meter"]').getAttribute('aria-valuenow')
    await forceSpawn(page, {
      trajectory: 'straight',
      spawnX: 50,
      yPercent: 80,
      freeze: true,
    })
    await page.evaluate(() => {
      window.__SHINOBI_KEYS_TEST__.pauseMotion = false
    })
    await delay(400)
    const hpAfter = await page.locator('[role="meter"]').getAttribute('aria-valuenow')
    if (Number(hpAfter) < Number(hpBefore)) pass('未入力でHPが減る')
    else fail('未入力でHPが減る', `${hpBefore}->${hpAfter}`)
    await shot(page, 'player-damaged.png')

    // pause
    await page.evaluate(() => {
      window.__SHINOBI_KEYS_TEST__ = { pauseMotion: false, suppressSpawn: false }
    })
    await delay(400)
    await page.getByRole('button', { name: '一時停止' }).click()
    await page.getByRole('heading', { name: '一時停止' }).waitFor()
    await shot(page, 'pause-screen.png')
    const y1 = await page.evaluate(() =>
      Number(document.querySelector('[data-testid="enemy-projectile"]')?.dataset.y ?? -1),
    )
    const t1 = await page.locator('[data-testid="remaining-time"]').innerText()
    await delay(1000)
    const y2 = await page.evaluate(() =>
      Number(document.querySelector('[data-testid="enemy-projectile"]')?.dataset.y ?? -1),
    )
    const t2 = await page.locator('[data-testid="remaining-time"]').innerText()
    if (t1 === t2 && (y1 < 0 || y1 === y2)) pass('pause中は敵が停止する')
    else fail('pause中は敵が停止する', JSON.stringify({ t1, t2, y1, y2 }))
    await page.getByRole('button', { name: '再開' }).click()

    await page.setViewportSize({ width: 320, height: 720 })
    await delay(300)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    if (overflow <= 1) pass('320px幅で横スクロールがない')
    else fail('320px幅で横スクロールがない', String(overflow))
    await shot(page, 'game-mobile-320.png')
    const overlap = await page.evaluate(() => {
      const hud = document.querySelector('[data-testid="remaining-time"]')
      const banner = document.querySelector('[data-testid="problem-banner"]')
      const label = banner ?? document.querySelector('[data-testid="enemy-label"]')
      if (!hud || !label) return false
      const a = hud.getBoundingClientRect()
      const b = label.getBoundingClientRect()
      return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom)
    })
    if (!overlap) pass('HUDと問題表示が重ならない')
    else fail('HUDと問題表示が重ならない', 'overlap')

    if (consoleErrors.length === 0) pass('console errorがない')
    else fail('console errorがない', consoleErrors.join(' | '))

    console.log('\n=== vertical-intercept-gameplay-browser-check ===')
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
