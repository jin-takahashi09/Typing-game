import type { TypingProblem } from '../../types/typing'
import { traineeProblems } from './trainee'
import { ninjaProblems } from './ninja'
import { masterProblems } from './master'

export const typingProblems: readonly TypingProblem[] = [
  ...traineeProblems,
  ...ninjaProblems,
  ...masterProblems,
]

export { traineeProblems, ninjaProblems, masterProblems }
