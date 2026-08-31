/**
 * Playwright check: 10-pull polish (active slot, background dim, card size, complete).
 * Run: node scripts/gacha-multi-polish-check.mjs
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { existsSync } from 'node:fs'

const PORT = 4185
const BASE = `http://127.0.0.1:${PORT}`
const STORAGE_KEY = 'shinobi-keys-data'

const results = { passed: [], failed: [] }

function pass(name, detail = '') {
  results.passed.push({ name, detail })
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

function seedEconomy(page) {
  return page.addInitScript(
    ({ key }) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 3,
          settings: {
            volume: 0,
            muted: true,
            lastDifficulty: 'trainee',
            motionPreference: 'full',
          },
          aggregates: { totalPlays: 0, totalTypedChars: 0, bestComboAll: 0 },
          bestByDifficulty: { trainee: null, ninja: null, master: null },
          recentPlays: [],
          economy: {
            coins: 10_000,
            ownedCharacterIds: ['shinobi-default'],
            selectedCharacterId: 'shinobi-default',
            gachaHistory: [],
          },
        }),
      )
    },
    { key: STORAGE_KEY },
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

async function sampleMidReveal(page) {
  return page.evaluate(() => {
    const grid = document.querySelector('[data-testid="gacha-multi-scrolls"]')
    const gridStyle = grid ? getComputedStyle(grid) : null
    const activeIndex = document
      .querySelector('[data-testid="gacha-pull-reveal"]')
      ?.getAttribute('data-active-reveal-index')
    const activeSlot = document.querySelector(
      `[data-testid="gacha-multi-scroll-slot"][data-scroll-index="${activeIndex}"]`,
    )
    const activeStyle = activeSlot ? getComputedStyle(activeSlot) : null
    const slot = document.querySelector('[data-testid="gacha-multi-scroll-slot"]')
    const slotRect = slot?.getBoundingClientRect()
    const gridRect = grid?.getBoundingClientRect()
    return {
      gridOpacity: gridStyle ? Number.parseFloat(gridStyle.opacity) : null,
      gridBackgroundDimmed: grid?.getAttribute('data-background-dimmed'),
      activeIndex,
      activeSlotClass: activeSlot?.className ?? null,
      activeSlotOpacity: activeStyle ? Number.parseFloat(activeStyle.opacity) : null,
      activeSlotTransform: activeStyle?.transform ?? null,
      activeRevealAttr: activeSlot?.getAttribute('data-active-reveal-slot'),
      cardWidth: slotRect?.width ?? null,
      cardHeight: slotRect?.height ?? null,
      gridWidth: gridRect?.width ?? null,
      gridHeight: gridRect?.height ?? null,
      viewportW: window.innerWidth,
      viewportH: window.innerHeight,
      gridInViewport:
        gridRect &&
        gridRect.top >= 0 &&
        gridRect.left >= 0 &&
        gridRect.bottom <= window.innerHeight &&
        gridRect.right <= window.innerWidth,
    }
  })
}

async function sampleFinal(page) {
  return page.evaluate(() => {
    const grid = document.querySelector('[data-testid="gacha-multi-scrolls"]')
    const pull = document.querySelector('[data-testid="gacha-pull-reveal"]')
    const slot = document.querySelector('[data-testid="gacha-multi-scroll-slot"]')
    const slotRect = slot?.getBoundingClientRect()
    const gridRect = grid?.getBoundingClientRect()
    return {
      complete: grid?.getAttribute('data-complete'),
      multiComplete: pull?.getAttribute('data-multi-complete'),
      cardWidth: slotRect?.width ?? null,
      cardHeight: slotRect?.height ?? null,
      gridInViewport:
        gridRect &&
        gridRect.top >= 0 &&
        gridRect.left >= 0 &&
        gridRect.bottom <= window.innerHeight &&
        gridRect.right <= window.innerWidth,
      pullType: pull?.getAttribute('data-pull-type'),
    }
  })
}

async function runViewportChecks(page, label) {
  await page.getByRole('button', { name: 'ガチャ' }).click()
  await page.waitForSelector('[data-testid="gacha-multi"]')

  const multiSeq = []
  for (let i = 0; i < 10; i += 1) {
    multiSeq.push(0.01, (i % 3) / 3)
  }
  await setGachaRng(page, multiSeq)
  await page.getByTestId('gacha-multi').click()
  await page.waitForSelector('[data-testid="gacha-pull-reveal"]', { timeout: 5000 })

  await delay(1200)
  const mid = await sampleMidReveal(page)
  console.log(`${label} mid:`, JSON.stringify(mid))

  if (mid.gridBackgroundDimmed === 'true') {
    pass(`${label}: grid background dimmed during central reveal`)
  } else {
    fail(`${label}: grid should have background dim`, JSON.stringify(mid))
  }

  if (mid.activeRevealAttr === 'true' && mid.activeSlotClass?.includes('gacha-scroll-slot--active-reveal')) {
    pass(`${label}: active slot highlighted`)
  } else {
    fail(`${label}: active slot class`, JSON.stringify(mid))
  }

  if (mid.gridOpacity !== null && mid.gridOpacity >= 0.5 && mid.gridOpacity <= 0.75) {
    pass(`${label}: grid opacity in range (${mid.gridOpacity})`)
  } else {
    fail(`${label}: grid opacity out of range`, JSON.stringify(mid))
  }

  if (mid.activeSlotOpacity !== null && mid.activeSlotOpacity >= 0.95) {
    pass(`${label}: active slot stays bright (${mid.activeSlotOpacity})`)
  } else {
    fail(`${label}: active slot should stay bright`, JSON.stringify(mid))
  }

  await page.waitForFunction(() => {
    const root = document.querySelector('[data-testid="gacha-pull-reveal"]')
    return root?.getAttribute('data-revealed-count') === '10'
  }, null, { timeout: 120000 })

  await delay(500)
  const end = await sampleFinal(page)
  console.log(`${label} end:`, JSON.stringify(end))

  if (end.complete === 'true' && end.multiComplete === 'true') {
    pass(`${label}: complete animation flagged once`)
  } else {
    fail(`${label}: complete state`, JSON.stringify(end))
  }

  if (end.cardWidth !== null && end.cardWidth >= 135) {
    pass(`${label}: card width >= 135px (${end.cardWidth}px)`)
  } else {
    fail(`${label}: card too small`, JSON.stringify(end))
  }

  const dupCompact = await page.evaluate(() => {
    const slots = [...document.querySelectorAll('[data-testid="gacha-multi-scroll-slot"]')]
    const dupLines = slots.map((slot) => ({
      compact: slot.querySelector('[data-testid="gacha-result-duplicate-compact"]')?.textContent ?? null,
      fullDup: slot.querySelector('[data-testid="gacha-result-duplicate"]')?.textContent ?? null,
    }))
    return dupLines.filter((line) => line.compact || line.fullDup)
  })
  if (dupCompact.length > 0 && dupCompact.every((line) => line.compact && !line.fullDup)) {
    pass(`${label}: duplicate compact in final grid`)
  } else if (dupCompact.length === 0) {
    pass(`${label}: no duplicate cards in rng sample`)
  } else {
    fail(`${label}: duplicate should be compact in grid`, JSON.stringify(dupCompact))
  }

  const margins = await page.evaluate(() => {
    const grid = document.querySelector('[data-testid="gacha-multi-scrolls"]')?.getBoundingClientRect()
    if (!grid) return null
    return {
      top: grid.top,
      left: grid.left,
      bottom: window.innerHeight - grid.bottom,
      right: window.innerWidth - grid.right,
    }
  })
  if (
    margins &&
    margins.top >= 16 &&
    margins.left >= 16 &&
    margins.bottom >= 16 &&
    margins.right >= 16
  ) {
    pass(`${label}: grid margins >= 16px`, JSON.stringify(margins))
  } else {
    fail(`${label}: grid margins too tight`, JSON.stringify(margins))
  }

  if (end.gridInViewport) {
    pass(`${label}: grid fits viewport`)
  } else {
    fail(`${label}: grid overflow`, JSON.stringify(end))
  }

  await page.getByTestId('gacha-reveal-close').click()
  await delay(400)
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

  try {
    for (const viewport of [
      { width: 1280, height: 800, label: '1280x800' },
      { width: 1512, height: 982, label: '1512x982' },
    ]) {
      const context = await browser.newContext({ viewport })
      const page = await context.newPage()
      await seedEconomy(page)
      await page.goto(BASE, { waitUntil: 'domcontentloaded' })
      await runViewportChecks(page, viewport.label)
      await context.close()
    }

    const singleCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const singlePage = await singleCtx.newPage()
    await seedEconomy(singlePage)
    await singlePage.goto(BASE, { waitUntil: 'domcontentloaded' })
    await singlePage.getByRole('button', { name: 'ガチャ' }).click()
    await setGachaRng(singlePage, [0.01, 0.5])
    await singlePage.getByTestId('gacha-single').click()
    await singlePage.waitForSelector('[data-testid="gacha-single-scroll-slot"]')
    const singleCheck = await singlePage.evaluate(() => {
      const slot = document.querySelector('[data-testid="gacha-single-scroll-slot"]')
      const style = slot ? getComputedStyle(slot) : null
      const rect = slot?.getBoundingClientRect()
      return {
        hasMultiBackground: Boolean(document.querySelector('.gacha-multi-scrolls--background')),
        hasActiveReveal: Boolean(document.querySelector('.gacha-scroll-slot--active-reveal')),
        width: rect?.width ?? null,
        maxWidth: style?.maxWidth ?? null,
      }
    })
    if (!singleCheck.hasMultiBackground && !singleCheck.hasActiveReveal) {
      pass('single pull: no multi-only classes')
    } else {
      fail('single pull should not have multi classes', JSON.stringify(singleCheck))
    }
    if (singleCheck.width !== null && singleCheck.width <= 280) {
      pass(`single pull: closed slot width reasonable (${singleCheck.width}px)`)
    } else {
      fail('single pull: slot too wide at start', JSON.stringify(singleCheck))
    }
    await singleCtx.close()
  } finally {
    await browser.close()
    preview.kill('SIGTERM')
  }
}

runChecks()
  .then(() => {
    console.log('\n=== Gacha Multi Polish Check ===')
    for (const p of results.passed) {
      console.log('PASS:', p.name, p.detail ? `(${p.detail})` : '')
    }
    for (const f of results.failed) {
      console.log('FAIL:', f.name, '->', f.detail)
    }
    if (results.failed.length > 0) process.exit(1)
  })
  .catch((error) => {
    console.error('runChecks error:', error)
    process.exit(2)
  })
