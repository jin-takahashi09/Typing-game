import { describe, expect, it } from 'vitest'
import {
  characters,
  getDefaultCharacter,
  resolveCharacter,
  toActivePlayCharacter,
} from './characters'
import { gachaConfig } from './gachaConfig'

describe('characters visuals and abilities', () => {
  it('provides at least 15 characters with rarities and distinct skins', () => {
    expect(characters.length).toBeGreaterThanOrEqual(15)
    const skins = new Set(characters.map((c) => c.skinClass))
    expect(skins.size).toBe(characters.length)
    for (const character of characters) {
      expect(['N', 'R', 'SR', 'SSR', 'UR']).toContain(character.rarity)
      expect(character.ability.name.length).toBeGreaterThan(0)
      expect(character.visual.accessories.length).toBeGreaterThan(0)
    }
  })

  it('keeps signature loadouts for core cast', () => {
    const def = characters.find((c) => c.id === 'shinobi-default')!
    const red = characters.find((c) => c.id === 'shinobi-red')!
    const blue = characters.find((c) => c.id === 'shinobi-blue')!
    const gold = characters.find((c) => c.id === 'shinobi-gold')!

    expect(def.visual.accessories).toEqual(
      expect.arrayContaining(['headband', 'woodenShuriken', 'sandals', 'shortSword']),
    )
    expect(red.visual.accessories).toEqual(
      expect.arrayContaining(['scarf', 'dualBlades', 'redEyes']),
    )
    expect(blue.visual.accessories).toEqual(
      expect.arrayContaining(['shield', 'armor', 'mask']),
    )
    expect(gold.visual.accessories).toEqual(
      expect.arrayContaining(['helmet', 'scroll', 'coinBag', 'crest']),
    )
  })

  it('snapshots play character including rarity', () => {
    const active = toActivePlayCharacter(getDefaultCharacter())
    expect(active.characterId).toBe('shinobi-default')
    expect(active.ability.type).toBe('none')
    expect(active.rarity).toBe('N')
    expect(resolveCharacter('missing').id).toBe('shinobi-default')
  })

  it('has no HP / damageReduction abilities', () => {
    for (const character of characters) {
      expect(character.ability.type).not.toBe('damageReduction' as never)
      expect(character.ability.description).not.toMatch(/HP|被ダメージ|ダメージ軽減/)
      expect(['蒼影の守り', '白夜の帳', '夜叉の鉄壁']).not.toContain(
        character.ability.name,
      )
    }
    const byakuya = characters.find((c) => c.id === 'shinobi-byakuya')!
    const blue = characters.find((c) => c.id === 'shinobi-blue')!
    const yasha = characters.find((c) => c.id === 'shinobi-yasha')!
    expect(byakuya.ability).toMatchObject({
      type: 'comboMultiplierBonus',
      name: '白夜の冴え',
      value: 0.05,
    })
    expect(blue.ability).toMatchObject({
      type: 'scoreMultiplier',
      name: '蒼影の冴え',
      value: 1.08,
    })
    expect(yasha.ability).toMatchObject({
      type: 'scoreMultiplier',
      name: '夜叉の劫火',
      value: 1.15,
    })
  })

  it('keeps gacha rate table totaling 100%', () => {
    const total = Object.values(gachaConfig.rarityRates).reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(1, 5)
    expect(gachaConfig.singleCost).toBe(100)
    expect(gachaConfig.multiCost).toBe(900)
  })
})
