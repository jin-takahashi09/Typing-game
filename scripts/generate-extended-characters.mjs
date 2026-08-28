#!/usr/bin/env node
/**
 * Generates src/config/extendedCharacters.generated.ts
 * Run: node scripts/generate-extended-characters.mjs
 */

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outPath = join(__dirname, '../src/config/extendedCharacters.generated.ts')

const EXISTING_NAMES = new Set([
  '見習い忍者', '影丸', '翠霞', '白銀', '白夜', '月光',
  '紅蓮の忍者', '蒼影の忍者', '風神', '暁影', '黄金の忍頭',
  '雷影', '黒炎', '夜叉', '鬼面', '天狐',
])

const NAMES = {
  N: [
    '土竜', '笹吹', '木霊', '苔丸', '砂塵', '蓬屋', '雀隠', '蛙飛', '蟻走', '狸寝',
    '狐火', '灰渡', '雀舌', '竹蔵', '石鍋', '流灯', '雨宿', '霧隠', '葦刃', '麦藁',
  ],
  R: [
    '蒼牙', '紫電', '緋鳥', '翠嵐', '銀狐', '朱鷺', '琥珀', '瑠璃', '真白', '烏鴉',
    '白鷺', '鯉跳', '鷹爪', '猿飛', '犬走', '鹿威', '熊胆', '鶴翼', '猫柳', '鰹刃',
  ],
  SR: [
    '赤星', '青嵐', '黄龍', '紫霞', '玄霧', '朱雀', '白虎', '青龍', '玄武', '麒麟',
    '修羅', '天誅', '無月', '千鳥', '百鬼', '六道', '疾風丸', '火車', '天斬', '地裂',
  ],
  SSR: [
    '黒天', '白煌', '紅蓮王', '蒼帝', '翠玉', '金剛', '銀翼', '紫苑', '深紅', '氷華',
    '炎獄', '雷帝', '嵐神', '月光斬', '暁天', '宵闇', '無双刃', '虹色', '龍炎', '鳳凰',
  ],
  UR: [
    '終焉', '創世', '万象', '不動', '刹那', '永劫', '無限', '覇道', '天変', '地異',
    '隠密', '無形', '幻影', '虚空', '神威', '烈風', '極意', '超越', '絶対', '天下',
  ],
  SHINNIN: [
    '天津甦', '黄泉返', '八百万', '御柱茜', '界裂',
  ],
}

const POSES = [
  'basic', 'crouched', 'shadow', 'defensive', 'silver', 'moon', 'wind', 'dawn',
  'aggressive', 'leaping', 'twin', 'mystic', 'storm', 'leader', 'oni', 'fox',
]

const ACCESSORY_POOLS = [
  ['headband', 'woodenShuriken', 'sandals'],
  ['mask', 'sandals', 'shortSword'],
  ['scarf', 'dagger', 'headband'],
  ['shield', 'armor', 'mask'],
  ['scroll', 'coinBag', 'crest'],
  ['dualBlades', 'redEyes', 'scarf'],
  ['helmet', 'shoulderPad', 'scroll'],
  ['lightningMark', 'armor', 'dualBlades'],
  ['whiteCloak', 'mask', 'armor'],
  ['blackFlame', 'dualBlades', 'mask'],
  ['oniMask', 'shoulderPad', 'crest'],
  ['foxTail', 'mask', 'scroll'],
  ['moonCrest', 'scarf', 'scroll'],
  ['windScroll', 'sandals', 'scarf'],
  ['leafMark', 'headband', 'sandals'],
  ['silverBlade', 'shoulderPad', 'headband'],
  ['dawnSash', 'dagger', 'headband'],
]

const EFFECTS = ['none', 'mist', 'shadow', 'ember', 'wind', 'moon', 'water', 'fire', 'lightning', 'gold', 'fox']

const THEMES = [
  '里で鍛えた素朴な装い', '野山を駆ける軽装', '夜陰に溶ける装束', '森の守り人の装い',
  '砂煙を纏う旅装', '雨に濡れた蓑姿', '霧に隠れた忍装束', '竹の里の修行着',
  '岩窟で磨いた武具', '川辺で鍛えた身軽さ', '鳥の羽を模した軽装', '獣の気配を借りた装い',
  '伝承の巻物を携えた姿', '古刹で授かった装束', '戦場を駆けた痕跡のある鎧',
  '雷を纏う特異な装備', '炎の紋章を背負う姿', '氷の気配を帯びた外套',
  '黄金の装飾が施された鎧', '天を仰ぐような威厳ある装い', '神域に触れたと言われる装束',
]

function abilityFor(rarity, index) {
  const i = index % 7
  switch (rarity) {
    case 'N':
      if (i === 0) return { type: 'none', name: '素朴な修行', description: '特別な補正なし。堅実な足取りで修行する。' }
      if (i === 1) return { type: 'scoreMultiplier', name: '一閃', description: '獲得スコアが2%増加する。', value: 1.02 }
      if (i === 2) return { type: 'scoreMultiplier', name: '軽足', description: '獲得スコアが3%増加する。', value: 1.03 }
      return { type: 'none', name: '地味な技', description: '特別な補正なし。地味だが確実な一撃を放つ。' }
    case 'R':
      if (i === 0) return { type: 'scoreMultiplier', name: '鋭刃', description: '獲得スコアが5%増加する。', value: 1.05 }
      if (i === 1) return { type: 'comboMultiplierBonus', name: '連刃', description: 'コンボスコア倍率が0.04上昇する。', value: 0.04 }
      if (i === 2) return { type: 'timeBonusSeconds', name: '時の余白', description: '制限時間が3秒延長される。', value: 3 }
      if (i === 3) return { type: 'perfectScoreBonus', name: '完璧の型', description: 'ノーミス成功時に追加スコア+8を得る。', value: 8 }
      return { type: 'scoreMultiplier', name: '迅影', description: '獲得スコアが6%増加する。', value: 1.06 }
    case 'SR':
      if (i === 0) return { type: 'scoreMultiplier', name: '烈撃', description: '獲得スコアが9%増加する。', value: 1.09 }
      if (i === 1) return { type: 'comboMultiplierBonus', name: '連鎖', description: 'コンボスコア倍率が0.07上昇する。', value: 0.07 }
      if (i === 2) return { type: 'timeBonusSeconds', name: '延刻', description: '制限時間が4秒延長される。', value: 4 }
      if (i === 3) return { type: 'streakRewardMultiplier', name: '連続の恵み', description: '連続成功報酬のコインが10%増加する。', value: 1.1 }
      if (i === 4) return { type: 'perfectScoreBonus', name: '無欠の一撃', description: 'ノーミス成功時に追加スコア+15を得る。', value: 15 }
      return { type: 'stageCoinMultiplier', name: '戦利の目', description: '撃破ボーナスで獲得するコインが12%増加する。', value: 1.12 }
    case 'SSR':
      if (i === 0) return { type: 'scoreMultiplier', name: '覇撃', description: '獲得スコアが14%増加する。', value: 1.14 }
      if (i === 1) return { type: 'stageCoinMultiplier', name: '富の巡り', description: '撃破ボーナスで獲得するコインが22%増加する。', value: 1.22 }
      if (i === 2) return { type: 'comboMultiplierBonus', name: '天衣無縫', description: 'コンボスコア倍率が0.10上昇する。', value: 0.1 }
      if (i === 3) return { type: 'timeBonusSeconds', name: '永刻', description: '制限時間が6秒延長される。', value: 6 }
      if (i === 4) return { type: 'streakRewardMultiplier', name: '連峰の報酬', description: '連続成功報酬のコインが18%増加する。', value: 1.18 }
      if (i === 5) return { type: 'perfectScoreBonus', name: '極意の一閃', description: 'ノーミス成功時に追加スコア+25を得る。', value: 25 }
      return { type: 'timeRewardDoubleChance', name: '時の幸運', description: '連続成功の時間報酬が20%の確率で2倍になる。', value: 0.2 }
    case 'UR':
      if (i === 0) return { type: 'scoreMultiplier', name: '覇道の刃', description: '獲得スコアが18%増加する。', value: 1.18 }
      if (i === 1) return { type: 'stageCoinMultiplier', name: '財宝招来', description: '撃破ボーナスで獲得するコインが35%増加する。', value: 1.35 }
      if (i === 2) return { type: 'comboMultiplierBonus', name: '無限連鎖', description: 'コンボスコア倍率が0.12上昇する。', value: 0.12 }
      if (i === 3) return { type: 'streakMilestoneReduction', name: '早天の報い', description: '最初の連続成功報酬が3問で発動する。', value: 1 }
      if (i === 4) return { type: 'streakShield', name: '不動の心', description: '1回だけミスしても連続成功ゲージがリセットされない。', value: 1 }
      if (i === 5) return { type: 'timeRewardDoubleChance', name: '時の覇者', description: '連続成功の時間報酬が30%の確率で2倍になる。', value: 0.3 }
      return { type: 'gachaDuplicateCoinMultiplier', name: '重宝の目利き', description: 'ガチャ被り時の獲得コインが15%増加する。', value: 1.15 }
    case 'SHINNIN':
      if (i === 0) return { type: 'streakMilestoneReduction', name: '神域の刻', description: '最初の連続成功報酬が3問で発動する。', value: 1 }
      if (i === 1) return { type: 'streakShield', name: '不壊の意志', description: '2回までミスしても連続成功ゲージがリセットされない。', value: 2 }
      if (i === 2) return { type: 'timeRewardDoubleChance', name: '永劫の時', description: '連続成功の時間報酬が40%の確率で2倍になる。', value: 0.4 }
      if (i === 3) return { type: 'scoreMultiplier', name: '神威の一撃', description: '獲得スコアが25%増加する。', value: 1.25 }
      return { type: 'perfectScoreBonus', name: '無漏の極意', description: 'ノーミス成功時に追加スコア+40を得る。', value: 40 }
    default:
      return { type: 'none', name: '基礎', description: '特別な補正なし。' }
  }
}

const allNames = new Set(EXISTING_NAMES)
const characters = []
let globalIndex = 0

for (const [rarity, names] of Object.entries(NAMES)) {
  names.forEach((name, idx) => {
    if (allNames.has(name)) throw new Error(`Duplicate name: ${name}`)
    allNames.add(name)
    const slug = name.replace(/[^\w\u3040-\u30ff\u4e00-\u9faf]/g, '').slice(0, 8) || `c${globalIndex}`
    const id = `shinobi-ext-${String(globalIndex).padStart(3, '0')}`
    const pose = POSES[(globalIndex + idx) % POSES.length]
    const accessories = ACCESSORY_POOLS[(globalIndex * 3 + idx) % ACCESSORY_POOLS.length]
    const effect = EFFECTS[(globalIndex + idx * 2) % EFFECTS.length]
    const theme = THEMES[(globalIndex + idx) % THEMES.length]
    const ability = abilityFor(rarity, idx)
    characters.push({
      id,
      name,
      description: `${name}——${theme}。`,
      rarity,
      skinClass: `ninja-skin-gen-${globalIndex}`,
      ability,
      visual: { pose, accessories, effect, skinSeed: globalIndex },
    })
    globalIndex += 1
  })
}

if (characters.length !== 105) {
  throw new Error(`Expected 105 characters, got ${characters.length}`)
}

const file = `/* AUTO-GENERATED by scripts/generate-extended-characters.mjs — do not edit manually */
import type { CharacterDefinition } from './characterTypes'

export const extendedCharacters: readonly CharacterDefinition[] = ${JSON.stringify(characters, null, 2)} as const
`

writeFileSync(outPath, file, 'utf8')
console.log(`Wrote ${characters.length} characters to ${outPath}`)
