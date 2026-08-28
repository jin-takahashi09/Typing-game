interface TrainingGroundBackgroundProps {
  paused: boolean
  reducedMotion: boolean
}

/** 固定背景：夜の忍者修行場 */
export function TrainingGroundBackground({
  paused,
  reducedMotion,
}: TrainingGroundBackgroundProps) {
  const playState = paused || reducedMotion ? 'paused' : 'running'

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[var(--radius-xl)]"
      data-testid="training-ground-background"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1220] via-[#152438] to-[#1c2838]" />
      <div
        className="training-moon absolute right-[14%] top-[10%] h-14 w-14 rounded-full bg-[#f5e6a6]/85"
        style={{ animationPlayState: playState }}
      />
      <div
        className="training-cloud absolute left-0 top-[18%] h-16 w-[200%] opacity-40"
        style={{
          animationPlayState: playState,
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='80' viewBox='0 0 400 80'><ellipse cx='80' cy='40' rx='60' ry='18' fill='%23cbd5e1'/><ellipse cx='220' cy='35' rx='70' ry='20' fill='%2394a3b8'/></svg>\")",
          backgroundRepeat: 'repeat-x',
          backgroundSize: '400px 80px',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-[18%] h-[40%] opacity-80"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='700' height='220' viewBox='0 0 700 220'><path d='M0 180 L90 90 L180 150 L280 50 L400 140 L520 60 L640 130 L700 170 L700 220 L0 220 Z' fill='%2315263d'/><rect x='480' y='90' width='90' height='100' fill='%231a120c'/><path d='M470 90 L525 40 L580 90 Z' fill='%23221610'/></svg>\")",
          backgroundRepeat: 'repeat-x',
          backgroundSize: '700px 220px',
          backgroundPosition: 'bottom',
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-[16%] bg-gradient-to-t from-[#1a1510] via-[#243018] to-transparent" />
      <div
        className="training-bamboo absolute bottom-[14%] left-[4%] h-[28%] w-8 opacity-70"
        style={{ animationPlayState: playState }}
      />
      <div
        className="training-bamboo absolute bottom-[14%] right-[6%] h-[32%] w-8 opacity-70"
        style={{ animationPlayState: playState }}
      />
    </div>
  )
}
