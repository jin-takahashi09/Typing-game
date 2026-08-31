import { describe, expect, it } from 'vitest'
import { buildDisplayRomajiFromReading, formatRomajiForDisplay } from './romajiRules'

describe('buildDisplayRomajiFromReading', () => {
  it('uses si/ti/tu style for representative display', () => {
    expect(buildDisplayRomajiFromReading('ともだち')).toBe('tomodati')
    expect(buildDisplayRomajiFromReading('しま')).toBe('sima')
    expect(buildDisplayRomajiFromReading('すし')).toBe('susi')
    expect(buildDisplayRomajiFromReading('しのび')).toBe('sinobi')
    expect(buildDisplayRomajiFromReading('ちず')).toBe('tizu')
    expect(buildDisplayRomajiFromReading('つき')).toBe('tuki')
    expect(buildDisplayRomajiFromReading('ふね')).toBe('hune')
    expect(buildDisplayRomajiFromReading('じかん')).toBe('zikan')
  })

  it('uses sya/tya style for yoon display', () => {
    expect(buildDisplayRomajiFromReading('しゃしん')).toBe('syasin')
    expect(buildDisplayRomajiFromReading('ちゃいろ')).toBe('tyairo')
  })

  it('handles small tsu without triple consonants', () => {
    expect(buildDisplayRomajiFromReading('なっとう')).toBe('nattou')
    expect(buildDisplayRomajiFromReading('がっこう')).toBe('gakkou')
  })

  it('applies letter case only at the display layer', () => {
    expect(formatRomajiForDisplay(buildDisplayRomajiFromReading('ともだち'), 'lower')).toBe(
      'tomodati',
    )
    expect(formatRomajiForDisplay(buildDisplayRomajiFromReading('しまうま'), 'lower')).toBe(
      'simauma',
    )
    expect(formatRomajiForDisplay(buildDisplayRomajiFromReading('ともだち'), 'upper')).toBe(
      'TOMODATI',
    )
    expect(formatRomajiForDisplay(buildDisplayRomajiFromReading('しまうま'), 'upper')).toBe(
      'SIMAUMA',
    )
  })
})
