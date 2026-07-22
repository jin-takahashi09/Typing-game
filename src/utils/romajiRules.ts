/** 拗音（2文字かな） */
const YOON_KANA = new Set([
  'きゃ', 'きゅ', 'きょ',
  'しゃ', 'しゅ', 'しょ',
  'ちゃ', 'ちゅ', 'ちょ',
  'にゃ', 'にゅ', 'にょ',
  'ひゃ', 'ひゅ', 'ひょ',
  'みゃ', 'みゅ', 'みょ',
  'りゃ', 'りゅ', 'りょ',
  'ぎゃ', 'ぎゅ', 'ぎょ',
  'じゃ', 'じゅ', 'じょ',
  'びゃ', 'びゅ', 'びょ',
  'ぴゃ', 'ぴゅ', 'ぴょ',
  'てぃ', 'でぃ', 'うぃ', 'うぇ', 'うぉ',
])

const VOWEL_KANA = new Set(['あ', 'い', 'う', 'え', 'お'])

export interface MoraNode {
  kana: string
  displayStart: number
  displayEnd: number
  options: string[]
}

/** かな文字列をモーラ列へ分割 */
export function parseReadingToMorae(reading: string): string[] {
  const morae: string[] = []
  let index = 0

  while (index < reading.length) {
    const char = reading[index]!

    if (char === 'っ') {
      morae.push('っ')
      index += 1
      continue
    }

    const yoon = reading.slice(index, index + 2)
    if (YOON_KANA.has(yoon)) {
      morae.push(yoon)
      index += 2
      continue
    }

    morae.push(char)
    index += 1
  }

  return morae
}

const BASIC_ROMAJI: Record<string, string[]> = {
  あ: ['a'], い: ['i'], う: ['u'], え: ['e'], お: ['o'],
  か: ['ka'], き: ['ki'], く: ['ku'], け: ['ke'], こ: ['ko'],
  さ: ['sa'], し: ['shi', 'si'], す: ['su'], せ: ['se'], そ: ['so'],
  た: ['ta'], ち: ['chi', 'ti'], つ: ['tsu', 'tu'], て: ['te'], と: ['to'],
  な: ['na'], に: ['ni'], ぬ: ['nu'], ね: ['ne'], の: ['no'],
  は: ['ha', 'wa'], ひ: ['hi'], ふ: ['fu', 'hu'], へ: ['he'], ほ: ['ho'],
  ま: ['ma'], み: ['mi'], む: ['mu'], め: ['me'], も: ['mo'],
  や: ['ya'], ゆ: ['yu'], よ: ['yo'],
  ら: ['ra'], り: ['ri'], る: ['ru'], れ: ['re'], ろ: ['ro'],
  わ: ['wa'], を: ['wo'], ん: ['n'],
  ぁ: ['a'], ぃ: ['i'], ぅ: ['u'], ぇ: ['e'], ぉ: ['o'],
  が: ['ga'], ぎ: ['gi'], ぐ: ['gu'], げ: ['ge'], ご: ['go'],
  ざ: ['za'], じ: ['ji', 'zi'], ず: ['zu'], ぜ: ['ze'], ぞ: ['zo'],
  だ: ['da'], ぢ: ['ji', 'zi'], づ: ['zu'], で: ['de'], ど: ['do'],
  ば: ['ba'], び: ['bi'], ぶ: ['bu'], べ: ['be'], ぼ: ['bo'],
  ぱ: ['pa'], ぴ: ['pi'], ぷ: ['pu'], ぺ: ['pe'], ぽ: ['po'],
  ー: ['-'],
}

const YOON_ROMAJI: Record<string, string[]> = {
  きゃ: ['kya'], きゅ: ['kyu'], きょ: ['kyo'],
  しゃ: ['sha', 'sya'], しゅ: ['shu', 'syu'], しょ: ['sho', 'syo'],
  ちゃ: ['cha', 'tya', 'cya'], ちゅ: ['chu', 'tyu', 'cyu'], ちょ: ['cho', 'tyo', 'cyo'],
  にゃ: ['nya'], にゅ: ['nyu'], にょ: ['nyo'],
  ひゃ: ['hya'], ひゅ: ['hyu'], ひょ: ['hyo'],
  みゃ: ['mya'], みゅ: ['myu'], みょ: ['myo'],
  りゃ: ['rya'], りゅ: ['ryu'], りょ: ['ryo'],
  ぎゃ: ['gya'], ぎゅ: ['gyu'], ぎょ: ['gyo'],
  じゃ: ['ja', 'jya', 'zya'], じゅ: ['ju', 'jyu', 'zyu'], じょ: ['jo', 'jyo', 'zyo'],
  びゃ: ['bya'], びゅ: ['byu'], びょ: ['byo'],
  ぴゃ: ['pya'], ぴゅ: ['pyu'], ぴょ: ['pyo'],
  てぃ: ['ti'], でぃ: ['di'], うぃ: ['wi'], うぇ: ['we'], うぉ: ['wo'],
}

function uniqueOptions(options: string[]): string[] {
  return [...new Set(options.map((item) => item.toLowerCase()))]
}

function consonantOf(option: string): string | null {
  if (option.length === 0) {
    return null
  }
  const first = option[0]!
  if ('bcdfghjklmnpqrstvwxyz'.includes(first)) {
    return first
  }
  return null
}

function getBaseOptions(kana: string): string[] {
  if (kana === 'っ') {
    return []
  }
  if (YOON_ROMAJI[kana]) {
    return uniqueOptions(YOON_ROMAJI[kana])
  }
  if (BASIC_ROMAJI[kana]) {
    return uniqueOptions(BASIC_ROMAJI[kana])
  }
  return [kana.toLowerCase()]
}

function getSmallTsuOptions(nextOptions: string[]): string[] {
  const consonants = new Set<string>()
  for (const option of nextOptions) {
    const consonant = consonantOf(option)
    if (consonant) {
      consonants.add(consonant)
    }
  }
  return [...consonants]
}

function getNOptions(nextKana?: string): string[] {
  if (!nextKana || VOWEL_KANA.has(nextKana)) {
    return ['n', 'nn']
  }
  if (nextKana === 'や' || nextKana === 'ゆ' || nextKana === 'よ') {
    return ['n']
  }
  return ['n']
}

/** モーラ列からローマ字候補を付与したノード列を構築 */
export function buildMoraNodes(
  morae: string[],
  displayRomaji: string,
): MoraNode[] {
  const nodes: MoraNode[] = morae.map((kana) => ({
    kana,
    displayStart: 0,
    displayEnd: 0,
    options: [],
  }))

  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index]!
    const nextKana = morae[index + 1]

    if (node.kana === 'っ') {
      const nextOptions =
        index + 1 < nodes.length
          ? getBaseOptions(morae[index + 1]!)
          : []
      node.options = getSmallTsuOptions(nextOptions)
    } else if (node.kana === 'ん') {
      node.options = getNOptions(nextKana)
    } else {
      node.options = getBaseOptions(node.kana)
    }
  }

  alignDisplaySlices(nodes, displayRomaji)
  return nodes
}

function alignDisplaySlices(nodes: MoraNode[], displayRomaji: string): void {
  let position = 0

  for (const node of nodes) {
    let matched = false
    for (const option of node.options) {
      if (displayRomaji.slice(position).startsWith(option)) {
        node.displayStart = position
        node.displayEnd = position + option.length
        position += option.length
        matched = true
        break
      }
    }

    if (!matched && node.options.length > 0) {
      const fallback = node.options[0]!
      node.displayStart = position
      node.displayEnd = position + fallback.length
      position += fallback.length
    }
  }
}

/** romajiPatterns から各モーラの候補を補強 */
export function mergePatternOptions(
  nodes: MoraNode[],
  patterns: readonly string[],
): MoraNode[] {
  for (const pattern of patterns) {
    let position = 0
    for (const node of nodes) {
      const remainder = pattern.slice(position)
      const matched = node.options.find((option) => remainder.startsWith(option))
      if (!matched) {
        break
      }
      position += matched.length
      node.options = uniqueOptions([...node.options, matched])
    }
  }
  return nodes
}

export function getFirstInputChars(options: string[]): string[] {
  const chars = new Set<string>()
  for (const option of options) {
    if (option.length > 0) {
      chars.add(option[0]!)
    }
  }
  return [...chars]
}

export function isValidPrefix(options: string[], partial: string): boolean {
  return options.some(
    (option) => option.startsWith(partial) && partial.length <= option.length,
  )
}

export function isCompleteMora(options: string[], partial: string): boolean {
  return options.includes(partial)
}

export function computeDisplayProgress(
  nodes: MoraNode[],
  moraIndex: number,
  partial: string,
): number {
  let length = 0

  for (let index = 0; index < moraIndex; index += 1) {
    length = nodes[index]!.displayEnd
  }

  if (moraIndex >= nodes.length || partial.length === 0) {
    return length
  }

  const node = nodes[moraIndex]!
  const segmentLength = node.displayEnd - node.displayStart

  if (segmentLength <= 0) {
    return length + partial.length
  }

  return node.displayStart + Math.min(partial.length, segmentLength)
}
