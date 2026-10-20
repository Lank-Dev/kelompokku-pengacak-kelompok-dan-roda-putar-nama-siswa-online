// Procedural Audio Engine using Web Audio API
// 100% self-contained, no external mp3/wav files required, zero latency!

class AudioEngine {
  private ctx: AudioContext | null = null
  private isMuted: boolean = false
  private lastTickTime: number = 0

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AudioCtx()
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted
  }

  public playTick(velocityMultiplier: number = 1.0) {
    if (this.isMuted) return

    // Safe rate limiting for large collections (up to hundreds of names)
    // Prevents audio buffer overflow and clipping
    const nowMs = performance.now()
    if (nowMs - this.lastTickTime < 24) return
    this.lastTickTime = nowMs

    try {
      this.initCtx()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      // Crisp mechanical ticker click
      const baseFreq = 800 + Math.min(velocityMultiplier * 150, 400)
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(baseFreq, now)
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.035)

      // Snap envelope
      gain.gain.setValueAtTime(0.22, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.04)
    } catch {
      // AudioContext might be blocked before first user gesture
    }
  }

  public playSpinStart() {
    if (this.isMuted) return
    try {
      this.initCtx()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(180, now)
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.35)

      gain.gain.setValueAtTime(0.01, now)
      gain.gain.linearRampToValueAtTime(0.2, now + 0.15)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.45)
    } catch {
      // ignore
    }
  }

  public playWinnerFanfare() {
    if (this.isMuted) return
    try {
      this.initCtx()
      if (!this.ctx) return

      const now = this.ctx.currentTime

      const notes = [
        { freq: 523.25, time: 0.0, dur: 0.15 }, // C5
        { freq: 659.25, time: 0.12, dur: 0.15 }, // E5
        { freq: 783.99, time: 0.24, dur: 0.2 }, // G5
        { freq: 1046.50, time: 0.38, dur: 0.8 }, // High C6
        { freq: 1318.51, time: 0.42, dur: 0.75 }, // High E6 harmony
      ]

      notes.forEach(({ freq, time, dur }) => {
        if (!this.ctx) return
        const noteStart = now + time
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()

        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, noteStart)

        gain.gain.setValueAtTime(0.001, noteStart)
        gain.gain.linearRampToValueAtTime(0.22, noteStart + 0.04)
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + dur)

        osc.connect(gain)
        gain.connect(this.ctx.destination)

        osc.start(noteStart)
        osc.stop(noteStart + dur + 0.05)
      })
    } catch {
      // ignore
    }
  }
}

export const soundManager = new AudioEngine()
