export type SfxId =
  | 'typeCorrect'
  | 'typeMiss'
  | 'destroy'
  | 'damage'
  | 'gameStart'
  | 'gameOver'
  | 'uiClick'
  | 'pause'
  | 'resume'
  | 'stageUp'

export type BgmTrack = 'game' | 'title'

interface ToneSpec {
  frequency: number
  durationMs: number
  type: OscillatorType
  gain: number
  slideTo?: number
}

const SFX_TONES: Record<SfxId, ToneSpec | ToneSpec[]> = {
  typeCorrect: { frequency: 880, durationMs: 40, type: 'square', gain: 0.08 },
  typeMiss: { frequency: 120, durationMs: 80, type: 'sawtooth', gain: 0.1 },
  destroy: {
    frequency: 440,
    durationMs: 160,
    type: 'triangle',
    gain: 0.12,
    slideTo: 880,
  },
  damage: {
    frequency: 220,
    durationMs: 200,
    type: 'sawtooth',
    gain: 0.14,
    slideTo: 80,
  },
  gameStart: [
    { frequency: 523, durationMs: 80, type: 'square', gain: 0.08 },
    { frequency: 659, durationMs: 80, type: 'square', gain: 0.08 },
    { frequency: 784, durationMs: 120, type: 'square', gain: 0.09 },
  ],
  gameOver: {
    frequency: 196,
    durationMs: 400,
    type: 'triangle',
    gain: 0.12,
    slideTo: 98,
  },
  uiClick: { frequency: 660, durationMs: 30, type: 'square', gain: 0.06 },
  pause: { frequency: 400, durationMs: 60, type: 'triangle', gain: 0.07 },
  resume: { frequency: 520, durationMs: 60, type: 'triangle', gain: 0.07 },
  stageUp: [
    { frequency: 523, durationMs: 70, type: 'square', gain: 0.08 },
    { frequency: 784, durationMs: 100, type: 'square', gain: 0.09 },
  ],
}

export interface SoundManagerOptions {
  createContext?: () => AudioContext | null
}

export class SoundManager {
  private context: AudioContext | null = null
  private masterGain: GainNode | null = null
  private bgmGain: GainNode | null = null
  private bgmOscillators: OscillatorNode[] = []
  private unlocked = false
  private volume = 0.7
  private muted = false
  private bgmTrack: BgmTrack | null = null
  private bgmPaused = false
  private disposed = false
  private createContext: () => AudioContext | null

  constructor(options: SoundManagerOptions = {}) {
    this.createContext =
      options.createContext ??
      (() => {
        try {
          const Ctx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext?: typeof AudioContext })
              .webkitAudioContext
          if (!Ctx) {
            return null
          }
          return new Ctx()
        } catch {
          return null
        }
      })
  }

  isUnlocked(): boolean {
    return this.unlocked
  }

  getVolume(): number {
    return this.volume
  }

  isMuted(): boolean {
    return this.muted
  }

  async unlock(): Promise<void> {
    if (this.disposed || this.unlocked) {
      return
    }

    try {
      if (!this.context) {
        this.context = this.createContext()
        if (!this.context) {
          return
        }
        this.masterGain = this.context.createGain()
        this.bgmGain = this.context.createGain()
        this.bgmGain.connect(this.masterGain)
        this.masterGain.connect(this.context.destination)
        this.applyGains()
      }

      if (this.context.state === 'suspended') {
        await this.context.resume()
      }
      this.unlocked = this.context.state === 'running' || this.context.state === 'suspended'
    } catch {
      this.unlocked = false
    }
  }

  setVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume))
    this.applyGains()
  }

  setMuted(muted: boolean): void {
    this.muted = muted
    this.applyGains()
  }

  playSfx(id: SfxId): void {
    if (this.disposed || !this.unlocked || this.muted || !this.context || !this.masterGain) {
      return
    }

    try {
      const tones = SFX_TONES[id]
      const list = Array.isArray(tones) ? tones : [tones]
      let offset = 0
      for (const tone of list) {
        this.scheduleTone(tone, offset)
        offset += tone.durationMs / 1000
      }
    } catch {
      // never crash the game for audio failures
    }
  }

  startBgm(track: BgmTrack = 'game'): void {
    if (this.disposed) {
      return
    }

    this.stopBgmInternal()
    this.bgmTrack = track
    this.bgmPaused = false

    if (!this.unlocked || this.muted || !this.context || !this.bgmGain) {
      return
    }

    try {
      this.startBgmOscillators(track)
    } catch {
      this.bgmOscillators = []
    }
  }

  pauseBgm(): void {
    this.bgmPaused = true
    this.stopBgmInternal()
  }

  resumeBgm(): void {
    if (!this.bgmTrack || !this.bgmPaused) {
      return
    }
    this.bgmPaused = false
    if (!this.unlocked || this.muted || !this.context || !this.bgmGain) {
      return
    }
    try {
      this.startBgmOscillators(this.bgmTrack)
    } catch {
      this.bgmOscillators = []
    }
  }

  stopBgm(): void {
    this.bgmTrack = null
    this.bgmPaused = false
    this.stopBgmInternal()
  }

  dispose(): void {
    this.disposed = true
    this.stopBgmInternal()
    try {
      void this.context?.close()
    } catch {
      // ignore
    }
    this.context = null
    this.masterGain = null
    this.bgmGain = null
    this.unlocked = false
  }

  private applyGains(): void {
    if (!this.masterGain || !this.bgmGain || !this.context) {
      return
    }

    const master = this.muted ? 0 : this.volume
    const now = this.context.currentTime
    this.masterGain.gain.cancelScheduledValues(now)
    this.masterGain.gain.setValueAtTime(master, now)
    this.bgmGain.gain.cancelScheduledValues(now)
    this.bgmGain.gain.setValueAtTime(0.25, now)
  }

  private scheduleTone(tone: ToneSpec, startOffsetSec: number): void {
    if (!this.context || !this.masterGain) {
      return
    }

    const osc = this.context.createOscillator()
    const gain = this.context.createGain()
    osc.type = tone.type
    osc.frequency.setValueAtTime(tone.frequency, this.context.currentTime + startOffsetSec)
    if (tone.slideTo !== undefined) {
      osc.frequency.linearRampToValueAtTime(
        tone.slideTo,
        this.context.currentTime + startOffsetSec + tone.durationMs / 1000,
      )
    }

    const start = this.context.currentTime + startOffsetSec
    const end = start + tone.durationMs / 1000
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(tone.gain, start + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, end)

    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start(start)
    osc.stop(end + 0.02)
  }

  private startBgmOscillators(track: BgmTrack): void {
    if (!this.context || !this.bgmGain) {
      return
    }

    const base = track === 'title' ? 110 : 146.83
    const third = track === 'title' ? 164.81 : 220

    for (const frequency of [base, third]) {
      const osc = this.context.createOscillator()
      const gain = this.context.createGain()
      osc.type = 'sine'
      osc.frequency.value = frequency
      gain.gain.value = frequency === base ? 0.04 : 0.02
      osc.connect(gain)
      gain.connect(this.bgmGain)
      osc.start()
      this.bgmOscillators.push(osc)
    }
  }

  private stopBgmInternal(): void {
    for (const osc of this.bgmOscillators) {
      try {
        osc.stop()
        osc.disconnect()
      } catch {
        // ignore
      }
    }
    this.bgmOscillators = []
  }
}

let sharedManager: SoundManager | null = null

export function getSoundManager(): SoundManager {
  if (!sharedManager) {
    sharedManager = new SoundManager()
  }
  return sharedManager
}

/** Test helper: replace or clear the singleton */
export function resetSoundManager(next: SoundManager | null = null): void {
  if (sharedManager) {
    sharedManager.dispose()
  }
  sharedManager = next
}
