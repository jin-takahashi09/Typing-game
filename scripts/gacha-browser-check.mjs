/**
 * Focused gacha UI + flow browser check (Playwright + vite preview).
 * Run: node scripts/gacha-browser-check.mjs
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const PORT = 4183
const BASE = `http://127.0.0.1:${PORT}`
const STORAGE_KEY = 'shinobi-keys-data'
const SHOT_DIR = join(process.cwd(), 'test-results', 'gacha-ui')

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
      /* wait */
    }
    await delay(400)
  }
  throw new Error('preview server did not start')
}

function seedEconomy(page, economyPatch = {}, settingsPatch = {}) {
  return page.addInitScript(
    ({ key, economyPatch: eco, settingsPatch: settings }) => {
      const seed = {
        version: 3,
        settings: {
          volume: 0,
          muted: true,
          lastDifficulty: 'trainee',
          motionPreference: 'full',
          ...settings,
        },
        aggregates: { totalPlays: 0, totalTypedChars: 0, bestComboAll: 0 },
        bestByDifficulty: { trainee: null, ninja: null, master: null },
        recentPlays: [],
        economy: {
          coins: 10_000,
          ownedCharacterIds: ['shinobi-default'],
          selectedCharacterId: 'shinobi-default',
          gachaHistory: [],
          ...eco,
        },
      }
      localStorage.setItem(key, JSON.stringify(seed))
    },
    { key: STORAGE_KEY, economyPatch, settingsPatch },
  )
}

async function setGachaRng(page, values) {
  await page.evaluate((seq) => {
    let i = 0
    window.__SHINOBI_KEYS_TEST__ = {
      ...(window.__SHINOBI_KEYS_TEST__ ?? {}),
      gachaRng: () => {
        const v = seq[Math.min(i, seq.length - 1)]
        i += 1
        return v
      },
    }
  }, values)
}

async function clearGachaRng(page) {
  await page.evaluate(() => {
    if (window.__SHINOBI_KEYS_TEST__) {
      delete window.__SHINOBI_KEYS_TEST__.gachaRng
    }
  })
}

async function openGacha(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'ガチャ' }).click()
  await page.waitForSelector('[data-testid="gacha-single"]')
}

async function waitResultModal(page) {
  await page.waitForSelector('[data-testid="gacha-result-modal"]', {
    timeout: 8000,
  })
  // Wait for card entrance animation to settle (opacity ends at 1).
  await page.waitForFunction(() => {
    const card = document.querySelector('[data-testid="gacha-result-card"]')
    if (!card) return false
    return Number.parseFloat(getComputedStyle(card).opacity) >= 0.95
  }, null, { timeout: 3000 })
}

async function assertCenteredModal(page) {
  const info = await page.evaluate(() => {
    const modal = document.querySelector('[data-testid="gacha-result-modal"]')
    const portal = document.querySelector('[data-testid="gacha-result-portal"]')
    if (!modal || !portal) {
      return { ok: false, reason: 'missing nodes' }
    }
    const parentIsBody = portal.parentElement === document.body
    const style = getComputedStyle(portal)
    const rect = modal.getBoundingClientRect()
    const viewportH = window.innerHeight
    const viewportW = window.innerWidth
    const centerY = rect.top + rect.height / 2
    const nearCenter = Math.abs(centerY - viewportH / 2) < viewportH * 0.35
    const notAtPageBottom = rect.bottom < viewportH + 2 && rect.top > -2
    return {
      ok:
        parentIsBody &&
        style.position === 'fixed' &&
        nearCenter &&
        notAtPageBottom,
      parentIsBody,
      position: style.position,
      zIndex: style.zIndex,
      rect: { top: rect.top, bottom: rect.bottom, left: rect.left, width: rect.width },
      nearCenter,
      notAtPageBottom,
      viewportH,
      viewportW,
    }
  })
  return info
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
      build.on('exit', (code) =>
        code === 0 ? resolve() : reject(new Error('build failed')),
      )
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
  const consoleErrors = []

  try {
    // ---------- Context A: full motion, rich checks ----------
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const page = await context.newPage()
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('pageerror', (err) => consoleErrors.push(err.message))

    await seedEconomy(page)
    await openGacha(page)

    const body = await page.locator('body').innerText()
    if (body.includes('単発') && body.includes('10連')) {
      pass('gacha: pull buttons visible (single + 10x)')
    } else {
      fail('gacha: pull buttons missing', body.slice(0, 300))
    }
    if (!body.includes('？？？') && !body.includes('未所持') && !body.includes('排出履歴')) {
      pass('gacha: owned-only, no history UI')
    } else {
      fail('gacha: owned-only, no history UI', 'found forbidden text')
    }
    if ((await page.getByTestId('gacha-owned-list').count()) === 0) {
      pass('gacha: no owned list on gacha screen')
    } else {
      fail('gacha: no owned list on gacha screen', 'list present')
    }
    if ((await page.getByTestId('gacha-open-shinobi-record').count()) === 0) {
      pass('gacha: no shinobi record link')
    } else {
      fail('gacha: no shinobi record link', 'link present')
    }
    if (await page.getByTestId('gacha-scroll-shrine').isVisible()) {
      pass('gacha: scroll shrine visible')
    } else {
      fail('gacha: scroll shrine visible', 'missing')
    }
    for (const rate of ['55', '25', '12', '6', '2']) {
      if (!body.includes(rate)) {
        fail(`gacha: missing rate percent ${rate}%`, body.slice(0, 300))
      }
    }
    if (results.failed.every((f) => !f.name.startsWith('gacha: missing rate'))) {
      pass('gacha: all rarity rates rendered')
    }

    // 1-2. Single pull: coin spend + reveal phase
    const coinsBefore = Number(await page.getByTestId('gacha-coins').innerText())
    // Force N (new character that is not default): rarity N + pick index 1 → shinobi-kage
    await setGachaRng(page, [0.01, 0.5])
    await page.getByTestId('gacha-single').click()

    await page.waitForSelector(
      '[data-testid="gacha-phase"][data-phase="machine"], [data-testid="gacha-reveal"]',
      { timeout: 5000 },
    )
    const phaseAfterPull = await page.getByTestId('gacha-phase').getAttribute('data-phase')
    if (phaseAfterPull === 'machine' || phaseAfterPull === 'reveal') {
      pass('gacha: enters machine/reveal phase')
    } else {
      fail('gacha: enters machine/reveal phase', `phase=${phaseAfterPull}`)
    }

    await page.waitForSelector('[data-testid="gacha-reveal"], [data-testid="gacha-scroll-shrine"]', {
      timeout: 5000,
    })
    const revealOrShrine = await page.evaluate(() => {
      return Boolean(
        document.querySelector('[data-testid="gacha-reveal"]') ||
          document.querySelector('[data-testid="gacha-scroll-shrine"]'),
      )
    })
    if (revealOrShrine) {
      pass('gacha: reveal or shrine DOM visible')
    } else {
      fail('gacha: reveal or shrine DOM visible', 'not visible')
    }

    await page.screenshot({
      path: join(SHOT_DIR, 'single-normal.png'),
      fullPage: false,
    })

    // Skip → result
    await page.getByTestId('gacha-reveal-skip').click()
    await waitResultModal(page)
    pass('gacha: skip moves to result')

    const coinsAfter = Number(await page.getByTestId('gacha-coins').innerText())
    // N new: cost 100, no dup coins
    if (coinsAfter === coinsBefore - 100) {
      pass('gacha: single costs 100 coins')
    } else {
      fail('gacha: single costs 100 coins', `before=${coinsBefore} after=${coinsAfter}`)
    }

    const modalInfo = await assertCenteredModal(page)
    if (modalInfo.ok) {
      pass('gacha: result is centered portal modal')
    } else {
      fail('gacha: result is centered portal modal', JSON.stringify(modalInfo))
    }

    // Result should not be under main content as flow child
    const inMainFlow = await page.evaluate(() => {
      const modal = document.querySelector('[data-testid="gacha-result-modal"]')
      const main = document.querySelector('main')
      return Boolean(modal && main && main.contains(modal))
    })
    if (!inMainFlow) {
      pass('gacha: result not in page flow bottom')
    } else {
      fail('gacha: result not in page flow bottom', 'modal still inside main')
    }

    const card = page.getByTestId('gacha-result-card').first()
    const cardText = await card.innerText()
    if (/NEW/.test(cardText)) pass('gacha: NEW label shown')
    else fail('gacha: NEW label shown', cardText.slice(0, 200))

    if (/N|R|SR|SSR|UR/.test(cardText)) pass('gacha: rarity shown')
    else fail('gacha: rarity shown', cardText.slice(0, 200))

    const nameEl = card.locator('.gacha-result-card__name')
    if ((await nameEl.count()) && (await nameEl.innerText()).length > 0) {
      pass('gacha: character name shown')
    } else {
      fail('gacha: character name shown', 'missing')
    }

    const figureSize = await page.evaluate(() => {
      const fig = document.querySelector(
        '[data-testid="gacha-result-card"] .character-preview--gacha-result',
      )
      if (!fig) return 0
      return fig.getBoundingClientRect().height
    })
    if (figureSize >= 140) pass('gacha: character figure large enough')
    else fail('gacha: character figure large enough', `h=${figureSize}`)

    await page.screenshot({
      path: join(SHOT_DIR, 'single-result.png'),
      fullPage: false,
    })

    // Result does not auto-close
    await delay(1500)
    if (await page.getByTestId('gacha-result-modal').isVisible()) {
      pass('gacha: result stays until close')
    } else {
      fail('gacha: result stays until close', 'auto disappeared')
    }

    // Body scroll locked
    const locked = await page.evaluate(() => document.body.style.overflow === 'hidden')
    if (locked) pass('gacha: background scroll locked')
    else fail('gacha: background scroll locked', 'overflow not hidden')

    await page.getByTestId('gacha-reveal-close').click()
    await page.waitForSelector('[data-testid="gacha-result-modal"]', {
      state: 'detached',
      timeout: 5000,
    })
    pass('gacha: close dismisses result')

    const unlocked = await page.evaluate(() => document.body.style.overflow !== 'hidden')
    if (unlocked) pass('gacha: scroll restored after close')
    else fail('gacha: scroll restored after close', 'still locked')

    // Duplicate pull of default-owned via forcing first N char (index 0)
    await setGachaRng(page, [0.01, 0])
    await page.getByTestId('gacha-single').click()
    await page.getByTestId('gacha-reveal-skip').click({ timeout: 4000 }).catch(() => {})
    await waitResultModal(page)
    const dupText = await page.getByTestId('gacha-result-card').first().innerText()
    if (/DUPLICATE/.test(dupText) && /\+10/.test(dupText)) {
      pass('gacha: DUPLICATE + coins shown')
    } else {
      fail('gacha: DUPLICATE + coins shown', dupText.slice(0, 200))
    }
    if (!/NEW/.test(dupText)) {
      pass('gacha: NEW hidden on duplicate')
    } else {
      fail('gacha: NEW hidden on duplicate', dupText.slice(0, 120))
    }
    await page.screenshot({
      path: join(SHOT_DIR, 'duplicate-result.png'),
      fullPage: false,
    })
    await page.getByTestId('gacha-reveal-close').click()
    await page.waitForSelector('[data-testid="gacha-result-modal"]', {
      state: 'detached',
      timeout: 5000,
    })

    // SSR reveal — wait until lightning / smoke is on stage
    await setGachaRng(page, [0.93, 0])
    await page.getByTestId('gacha-single').click()
    await page.waitForSelector('[data-testid="gacha-reveal"][data-peak-rarity="SSR"]', {
      timeout: 5000,
    })
    await page.waitForFunction(() => {
      const reveal = document.querySelector('[data-testid="gacha-reveal"]')
      if (!reveal) return false
      return Boolean(
        reveal.querySelector('.gacha-lightning') ||
          reveal.querySelector('[data-testid="gacha-lightning"]') ||
          reveal.querySelector('.gacha-reveal__smoke') ||
          reveal.querySelector('.gacha-reveal__rarity-banner'),
      )
    }, null, { timeout: 5000 })
    const ssrClass = await page.getByTestId('gacha-reveal').getAttribute('class')
    if (ssrClass?.includes('gacha-reveal--ssr')) pass('gacha: SSR reveal styling')
    else fail('gacha: SSR reveal styling', ssrClass ?? 'none')
    await page.screenshot({ path: join(SHOT_DIR, 'single-ssr.png'), fullPage: false })
    await page.getByTestId('gacha-reveal-skip').click()
    await waitResultModal(page)
    await page.getByTestId('gacha-reveal-close').click()
    await page.waitForSelector('[data-testid="gacha-result-modal"]', { state: 'detached' })

    // UR reveal — wait for crest / gold scroll / rainbow
    await setGachaRng(page, [0.99, 0])
    await page.getByTestId('gacha-single').click()
    await page.waitForSelector('[data-testid="gacha-reveal"][data-peak-rarity="UR"]', {
      timeout: 5000,
    })
    await page.waitForFunction(() => {
      const reveal = document.querySelector('[data-testid="gacha-reveal"]')
      if (!reveal) return false
      return Boolean(
        reveal.querySelector('[data-testid="gacha-crest"]') ||
          reveal.querySelector('.gacha-reveal__crest') ||
          reveal.querySelector('.gacha-reveal__scroll--gold') ||
          reveal.querySelector('[data-testid="gacha-rainbow"]') ||
          reveal.querySelector('.gacha-reveal__rarity-banner'),
      )
    }, null, { timeout: 6000 })
    const urClass = await page.getByTestId('gacha-reveal').getAttribute('class')
    if (urClass?.includes('gacha-reveal--ur')) pass('gacha: UR reveal styling')
    else fail('gacha: UR reveal styling', urClass ?? 'none')
    await page.screenshot({ path: join(SHOT_DIR, 'single-ur.png'), fullPage: false })
    await page.getByTestId('gacha-reveal-skip').click()
    await waitResultModal(page)
    await page.getByTestId('gacha-reveal-close').click()
    await page.waitForSelector('[data-testid="gacha-result-modal"]', { state: 'detached' })

    // 10-pull
    const multiSeq = []
    for (let i = 0; i < 10; i += 1) {
      multiSeq.push(0.01, (i % 3) / 3)
    }
    await setGachaRng(page, multiSeq)
    await page.getByTestId('gacha-multi').click()
    await page.getByTestId('gacha-reveal-skip').click({ timeout: 4000 }).catch(() => {})
    await waitResultModal(page)
    const cards = await page.getByTestId('gacha-result-card').count()
    if (cards === 10) pass('gacha: 10-pull shows 10 cards')
    else fail('gacha: 10-pull shows 10 cards', `cards=${cards}`)

    const multiFits = await page.evaluate(() => {
      const modal = document.querySelector('[data-testid="gacha-result-modal"]')
      if (!modal) return false
      const rect = modal.getBoundingClientRect()
      return rect.width <= window.innerWidth + 1 && rect.height <= window.innerHeight + 1
    })
    if (multiFits) pass('gacha: 10-pull modal fits viewport')
    else fail('gacha: 10-pull modal fits viewport', 'overflow')

    await page.screenshot({
      path: join(SHOT_DIR, 'ten-pull-result.png'),
      fullPage: false,
    })
    await page.getByTestId('gacha-reveal-close').click()
    await page.waitForSelector('[data-testid="gacha-result-modal"]', { state: 'detached' })

    // 320px
    await page.setViewportSize({ width: 320, height: 640 })
    await setGachaRng(page, [0.01, 0.2])
    await page.getByTestId('gacha-single').click()
    await page.getByTestId('gacha-reveal-skip').click({ timeout: 4000 }).catch(() => {})
    await waitResultModal(page)
    const mobileScrollX = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 2,
    )
    const mobileCenter = await assertCenteredModal(page)
    if (!mobileScrollX && mobileCenter.ok) {
      pass('gacha: 320px no horizontal scroll + centered')
    } else {
      fail(
        'gacha: 320px no horizontal scroll + centered',
        JSON.stringify({ mobileScrollX, mobileCenter }),
      )
    }
    await page.screenshot({
      path: join(SHOT_DIR, 'mobile-320-result.png'),
      fullPage: false,
    })
    await page.getByTestId('gacha-reveal-close').click()
    await clearGachaRng(page)
    await context.close()

    // ---------- Context B: reduced motion still keeps result ----------
    const reducedCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const reducedPage = await reducedCtx.newPage()
    await seedEconomy(reducedPage, {}, { motionPreference: 'reduced' })
    await openGacha(reducedPage)
    await setGachaRng(reducedPage, [0.01, 0.4])
    await reducedPage.getByTestId('gacha-single').click()
    await reducedPage.waitForSelector('[data-testid="gacha-reveal"]', { timeout: 5000 })
    // Wait for short FX to finish without skip
    await reducedPage.waitForSelector('[data-testid="gacha-result-modal"]', {
      timeout: 5000,
    })
    await delay(800)
    if (await reducedPage.getByTestId('gacha-result-modal').isVisible()) {
      pass('gacha: reduced motion keeps result until close')
    } else {
      fail('gacha: reduced motion keeps result until close', 'missing modal')
    }
    await reducedPage.getByTestId('gacha-reveal-close').click()
    await reducedCtx.close()

    if (consoleErrors.length === 0) {
      pass('no console errors during gacha flow')
    } else {
      fail('console errors', consoleErrors.slice(0, 5).join('\n'))
    }
  } finally {
    await browser.close()
    preview.kill('SIGTERM')
  }
}

runChecks()
  .then(() => {
    console.log('\n=== Gacha Browser Check ===')
    for (const p of results.passed) console.log('PASS:', p)
    for (const f of results.failed) console.log('FAIL:', f.name, '->', f.detail)
    if (results.failed.length > 0) process.exit(1)
  })
  .catch((error) => {
    console.error('runChecks error:', error)
    process.exit(2)
  })
