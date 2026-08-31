import type { CharacterAccessory, CharacterVisualConfig } from '../config/characterTypes'

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100
  const lig = l / 100
  const c = (1 - Math.abs(2 * lig - 1)) * sat
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = lig - c / 2
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) {
    r = c
    g = x
  } else if (h < 120) {
    r = x
    g = c
  } else if (h < 180) {
    g = c
    b = x
  } else if (h < 240) {
    g = x
    b = c
  } else if (h < 300) {
    r = x
    b = c
  } else {
    r = c
    b = x
  }
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

interface NinjaPalette {
  primary: string
  secondary: string
  accent: string
  skin: string
  metal: string
  eye: string
}

function buildPalette(seed: number, rarity?: string): NinjaPalette {
  const hue = (seed * 47 + 13) % 360
  const satBoost = rarity === 'SHINNIN' ? 18 : rarity === 'UR' ? 12 : rarity === 'SSR' ? 8 : 0
  return {
    primary: hslToHex(hue, 38 + satBoost, 22 + (seed % 6)),
    secondary: hslToHex((hue + 28) % 360, 32 + satBoost, 32 + (seed % 5)),
    accent: hslToHex((hue + 175) % 360, 52 + satBoost, 48 + (seed % 8)),
    skin: hslToHex(28 + (seed % 12), 28, 58 + (seed % 10)),
    metal: hslToHex(45 + (seed % 20), 18, 68 + (seed % 8)),
    eye: seed % 5 === 0 ? '#fbbf24' : '#fef08a',
  }
}

function ninjaShadow(): string {
  return `<ellipse cx='50' cy='94' rx='22' ry='4' fill='%23000000' opacity='0.35'/>`
}

function ninjaLegs(primary: string, secondary: string): string {
  return `
    <path d='M40 78 L36 92 L46 92 L48 78 Z' fill='${primary}'/>
    <path d='M60 78 L64 92 L54 92 L52 78 Z' fill='${primary}'/>
    <path d='M38 88 L48 88 L46 92 L36 92 Z' fill='${secondary}'/>
    <path d='M52 88 L62 88 L64 92 L54 92 Z' fill='${secondary}'/>
  `
}

function ninjaTorso(primary: string, secondary: string, accent: string, variant: number): string {
  const sashes = [
    `<path d='M34 58 Q50 66 66 58 L62 74 L38 74 Z' fill='${accent}' opacity='0.85'/>`,
    `<rect x='36' y='62' width='28' height='5' rx='1' fill='${accent}'/>`,
    `<path d='M38 60 L62 60 L58 68 L42 68 Z' fill='${accent}' opacity='0.7'/>`,
  ]
  return `
    <path d='M32 48 Q50 42 68 48 L66 78 Q50 84 34 78 Z' fill='${primary}'/>
    <path d='M36 50 Q50 46 64 50 L62 72 Q50 76 38 72 Z' fill='${secondary}'/>
    ${sashes[variant % sashes.length]}
    <path d='M42 52 L58 52' stroke='${accent}' stroke-width='1.2' opacity='0.5'/>
  `
}

function ninjaArms(primary: string, secondary: string, variant: number): string {
  const poses = [
    `<path d='M28 52 Q18 58 20 68 L28 66 Q26 58 32 54 Z' fill='${primary}'/>
     <path d='M72 52 Q82 58 80 68 L72 66 Q74 58 68 54 Z' fill='${primary}'/>`,
    `<path d='M30 54 L18 62 L22 70 L32 64 Z' fill='${primary}'/>
     <path d='M70 54 L82 62 L78 70 L68 64 Z' fill='${primary}'/>`,
    `<path d='M32 56 L24 72 L30 74 L36 60 Z' fill='${secondary}'/>
     <path d='M68 56 L76 72 L70 74 L64 60 Z' fill='${secondary}'/>`,
  ]
  return poses[variant % poses.length]!
}

function ninjaHead(hood: string, mask: string, skin: string, variant: number): string {
  const hoods = [
    `<path d='M28 18 Q50 4 72 18 L68 34 Q50 28 32 34 Z' fill='${hood}'/>`,
    `<path d='M26 20 Q50 6 74 20 L70 36 L30 36 Z' fill='${hood}'/>`,
    `<path d='M30 16 Q50 2 70 16 L66 32 Q50 24 34 32 Z' fill='${hood}'/>`,
  ]
  const masks = [
    `<rect x='36' y='28' width='28' height='14' rx='3' fill='${mask}'/>
     <path d='M36 30 Q50 36 64 30' stroke='${skin}' stroke-width='1' fill='none' opacity='0.4'/>`,
    `<path d='M34 28 Q50 38 66 28 L64 40 Q50 44 36 40 Z' fill='${mask}'/>`,
    `<path d='M38 26 L62 26 L60 42 L40 42 Z' fill='${mask}' rx='2'/>`,
  ]
  return `${hoods[variant % hoods.length]}${masks[variant % masks.length]}`
}

function ninjaEyes(eyeColor: string, sharp: boolean): string {
  if (sharp) {
    return `
      <path d='M41 32 L46 30 L46 34 Z' fill='${eyeColor}'/>
      <path d='M59 32 L54 30 L54 34 Z' fill='${eyeColor}'/>
      <circle cx='43' cy='31.5' r='0.8' fill='%230f172a'/>
      <circle cx='57' cy='31.5' r='0.8' fill='%230f172a'/>
    `
  }
  return `
    <ellipse cx='43' cy='32' rx='2.2' ry='2.8' fill='${eyeColor}'/>
    <ellipse cx='57' cy='32' rx='2.2' ry='2.8' fill='${eyeColor}'/>
    <circle cx='43.5' cy='32' r='1' fill='%230f172a'/>
    <circle cx='57.5' cy='32' r='1' fill='%230f172a'/>
  `
}

function ninjaHeadband(accent: string, variant: number): string {
  const plates = [
    `<rect x='32' y='22' width='36' height='5' rx='1' fill='${accent}'/>
     <circle cx='50' cy='24.5' r='3' fill='%23fbbf24' stroke='${accent}' stroke-width='0.8'/>`,
    `<rect x='30' y='21' width='40' height='6' rx='1' fill='${accent}' opacity='0.9'/>
     <path d='M47 19 L53 19 L51 26 L49 26 Z' fill='%23fde68a'/>`,
    `<rect x='34' y='23' width='32' height='4' fill='${accent}'/>
     <rect x='46' y='20' width='8' height='8' rx='1' fill='%23ca8a04'/>`,
  ]
  return plates[variant % plates.length]!
}

function ninjaWeapon(accessory: CharacterAccessory | undefined, metal: string, accent: string): string {
  switch (accessory) {
    case 'dualBlades':
      return `
        <path d='M14 44 L18 78 L22 76 L18 42 Z' fill='${metal}' stroke='%23e2e8f0' stroke-width='0.6'/>
        <path d='M86 44 L82 78 L78 76 L82 42 Z' fill='${metal}' stroke='%23e2e8f0' stroke-width='0.6'/>
        <rect x='16' y='40' width='4' height='6' fill='${accent}'/>
        <rect x='80' y='40' width='4' height='6' fill='${accent}'/>
      `
    case 'shortSword':
    case 'silverBlade':
      return `
        <path d='M74 38 L92 58 L88 62 L70 42 Z' fill='${metal}' stroke='%23f8fafc' stroke-width='0.8'/>
        <rect x='72' y='36' width='6' height='8' rx='1' fill='${accent}'/>
      `
    case 'woodenShuriken':
      return `
        <polygon points='12,58 16,50 20,58 16,66' fill='${accent}'/>
        <circle cx='16' cy='58' r='2' fill='%2378716c'/>
      `
    case 'scroll':
    case 'windScroll':
      return `
        <rect x='8' y='48' width='10' height='22' rx='2' fill='%23fef3c7' stroke='%23ca8a04' stroke-width='0.8'/>
        <path d='M10 50 Q13 58 10 66' stroke='%23a16207' stroke-width='0.6' fill='none'/>
      `
    default:
      if (accessory === 'dagger') {
        return `<path d='M78 46 L90 62 L86 66 L74 50 Z' fill='${metal}'/>`
      }
      return `
        <path d='M76 50 L88 64 L84 68 L72 54 Z' fill='${metal}' opacity='0.85'/>
        <rect x='74' y='48' width='5' height='6' fill='${accent}'/>
      `
  }
}

function lightningDecor(accent: string): string {
  return `
    <path d='M46 14 L50 22 L47 22 L52 32 L48 24 L51 24 Z' fill='${accent}' opacity='0.95'/>
    <path d='M10 36 L18 42 L14 44 L22 54 L16 48 L20 48 Z' fill='%23fde047' opacity='0.55'/>
    <path d='M88 38 L80 44 L84 46 L76 56 L82 50 L78 50 Z' fill='%23fde047' opacity='0.55'/>
  `
}

function oniHorns(accent: string): string {
  return `
    <path d='M38 12 L34 4 L42 14 Z' fill='${accent}'/>
    <path d='M62 12 L66 4 L58 14 Z' fill='${accent}'/>
  `
}

function foxEars(accent: string): string {
  return `
    <path d='M34 16 L28 6 L40 18 Z' fill='${accent}'/>
    <path d='M66 16 L72 6 L60 18 Z' fill='${accent}'/>
  `
}

function leafMark(accent: string): string {
  return `<path d='M50 18 Q58 24 50 30 Q42 24 50 18' fill='${accent}' opacity='0.8'/>`
}

function buildKamuiSvg(): string {
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
    ${ninjaShadow()}
    <path d='M8 38 L16 48 L12 50 L20 60 L14 54 L18 54 Z' fill='%23fde047' opacity='0.6'/>
    <path d='M92 40 L84 50 L88 52 L80 62 L86 56 L82 56 Z' fill='%23fde047' opacity='0.6'/>
    ${ninjaLegs('%23111827', '%231e293b')}
    ${ninjaTorso('%230f172a', '%231e293b', '%23eab308', 0)}
    ${ninjaArms('%230f172a', '%23334155', 1)}
    <path d='M28 18 Q50 4 72 18 L68 38 Q50 30 32 38 Z' fill='%23020617'/>
    <path d='M34 28 Q50 40 66 28 L62 42 Q50 46 38 42 Z' fill='%23111827'/>
    ${ninjaEyes('%23fef08a', true)}
    <rect x='32' y='20' width='36' height='5' rx='1' fill='%231e293b'/>
    <path d='M46 14 L50 22 L47 22 L52 32 L48 24 L51 24 Z' fill='%23facc15'/>
    <path d='M47 19 L53 19 L51 26 L49 26 Z' fill='%23fde047' stroke='%23ca8a04' stroke-width='0.5'/>
    ${ninjaWeapon('dualBlades', '%23cbd5e1', '%23eab308')}
    <path d='M36 58 L64 58' stroke='%23fbbf24' stroke-width='1.5' opacity='0.7'/>
  </svg>`
}

type SilhouetteBuilder = (
  palette: NinjaPalette,
  seed: number,
  accessories: readonly CharacterAccessory[],
) => string

const SILHOUETTE_BUILDERS: SilhouetteBuilder[] = [
  (p, seed, acc) => `
    ${ninjaShadow()}
    ${ninjaLegs(p.primary, p.secondary)}
    ${ninjaTorso(p.primary, p.secondary, p.accent, seed)}
    ${ninjaArms(p.primary, p.secondary, seed)}
    ${ninjaHead(p.primary, p.secondary, p.skin, seed)}
    ${ninjaEyes(p.eye, seed % 3 !== 0)}
    ${ninjaHeadband(p.accent, seed)}
    ${ninjaWeapon(acc[0], p.metal, p.accent)}
  `,
  (p, seed, acc) => `
    ${ninjaShadow()}
    ${ninjaLegs(p.secondary, p.primary)}
    ${ninjaTorso(p.primary, p.secondary, p.accent, seed + 1)}
    ${ninjaArms(p.secondary, p.primary, seed + 1)}
    ${ninjaHead(p.secondary, p.primary, p.skin, seed + 1)}
    ${ninjaEyes(p.eye, true)}
    ${ninjaWeapon(acc[0] ?? 'shortSword', p.metal, p.accent)}
    <path d='M30 24 Q50 14 70 24 L66 32 Q50 26 34 32 Z' fill='${p.accent}' opacity='0.35'/>
  `,
  (p, seed, acc) => `
    ${ninjaShadow()}
    ${ninjaLegs(p.primary, p.secondary)}
    ${ninjaTorso(p.primary, p.secondary, p.accent, seed + 2)}
    ${ninjaArms(p.primary, p.secondary, seed + 2)}
    ${ninjaHead(p.primary, p.secondary, p.skin, seed + 2)}
    ${ninjaEyes(p.eye, seed % 2 === 0)}
    ${leafMark(p.accent)}
    ${ninjaWeapon(acc[0], p.metal, p.accent)}
  `,
  (p, seed, acc) => `
    ${ninjaShadow()}
    ${ninjaLegs(p.primary, p.secondary)}
    ${ninjaTorso(p.secondary, p.primary, p.accent, seed + 3)}
    ${ninjaArms(p.primary, p.secondary, seed + 3)}
    ${ninjaHead(p.primary, p.secondary, p.skin, seed + 3)}
    ${ninjaEyes('#f87171', true)}
    ${oniHorns(p.accent)}
    ${ninjaWeapon(acc[0], p.metal, p.accent)}
  `,
  (p, seed, acc) => `
    ${ninjaShadow()}
    ${ninjaLegs(p.primary, p.secondary)}
    ${ninjaTorso(p.primary, p.secondary, p.accent, seed + 4)}
    ${ninjaArms(p.secondary, p.primary, seed + 4)}
    ${ninjaHead(p.secondary, p.primary, p.skin, seed + 4)}
    ${ninjaEyes(p.eye, true)}
    ${foxEars(p.accent)}
    ${ninjaWeapon(acc[0], p.metal, p.accent)}
  `,
  (p, seed, acc) => `
    ${ninjaShadow()}
    ${ninjaLegs(p.primary, p.secondary)}
    ${ninjaTorso(p.primary, p.secondary, p.accent, seed + 5)}
    ${ninjaArms(p.primary, p.secondary, seed + 5)}
    ${ninjaHead(p.primary, p.secondary, p.skin, seed + 5)}
    ${ninjaEyes(p.eye, true)}
    ${lightningDecor(p.accent)}
    ${ninjaHeadband(p.accent, seed)}
    ${ninjaWeapon(acc.includes('dualBlades') ? 'dualBlades' : acc[0], p.metal, p.accent)}
  `,
  (p, seed, acc) => `
    ${ninjaShadow()}
    <path d='M22 48 Q14 62 18 78 L28 74 Q24 60 30 52 Z' fill='${p.secondary}' opacity='0.9'/>
    <path d='M78 48 Q86 62 82 78 L72 74 Q76 60 70 52 Z' fill='${p.secondary}' opacity='0.9'/>
    ${ninjaLegs(p.primary, p.secondary)}
    ${ninjaTorso(p.primary, p.secondary, p.accent, seed + 6)}
    ${ninjaHead(p.primary, p.secondary, p.skin, seed + 6)}
    ${ninjaEyes(p.eye, false)}
    ${ninjaHeadband(p.metal, seed + 1)}
    ${ninjaWeapon(acc[0], p.metal, p.accent)}
  `,
  (p, seed, acc) => `
    ${ninjaShadow()}
    ${ninjaLegs(p.primary, p.secondary)}
    ${ninjaTorso(p.secondary, p.primary, p.accent, seed + 7)}
    ${ninjaArms(p.primary, p.secondary, seed + 7)}
    ${ninjaHead(p.primary, p.secondary, p.skin, seed + 7)}
    ${ninjaEyes(p.eye, true)}
    <rect x='38' y='24' width='24' height='16' rx='2' fill='${p.secondary}' stroke='${p.metal}' stroke-width='0.8'/>
    ${ninjaWeapon(acc[0], p.metal, p.accent)}
  `,
]

function rarityAura(rarity: string | undefined): string {
  if (rarity === 'SHINNIN') {
    return `
      <circle cx='50' cy='50' r='44' fill='none' stroke='%23fde68a' stroke-width='1.5' opacity='0.45'/>
      <path d='M50 6 L54 20 L68 20 L57 28 L62 42 L50 34 L38 42 L43 28 L32 20 L46 20 Z' fill='%23fbbf24' opacity='0.75'/>
    `
  }
  if (rarity === 'UR') {
    return `<circle cx='50' cy='50' r='43' fill='none' stroke='%23fbbf24' stroke-width='1' opacity='0.35'/>`
  }
  if (rarity === 'SSR') {
    return `<circle cx='50' cy='50' r='43' fill='none' stroke='%23c084fc' stroke-width='1' opacity='0.3'/>`
  }
  return ''
}

/** 拡張キャラ用のユニーク SVG スキンを生成 */
export function buildGeneratedSkinSvg(
  seed: number,
  rarity?: string,
  visual?: Pick<CharacterVisualConfig, 'accessories'>,
): string {
  if (seed === 94) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(buildKamuiSvg())}`
  }

  const palette = buildPalette(seed, rarity)
  const variant = seed % SILHOUETTE_BUILDERS.length
  const accessories = visual?.accessories ?? []
  const body = SILHOUETTE_BUILDERS[variant]!(palette, seed, accessories)
  const aura = rarityAura(rarity)
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>${aura}${body}</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function isGeneratedSkinClass(skinClass: string): boolean {
  return skinClass.startsWith('ninja-skin-gen-')
}

export function skinSeedFromClass(skinClass: string): number | null {
  if (!isGeneratedSkinClass(skinClass)) {
    return null
  }
  const parsed = Number.parseInt(skinClass.replace('ninja-skin-gen-', ''), 10)
  return Number.isFinite(parsed) ? parsed : null
}
