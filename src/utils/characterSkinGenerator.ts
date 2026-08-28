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

const SILHOUETTE_VARIANTS = [
  (primary: string, secondary: string, accent: string) =>
    `<rect x='38' y='48' width='24' height='36' rx='4' fill='${primary}'/><circle cx='50' cy='28' r='15' fill='${secondary}'/><rect x='32' y='18' width='36' height='8' rx='2' fill='${accent}'/>`,
  (primary: string, secondary: string, accent: string) =>
    `<path d='M28 90 L50 20 L72 90 Z' fill='${primary}'/><circle cx='50' cy='28' r='14' fill='${secondary}'/><path d='M30 55 Q50 70 70 55' stroke='${accent}' stroke-width='3' fill='none'/>`,
  (primary: string, secondary: string, accent: string) =>
    `<ellipse cx='50' cy='90' rx='16' ry='4' fill='${primary}'/><rect x='36' y='50' width='28' height='34' rx='6' fill='${secondary}'/><path d='M35 20 Q50 8 65 20' fill='${accent}'/>`,
  (primary: string, secondary: string, accent: string) =>
    `<path d='M20 40 Q50 20 80 40 L75 95 L25 95 Z' fill='${primary}' opacity='0.9'/><rect x='40' y='50' width='20' height='32' fill='${secondary}'/><rect x='34' y='28' width='32' height='12' rx='2' fill='${accent}'/>`,
  (primary: string, secondary: string, accent: string) =>
    `<path d='M55 8 L62 28 L80 28 L48 92 L55 52 L38 52 Z' fill='${accent}' opacity='0.85'/><rect x='36' y='48' width='28' height='36' fill='${primary}'/><circle cx='50' cy='28' r='15' fill='${secondary}'/>`,
  (primary: string, secondary: string, accent: string) =>
    `<path d='M15 95 L30 40 L50 10 L70 40 L85 95 Z' fill='${primary}'/><path d='M22 12 L35 0 L50 14 L65 0 L78 12 L72 42 L28 42 Z' fill='${accent}'/><circle cx='50' cy='30' r='14' fill='${secondary}'/>`,
  (primary: string, secondary: string, accent: string) =>
    `<ellipse cx='22' cy='70' rx='10' ry='28' fill='${accent}' transform='rotate(-20 22 70)'/><ellipse cx='78' cy='70' rx='10' ry='28' fill='${accent}' transform='rotate(20 78 70)'/><rect x='38' y='48' width='24' height='34' rx='8' fill='${primary}'/><circle cx='50' cy='28' r='16' fill='${secondary}'/>`,
  (primary: string, secondary: string, accent: string) =>
    `<path d='M50 10 Q70 40 60 90 Q50 70 40 90 Q30 40 50 10' fill='${primary}'/><circle cx='50' cy='28' r='15' fill='${secondary}'/><path d='M32 52 Q50 62 68 52' stroke='${accent}' stroke-width='3' fill='none'/>`,
]

/** 拡張キャラ用のユニーク SVG スキンを生成 */
export function buildGeneratedSkinSvg(seed: number, rarity?: string): string {
  const hue = (seed * 47 + 13) % 360
  const variant = seed % SILHOUETTE_VARIANTS.length
  const satBoost = rarity === 'SHINNIN' ? 18 : rarity === 'UR' ? 12 : 0
  const primary = hslToHex(hue, 42 + satBoost, 28 + (seed % 8))
  const secondary = hslToHex((hue + 40) % 360, 35 + satBoost, 38 + (seed % 6))
  const accent = hslToHex((hue + 180) % 360, 55 + satBoost, 55 + (seed % 10))
  const body = SILHOUETTE_VARIANTS[variant]!(primary, secondary, accent)
  const eyes = `<circle cx='44' cy='28' r='2.5' fill='%23fff'/><circle cx='56' cy='28' r='2.5' fill='%23fff'/>`
  const shinninAura =
    rarity === 'SHINNIN'
      ? `<circle cx='50' cy='50' r='42' fill='none' stroke='%23fde68a' stroke-width='2' opacity='0.5'/><path d='M50 8 L54 20 L66 20 L56 28 L60 40 L50 34 L40 40 L44 28 L34 20 L46 20 Z' fill='%23fbbf24' opacity='0.7'/>`
      : ''
  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>${shinninAura}${body}${eyes}</svg>`
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
