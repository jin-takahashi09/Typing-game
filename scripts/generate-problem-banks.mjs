/**
 * Shinobi Keys — generate typing problem banks (≥200 per difficulty).
 * Choon ー → ASCII hyphen `-` in romajiPatterns.
 * Run: node scripts/generate-problem-banks.mjs
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const script = path.join(__dirname, 'generate_problem_banks.py')

const result = spawnSync('python3', [script], {
  cwd: root,
  stdio: 'inherit',
})

process.exit(result.status ?? 1)
