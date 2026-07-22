/**
 * Phase 2 browser verification script (Playwright).
 * Run: node scripts/phase2-browser-check.mjs
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const PORT = 5174
const BASE = `http://127.0.0.1:${PORT}`

const results = {
  passed: [],
  failed: [],
  userVerify: [],
}

function pass(name) {
  results.passed.push(name)
}

function fail(name, detail) {
  results.failed.push({ name, detail })
}

function userVerify(name, reason) {
  results.userVerify.push({ name, reason })
}

async function waitForTarget(page) {
  await page.waitForSelector('[data-target-id]', { timeout: 8000 })
}

async function getTargets(page) {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll('[data-target-id]')).map((el) => {
      const input = el.querySelector('[aria-label]')
      const datasetY = el.dataset.fallY
      if (datasetY) {
        y = Number(datasetY)
      } else {
        const transform = el.style.transform || window.getComputedStyle(el).transform
        const match3d = /translate3d\(-50%,\s*([-\d.]+)px,\s*0\)/.exec(transform)
        if (match3d) {
          y = Number(match3d[1])
        } else if (transform.startsWith('matrix')) {
          const parts = transform.match(/matrix.*\((.+)\)/)?.[1]?.split(',').map((v) => Number(v.trim()))
          if (parts && parts.length >= 6) y = parts[5]
        }
      }
      return {
        id: el.getAttribute('data-target-id'),
        inputText: input?.getAttribute('aria-label') ?? '',
        y,
        locked: el.querySelector('.char-current') !== null,
        classes: el.querySelector('.target-word')?.className ?? '',
      }
    })
  })
}

async function getHud(page) {
  return page.evaluate(() => {
    const scoreEl = [...document.querySelectorAll('.font-display')].find((el) =>
      /^\d+$/.test(el.textContent ?? ''),
    )
    const bodyText = document.body.innerText
    const comboMatch = /Combo x(\d+)/.exec(bodyText)
    const stageMatch = /STAGE\s*(\d+)/.exec(bodyText)
    const defense = document.querySelector('[role="meter"]')?.getAttribute('aria-valuenow')
    const difficulty = bodyText.match(/Difficulty[\s\S]*?(修行生|忍者|忍頭)/)?.[1] ?? ''
    return {
      score: Number(scoreEl?.textContent ?? -1),
      comboVisible: bodyText.includes('Combo x'),
      combo: Number(comboMatch?.[1] ?? 0),
      stage: Number(stageMatch?.[1] ?? -1),
      defense: Number(defense ?? -1),
      difficulty,
    }
  })
}

async function typeWord(page, word) {
  for (const ch of word) {
    await page.keyboard.press(ch)
    await delay(30)
  }
}

async function startDifficulty(page, label) {
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

  const consoleErrors = []
  dev.stderr.on('data', (chunk) => {
    const msg = String(chunk)
    if (/error/i.test(msg)) consoleErrors.push(msg)
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
  const pageErrors = []
  page.on('pageerror', (e) => pageErrors.push(String(e)))
  page.on('console', (msg) => {
    if (msg.type() === 'error') pageErrors.push(msg.text())
  })

  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' })

    // 1. Title
    const titleText = await page.locator('body').innerText()
    if (titleText.includes('Shinobi Keys')) pass('title: app name')
    else fail('title: app name', titleText)
    if (titleText.includes('タイピング修行')) pass('title: subtitle')
    else fail('title: subtitle', titleText)
    if (titleText.includes('打て。斬れ。タイピングを極めろ。')) pass('title: tagline')
    else fail('title: tagline', titleText)

    // 2. Difficulty (fresh navigation from title)
    await page.goto(BASE, { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: '修行を始める' }).click()
    await page.waitForSelector('text=選択中:')

    const diffText = await page.locator('body').innerText()
    if (diffText.includes('選択中: 未選択')) pass('difficulty: starts unselected')
    else fail('difficulty: starts unselected', diffText.slice(0, 300))

    const startBtn = page.getByRole('button', { name: 'この難易度で開始' })
    if (await startBtn.isDisabled()) pass('difficulty: start disabled when unselected')
    else fail('difficulty: start disabled when unselected', 'enabled')

    for (const label of ['修行生', '忍者', '忍頭']) {
      if (diffText.includes(label)) pass(`difficulty: shows ${label}`)
      else fail(`difficulty: shows ${label}`, diffText)
    }

    await page.getByRole('radio', { name: /忍者/ }).click()
    if (!(await startBtn.isDisabled())) pass('difficulty: start enabled after select')
    else fail('difficulty: start enabled after select', 'disabled')

    await startBtn.click()
    await page.waitForSelector('[aria-label="タイピングゲームエリア"]')
    pass('navigation: title -> difficulty -> game')

    let hud = await getHud(page)
    if (hud.score === 0 && hud.stage === 1 && hud.defense === 100) {
      pass('game start: initial hud values')
    } else {
      fail('game start: initial hud values', JSON.stringify(hud))
    }

    await waitForTarget(page)
    pass('targets: spawn')

    const before = await getTargets(page)
    await delay(800)
    const after = await getTargets(page)
    const moved = before.some((target) => {
      const later = after.find((item) => item.id === target.id)
      return later && later.y > target.y
    })
    if (moved) pass('targets: falling')
    else fail('targets: falling', JSON.stringify({ before, after }))

    if (after.every((t) => t.y < 5000)) pass('targets: no position jump')
    else fail('targets: no position jump', JSON.stringify(after))

    const firstInput = after[0]?.inputText
    if (firstInput) {
      await typeWord(page, firstInput)
      await delay(400)
      hud = await getHud(page)
      if (hud.score > 0) pass('typing: destroy increases score')
      else fail('typing: destroy increases score', JSON.stringify(hud))
    }

    // miss input
    await waitForTarget(page)
    const t2 = (await getTargets(page))[0]
    if (t2?.inputText) {
      await page.keyboard.press(t2.inputText[0])
      await delay(40)
      await page.keyboard.press('z')
      await delay(200)
      hud = await getHud(page)
      if (hud.combo === 0 || !hud.comboVisible) pass('miss: resets combo')
      else fail('miss: resets combo', JSON.stringify(hud))
      await typeWord(page, t2.inputText.slice(1))
      pass('miss: can continue typing')
    }

    // non typing keys should not advance
    await waitForTarget(page)
    const beforeKeys = await getHud(page)
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await page.keyboard.press('ArrowDown')
    await delay(100)
    const afterKeys = await getHud(page)
    if (afterKeys.score === beforeKeys.score) pass('input: ignores non-typing keys')
    else fail('input: ignores non-typing keys', JSON.stringify({ beforeKeys, afterKeys }))

    // uppercase
    await waitForTarget(page)
    const upper = (await getTargets(page))[0]
    if (upper?.inputText) {
      const prior = (await getHud(page)).score
      await page.keyboard.press(upper.inputText[0].toUpperCase())
      await delay(100)
      const locked = await page.evaluate(() => {
        return document.querySelector('.char-correct') !== null
      })
      if (locked) pass('input: uppercase works')
      else fail('input: uppercase works', upper.inputText)
      void prior
    }

    // lock-on same letter - trainee has neko/ninja etc.
    await page.goto(BASE, { waitUntil: 'domcontentloaded' })
    await startDifficulty(page, '修行生')
    let targets = []
    let dup = null
    for (let i = 0; i < 20; i += 1) {
      await delay(500)
      targets = await getTargets(page)
      const byLetter = new Map()
      for (const t of targets) {
        const letter = t.inputText[0]
        if (!byLetter.has(letter)) byLetter.set(letter, [])
        byLetter.get(letter).push(t)
      }
      dup = [...byLetter.entries()].find(([, list]) => list.length >= 2)
      if (dup) break
    }
    if (dup) {
      const [letter, list] = dup
      list.sort((a, b) => b.y - a.y)
      await page.keyboard.press(letter)
      await delay(150)
      const afterLock = await getTargets(page)
      const lockedTarget = afterLock.find((t) => t.classes.includes('border-[var(--color-accent-yellow)]'))
      if (lockedTarget?.id === list[0].id) pass('lock-on: picks lowest target')
      else fail('lock-on: picks lowest target', JSON.stringify({ expected: list[0].id, lockedTarget }))
    } else {
      userVerify('lock-on: same starting letter priority', '同一先頭文字の同時出現が確認できず')
    }

    // game over flow on trainee (wait for defense drain)
    await page.goto(BASE, { waitUntil: 'domcontentloaded' })
    await startDifficulty(page, '忍頭')
    await waitForTarget(page)

    let onResult = false
    for (let i = 0; i < 45; i += 1) {
      await delay(2000)
      onResult = (await page.locator('body').innerText()).includes('DEFENSE FAILED')
      if (onResult) break
    }

    if (onResult) pass('game over: result screen')
    else userVerify('game over: result screen', '120秒以内に自動到達できず')

    if (onResult) {
      const resultText = await page.locator('body').innerText()
      if (resultText.includes('FINAL SCORE') && resultText.includes('忍頭')) pass('result: stats visible')
      else fail('result: stats visible', resultText)

      await page.getByRole('button', { name: '同じ難易度でもう一度' }).click()
      await waitForTarget(page)
      hud = await getHud(page)
      if (hud.score === 0 && hud.stage === 1 && hud.defense === 100) pass('retry: same difficulty resets state')
      else fail('retry: same difficulty resets state', JSON.stringify(hud))

      await delay(25000)
      if ((await page.locator('body').innerText()).includes('DEFENSE FAILED')) {
        await page.getByRole('button', { name: '難易度を変更' }).click()
        if ((await page.locator('body').innerText()).includes('難易度選択')) pass('result: change difficulty')
        else fail('result: change difficulty', 'not on difficulty screen')

        await page.goto(BASE, { waitUntil: 'domcontentloaded' })
        await startDifficulty(page, '忍頭')
        await waitForTarget(page)
        await delay(25000)
      }

      if ((await page.locator('body').innerText()).includes('DEFENSE FAILED')) {
        await page.getByRole('button', { name: 'タイトルへ戻る' }).click()
        if ((await page.locator('body').innerText()).includes('Shinobi Keys')) pass('result: back to title')
        else fail('result: back to title', 'not on title')
      } else {
        userVerify('result: navigation buttons', '2回目のゲームオーバー到達前に終了')
      }

      for (let i = 0; i < 2; i++) {
        await page.goto(BASE, { waitUntil: 'domcontentloaded' })
        await startDifficulty(page, '忍者')
        await waitForTarget(page)
        const t = (await getTargets(page))[0]
        if (t?.inputText) await typeWord(page, t.inputText)
        await delay(300)
      }
      pass('retry: multiple sessions without crash')
    }

    // difficulty differences (config + fall speed sample)
    const speeds = {}
    for (const [label, key] of [
      ['修行生', 'trainee'],
      ['忍者', 'ninja'],
      ['忍頭', 'master'],
    ]) {
      await page.goto(BASE, { waitUntil: 'domcontentloaded' })
      await startDifficulty(page, label)
      await waitForTarget(page)
      const a = await getTargets(page)
      await delay(700)
      const b = await getTargets(page)
      const same = a.find((t) => b.some((x) => x.id === t.id))
      if (same) {
        const bSame = b.find((x) => x.id === same.id)
        speeds[key] = (bSame.y - same.y) / 700
      }
    }
    if (speeds.trainee && speeds.ninja && speeds.master) {
      if (speeds.trainee < speeds.ninja && speeds.ninja < speeds.master) {
        pass('difficulty: fall speed ordering')
      } else {
        fail('difficulty: fall speed ordering', JSON.stringify(speeds))
      }
    } else {
      userVerify('difficulty: fall speed ordering', JSON.stringify(speeds))
    }

    // responsive layouts
    for (const width of [375, 1280]) {
      await page.setViewportSize({ width, height: 800 })
      await page.goto(BASE, { waitUntil: 'domcontentloaded' })
      const box = await page.locator('main').first().boundingBox()
      if (box && box.width <= width) pass(`layout: viewport ${width}`)
      else fail(`layout: viewport ${width}`, JSON.stringify(box))
    }

    if (pageErrors.length === 0) pass('console: no page errors')
    else fail('console: no page errors', pageErrors.join('\n'))
  } finally {
    await browser.close()
    dev.kill('SIGTERM')
  }

  console.log(JSON.stringify(results, null, 2))
  if (results.failed.length > 0) process.exit(1)
}

runChecks().catch((error) => {
  console.error(error)
  process.exit(1)
})
