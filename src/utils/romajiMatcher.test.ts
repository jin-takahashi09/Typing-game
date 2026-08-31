import { describe, expect, it } from 'vitest'
import {
  createRomajiMatchState,
  getActiveRomajiView,
  processRomajiInput,
  resolveActiveRomajiDisplay,
} from './romajiMatcher'
import { buildDisplayRomajiFromReading } from './romajiRules'
import { typingProblems } from '../data/typingProblems'
import type { TypingProblem } from '../types/typing'

function makeProblem(overrides: Partial<TypingProblem> = {}): TypingProblem {
  return {
    id: 'test',
    displayText: 'やま',
    reading: 'やま',
    romajiPatterns: ['yama'],
    difficulty: 'trainee',
    category: 'basic',
    baseScore: 80,
    ...overrides,
  }
}

function typeWord(problem: TypingProblem, word: string) {
  let state = createRomajiMatchState()
  for (const char of word) {
    const result = processRomajiInput(state, problem, char)
    if (!result.accepted) {
      return { ok: false as const, state, char, word }
    }
    state = result.nextState
  }
  return { ok: true as const, state, word }
}

describe('romajiMatcher', () => {
  it('accepts a single-pattern word sequentially', () => {
    const problem = makeProblem()
    const typed = typeWord(problem, 'yama')
    expect(typed.ok).toBe(true)
    expect(typed.state.isComplete).toBe(true)
    expect(typed.state.confirmedLength).toBe(4)
  })

  it('accepts shinobi and sinobi variants', () => {
    const problem = makeProblem({
      displayText: 'しのび',
      reading: 'しのび',
      romajiPatterns: ['shinobi', 'sinobi'],
    })

    expect(typeWord(problem, 'shinobi').ok).toBe(true)
    expect(typeWord(problem, 'sinobi').ok).toBe(true)
  })

  it('accepts tomodati display while accepting tomodachi input', () => {
    const problem = makeProblem({
      displayText: '友達',
      reading: 'ともだち',
      romajiPatterns: ['tomodachi', 'tomodati'],
    })
    expect(buildDisplayRomajiFromReading(problem.reading)).toBe('tomodati')
    expect(typeWord(problem, 'tomodati').ok).toBe(true)
    expect(typeWord(problem, 'tomodachi').ok).toBe(true)
    expect(typeWord(problem, 'TOMODATI').ok).toBe(true)
    expect(typeWord(problem, 'TOMODACHI').ok).toBe(true)
  })

  it('accepts shi and si while typing shinobi', () => {
    const problem = makeProblem({
      displayText: 'しのび',
      reading: 'しのび',
      romajiPatterns: ['shinobi', 'sinobi'],
    })

    let state = createRomajiMatchState()
    for (const char of 'si') {
      const result = processRomajiInput(state, problem, char)
      expect(result.accepted).toBe(true)
      state = result.nextState
    }
    expect(state.isComplete).toBe(false)
  })

  it('accepts chi and ti variants', () => {
    const problem = makeProblem({
      displayText: 'ちず',
      reading: 'ちず',
      romajiPatterns: ['chizu', 'tizu'],
    })
    expect(typeWord(problem, 'chizu').ok).toBe(true)
    expect(typeWord(problem, 'tizu').ok).toBe(true)
  })

  it('accepts tsu and tu variants', () => {
    const problem = makeProblem({
      displayText: 'つき',
      reading: 'つき',
      romajiPatterns: ['tsuki', 'tuki'],
    })
    expect(typeWord(problem, 'tsuki').ok).toBe(true)
    expect(typeWord(problem, 'tuki').ok).toBe(true)
  })

  it('accepts yoon input', () => {
    const problem = makeProblem({
      displayText: 'しゃしん',
      reading: 'しゃしん',
      romajiPatterns: ['shashin', 'syashin'],
    })
    expect(typeWord(problem, 'shashin').ok).toBe(true)
    expect(typeWord(problem, 'syashin').ok).toBe(true)
  })

  it('accepts small tsu as doubled consonant', () => {
    const problem = makeProblem({
      displayText: 'がっこう',
      reading: 'がっこう',
      romajiPatterns: ['gakkou', 'gakko'],
    })
    expect(typeWord(problem, 'gakkou').ok).toBe(true)
  })

  it('accepts sushi and susi for すし, rejects trailing junk', () => {
    const problem = makeProblem({
      id: 'sushi-test',
      displayText: 'すし',
      reading: 'すし',
      romajiPatterns: ['sushi', 'susi'],
    })
    expect(typeWord(problem, 'sushi').ok && typeWord(problem, 'sushi').state.isComplete).toBe(
      true,
    )
    expect(typeWord(problem, 'susi').ok && typeWord(problem, 'susi').state.isComplete).toBe(true)
    const extra = typeWord(problem, 'sushii')
    expect(extra.ok && extra.state.isComplete).toBe(false)
  })

  it('accepts kansou and kannsou for 感想, rejects kannsoud', () => {
    const problem = makeProblem({
      id: 'kansou-test',
      displayText: '感想',
      reading: 'かんそう',
      romajiPatterns: ['kansou', 'kannsou'],
    })
    const a = typeWord(problem, 'kansou')
    expect(a.ok && a.state.isComplete).toBe(true)
    const b = typeWord(problem, 'kannsou')
    expect(b.ok && b.state.isComplete).toBe(true)
    const bad = typeWord(problem, 'kannsoud')
    expect(bad.ok && bad.state.isComplete).toBe(false)
  })

  it('keeps branching paths for n / nn before consonants', () => {
    const problem = makeProblem({
      id: 'annai-test',
      displayText: '案内',
      reading: 'あんない',
      romajiPatterns: ['annai'],
    })
    expect(typeWord(problem, 'annai').ok && typeWord(problem, 'annai').state.isComplete).toBe(
      true,
    )
    expect(typeWord(problem, 'annnai').ok && typeWord(problem, 'annnai').state.isComplete).toBe(
      true,
    )
  })

  it('accepts fu and hu, ji and zi', () => {
    const fu = makeProblem({
      displayText: 'ふね',
      reading: 'ふね',
      romajiPatterns: ['fune'],
    })
    expect(typeWord(fu, 'fune').ok).toBe(true)
    expect(typeWord(fu, 'hune').ok).toBe(true)

    const ji = makeProblem({
      displayText: 'じかん',
      reading: 'じかん',
      romajiPatterns: ['jikan'],
    })
    expect(typeWord(ji, 'jikan').ok).toBe(true)
    expect(typeWord(ji, 'zikan').ok).toBe(true)
  })

  it('accepts english words unchanged', () => {
    const problem = makeProblem({
      id: 'eng-test',
      displayText: 'コード',
      reading: 'こーど',
      romajiPatterns: ['ko-do'],
    })
    expect(typeWord(problem, 'ko-do').ok && typeWord(problem, 'ko-do').state.isComplete).toBe(
      true,
    )
  })

  it('rejects invalid characters and keeps state', () => {
    const problem = makeProblem()
    let state = createRomajiMatchState()
    const first = processRomajiInput(state, problem, 'y')
    state = first.nextState
    const rejected = processRomajiInput(state, problem, 'z')
    expect(rejected.accepted).toBe(false)
    expect(rejected.nextState).toEqual(state)
  })

  it('does not accept input after completion', () => {
    const problem = makeProblem()
    const typed = typeWord(problem, 'yama')
    expect(typed.ok).toBe(true)
    const after = processRomajiInput(typed.state, problem, 'a')
    expect(after.accepted).toBe(false)
  })

  it('marks completion when the final character is entered', () => {
    const problem = makeProblem()
    let state = createRomajiMatchState()
    for (const char of 'yam') {
      state = processRomajiInput(state, problem, char).nextState
    }
    const last = processRomajiInput(state, problem, 'a')
    expect(last.accepted).toBe(true)
    expect(last.isComplete).toBe(true)
  })

  it('accepts long vowel mark as hyphen only', () => {
    const ramen = makeProblem({
      id: 'choon-ramen',
      displayText: 'らーめん',
      reading: 'らーめん',
      romajiPatterns: ['ra-men'],
    })
    const geemu = makeProblem({
      id: 'choon-geemu',
      displayText: 'ゲーム',
      reading: 'げーむ',
      romajiPatterns: ['ge-mu'],
    })
    const koohii = makeProblem({
      id: 'choon-koohii',
      displayText: 'コーヒー',
      reading: 'こーひー',
      romajiPatterns: ['ko-hi-'],
    })

    const ramenTyped = typeWord(ramen, 'ra-men')
    expect(ramenTyped.ok).toBe(true)
    expect(ramenTyped.state.isComplete).toBe(true)

    const ramenSkip = typeWord(ramen, 'ramen')
    expect(ramenSkip.ok && ramenSkip.state.isComplete).toBe(false)

    const geemuTyped = typeWord(geemu, 'ge-mu')
    expect(geemuTyped.ok).toBe(true)
    expect(geemuTyped.state.isComplete).toBe(true)

    const koohiiTyped = typeWord(koohii, 'ko-hi-')
    expect(koohiiTyped.ok).toBe(true)
    expect(koohiiTyped.state.isComplete).toBe(true)
  })

  it('completes every display romaji pattern in the problem bank', () => {
    const failures: string[] = []
    for (const problem of typingProblems) {
      const representative = buildDisplayRomajiFromReading(problem.reading)
      expect(representative).toBeTruthy()
      const typed = typeWord(problem, representative)
      if (!typed.ok || !typed.state.isComplete) {
        failures.push(
          `${problem.id}:${representative}${typed.ok ? '' : `@${typed.char}`}`,
        )
      }
    }
    expect(failures).toEqual([])
  })
})

describe('sushi-da romaji display switching', () => {
  function displayAfter(problem: TypingProblem, typed: string): string {
    let state = createRomajiMatchState()
    for (const char of typed) {
      const result = processRomajiInput(state, problem, char)
      expect(result.accepted).toBe(true)
      state = result.nextState
    }
    return getActiveRomajiView(
      problem.romajiPatterns,
      state,
      buildDisplayRomajiFromReading(problem.reading),
    ).displayRomaji
  }

  it('keeps susi until susi uniquely determines the candidate', () => {
    const problem = makeProblem({
      displayText: 'すし',
      reading: 'すし',
      romajiPatterns: ['sushi', 'susi'],
    })
    const display = buildDisplayRomajiFromReading(problem.reading)
    expect(display).toBe('susi')
    expect(resolveActiveRomajiDisplay(problem.romajiPatterns, '', display)).toBe(
      'susi',
    )
    expect(displayAfter(problem, 's')).toBe('susi')
    expect(displayAfter(problem, 'su')).toBe('susi')
    expect(displayAfter(problem, 'sus')).toBe('susi')
    expect(displayAfter(problem, 'susi')).toBe('susi')
  })

  it('switches sinobi to shinobi once only shinobi remains', () => {
    const problem = makeProblem({
      displayText: 'しのび',
      reading: 'しのび',
      romajiPatterns: ['shinobi', 'sinobi'],
    })
    expect(buildDisplayRomajiFromReading(problem.reading)).toBe('sinobi')
    expect(displayAfter(problem, 's')).toBe('sinobi')
    expect(displayAfter(problem, 'sh')).toBe('shinobi')
    expect(displayAfter(problem, 'si')).toBe('sinobi')
    expect(displayAfter(problem, 'sin')).toBe('sinobi')
  })

  it('switches kansou to kannsou at kann', () => {
    const problem = makeProblem({
      displayText: '感想',
      reading: 'かんそう',
      romajiPatterns: ['kansou', 'kannsou'],
    })
    expect(displayAfter(problem, 'kan')).toBe('kansou')
    expect(displayAfter(problem, 'kann')).toBe('kannsou')
  })

  it('aligns typedLength with the switched display string', () => {
    const problem = makeProblem({
      displayText: 'すし',
      reading: 'すし',
      romajiPatterns: ['sushi', 'susi'],
    })
    let state = createRomajiMatchState()
    for (const char of 'susi') {
      state = processRomajiInput(state, problem, char).nextState
    }
    const view = getActiveRomajiView(
      problem.romajiPatterns,
      state,
      buildDisplayRomajiFromReading(problem.reading),
    )
    expect(view.displayRomaji).toBe('susi')
    expect(view.typedLength).toBe(4)
  })
})
