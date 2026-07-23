import { describe, expect, it } from 'vitest'
import {
  characters,
  getDefaultCharacter,
  resolveCharacter,
  toActivePlayCharacter,
} from '../config/characters'

describe('characters visuals and abilities', () => {
  it('gives each character a distinct pose and non-overlapping signature accessories', () => {
    const poses = new Set(characters.map((c) => c.visual.pose))
    expect(poses.size).toBe(characters.length)

    const def = characters.find((c) => c.id === 'shinobi-default')!
    const red = characters.find((c) => c.id === 'shinobi-red')!
    const blue = characters.find((c) => c.id === 'shinobi-blue')!
    const gold = characters.find((c) => c.id === 'shinobi-gold')!

    expect(def.visual.accessories).toContain('headband')
    expect(def.visual.accessories).not.toContain('scarf')
    expect(red.visual.accessories).toEqual(expect.arrayContaining(['scarf', 'dagger']))
    expect(blue.visual.accessories).toEqual(expect.arrayContaining(['shield', 'armor']))
    expect(gold.visual.accessories).toEqual(
      expect.arrayContaining(['scroll', 'coinBag', 'shoulderPad']),
    )
  })

  it('snapshots play character and falls back unknown ids', () => {
    const active = toActivePlayCharacter(getDefaultCharacter())
    expect(active.characterId).toBe('shinobi-default')
    expect(active.ability.type).toBe('none')
    expect(resolveCharacter('missing').id).toBe('shinobi-default')
  })
})
