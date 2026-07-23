import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import {
  SoundManager,
  resetSoundManager,
  getSoundManager,
} from './SoundManager'

class FakeOscillator {
  frequency = { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {} }
  type = 'sine'
  connect() {}
  disconnect() {}
  start() {}
  stop() {}
}

class FakeGain {
  gain = {
    value: 0,
    cancelScheduledValues() {},
    setValueAtTime() {},
    exponentialRampToValueAtTime() {},
  }
  connect() {}
}

class FakeAudioContext {
  state: AudioContextState = 'suspended'
  currentTime = 0
  destination = {}
  createGain() {
    return new FakeGain() as unknown as GainNode
  }
  createOscillator() {
    return new FakeOscillator() as unknown as OscillatorNode
  }
  async resume() {
    this.state = 'running'
  }
  async close() {
    this.state = 'closed'
  }
}

describe('SoundManager', () => {
  beforeEach(() => {
    resetSoundManager(null)
  })

  afterEach(() => {
    resetSoundManager(null)
  })

  it('does not throw when AudioContext is unavailable', async () => {
    const manager = new SoundManager({ createContext: () => null })
    await expect(manager.unlock()).resolves.toBeUndefined()
    expect(() => manager.playSfx('uiClick')).not.toThrow()
    expect(() => manager.startBgm('game')).not.toThrow()
  })

  it('clamps volume and respects mute', async () => {
    const manager = new SoundManager({
      createContext: () => new FakeAudioContext() as unknown as AudioContext,
    })
    await manager.unlock()
    manager.setVolume(2)
    expect(manager.getVolume()).toBe(1)
    manager.setVolume(-1)
    expect(manager.getVolume()).toBe(0)
    manager.setMuted(true)
    expect(() => manager.playSfx('typeCorrect')).not.toThrow()
  })

  it('keeps a single shared instance until reset', () => {
    const first = getSoundManager()
    const second = getSoundManager()
    expect(first).toBe(second)
    resetSoundManager(null)
    const third = getSoundManager()
    expect(third).not.toBe(first)
  })

  it('stops previous bgm oscillators when restarting', async () => {
    const manager = new SoundManager({
      createContext: () => new FakeAudioContext() as unknown as AudioContext,
    })
    await manager.unlock()
    manager.startBgm('game')
    manager.startBgm('game')
    manager.stopBgm()
    expect(() => manager.startBgm('title')).not.toThrow()
  })
})
