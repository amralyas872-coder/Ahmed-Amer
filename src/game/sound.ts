import type { AudioSettings } from './types';

export type MusicMood = 'none' | 'title' | 'malfunction' | 'moon' | 'explore' | 'dialogue' | 'mars' | 'ending';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private settings: AudioSettings = {
    muted: false,
    sfxVolume: 0.65,
    musicVolume: 0.45,
  };
  private currentMood: MusicMood = 'none';
  private musicInterval: number | null = null;
  private stepIdx = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock() {
    this.ensureContext();
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  public updateSettings(next: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...next };
    if (this.settings.muted) {
      this.stopMusicLoop();
    } else if (this.currentMood !== 'none') {
      this.startMusicLoop();
    }
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'square',
    gainPeak = 0.12,
    freqEnd?: number,
    delay = 0,
    isMusic = false
  ) {
    if (this.settings.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const vol = isMusic ? this.settings.musicVolume : this.settings.sfxVolume;
    if (vol <= 0.001) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(30, freq), now);
    if (freqEnd && freqEnd > 20) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, now + duration);
    }

    const scaled = gainPeak * vol;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(scaled, now + Math.min(0.02, duration * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private playNoise(duration: number, gainPeak = 0.08, delay = 0) {
    if (this.settings.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || this.settings.sfxVolume <= 0.001) return;

    const sampleRate = ctx.sampleRate;
    const length = Math.max(1, Math.floor(sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 950;

    const gain = ctx.createGain();
    const now = ctx.currentTime + delay;
    const peak = gainPeak * this.settings.sfxVolume;
    gain.gain.setValueAtTime(peak, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
  }

  private jitter(base: number): number {
    return base * (0.92 + Math.random() * 0.16);
  }

  // Core Gameplay SFX
  public playStep() {
    this.playNoise(0.045, 0.045);
    this.playTone(this.jitter(115), 0.04, 'triangle', 0.04, 75);
  }

  public playJump() {
    this.playTone(this.jitter(220), 0.16, 'square', 0.09, 440);
  }

  public playLand() {
    this.playNoise(0.08, 0.07);
    this.playTone(130, 0.09, 'triangle', 0.09, 65);
  }

  public playPickup(kind: 'oxygen' | 'battery' | 'part' | 'sample' = 'oxygen') {
    if (kind === 'oxygen') {
      this.playTone(this.jitter(523), 0.09, 'sine', 0.14);
      this.playTone(this.jitter(659), 0.12, 'sine', 0.14, undefined, 0.06);
    } else if (kind === 'battery') {
      this.playTone(380, 0.14, 'sawtooth', 0.09, 760);
    } else if (kind === 'sample') {
      this.playTone(587, 0.08, 'triangle', 0.14);
      this.playTone(784, 0.08, 'triangle', 0.14, undefined, 0.07);
      this.playTone(1046, 0.18, 'sine', 0.14, undefined, 0.14);
    } else {
      this.playTone(this.jitter(440), 0.08, 'square', 0.1);
      this.playTone(this.jitter(554), 0.1, 'square', 0.1, undefined, 0.06);
    }
  }

  public playHurt() {
    this.playNoise(0.18, 0.18);
    this.playTone(180, 0.22, 'sawtooth', 0.18, 62);
  }

  public playAlarm() {
    this.playTone(620, 0.18, 'sawtooth', 0.13, 440);
    this.playTone(620, 0.18, 'sawtooth', 0.13, 440, 0.25);
  }

  public playButton(color: 'red' | 'blue' | 'green' | 'yellow' | 'ui') {
    const map = {
      red: 330,
      blue: 440,
      green: 554,
      yellow: 659,
      ui: 520,
    };
    this.playTone(map[color], 0.18, 'triangle', 0.14);
  }

  public playFlip() {
    this.playTone(this.jitter(480), 0.06, 'triangle', 0.08, 620);
  }

  public playMatch() {
    this.playTone(523, 0.09, 'sine', 0.14);
    this.playTone(659, 0.09, 'sine', 0.14, undefined, 0.07);
    this.playTone(784, 0.16, 'sine', 0.14, undefined, 0.14);
  }

  public playMismatch() {
    this.playTone(230, 0.12, 'sawtooth', 0.1, 165);
  }

  public playBrushSweep() {
    this.playNoise(0.05, 0.045);
  }

  public playSolarSpark() {
    this.playTone(this.jitter(780), 0.09, 'sine', 0.1, 1180);
  }

  public playScan() {
    this.playTone(660, 0.1, 'sine', 0.12, 990);
    this.playTone(990, 0.16, 'sine', 0.12, 1320, 0.1);
  }

  public playInstallWeld() {
    this.playNoise(0.12, 0.08);
    this.playTone(260, 0.12, 'square', 0.12, 520);
    this.playTone(523, 0.12, 'triangle', 0.14, undefined, 0.12);
    this.playTone(784, 0.22, 'sine', 0.15, undefined, 0.24);
  }

  public playVoiceBlip(pitch = 300) {
    this.playTone(this.jitter(pitch), 0.045, 'square', 0.045);
  }

  public playVictory() {
    const notes = [523, 659, 784, 1046];
    notes.forEach((n, i) => {
      this.playTone(n, 0.2, 'triangle', 0.14, undefined, i * 0.1);
    });
  }

  public playDefeat() {
    const notes = [392, 349, 311, 261];
    notes.forEach((n, i) => {
      this.playTone(n, 0.22, 'sawtooth', 0.11, undefined, i * 0.12);
    });
  }

  // Adaptive Background Music
  public setMusicMood(mood: MusicMood) {
    if (this.currentMood === mood) return;
    this.currentMood = mood;
    this.stepIdx = 0;
    this.stopMusicLoop();
    if (!this.settings.muted && mood !== 'none') {
      this.startMusicLoop();
    }
  }

  private stopMusicLoop() {
    if (this.musicInterval !== null && typeof window !== 'undefined') {
      window.clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  private startMusicLoop() {
    if (typeof window === 'undefined') return;
    this.stopMusicLoop();

    const patterns: Record<Exclude<MusicMood, 'none'>, { tempoMs: number; notes: number[]; wave: OscillatorType }> = {
      title: {
        tempoMs: 520,
        notes: [261.6, 329.6, 392.0, 493.9, 392.0, 329.6, 293.7, 392.0],
        wave: 'sine',
      },
      malfunction: {
        tempoMs: 280,
        notes: [146.8, 0, 155.6, 0, 146.8, 220.0, 138.6, 0],
        wave: 'sawtooth',
      },
      moon: {
        tempoMs: 650,
        notes: [220.0, 0, 261.6, 329.6, 0, 293.7, 246.9, 0],
        wave: 'sine',
      },
      explore: {
        tempoMs: 380,
        notes: [261.6, 329.6, 392.0, 329.6, 440.0, 392.0, 349.2, 293.7],
        wave: 'triangle',
      },
      dialogue: {
        tempoMs: 550,
        notes: [329.6, 392.0, 440.0, 392.0, 293.7, 349.2, 392.0, 329.6],
        wave: 'sine',
      },
      mars: {
        tempoMs: 460,
        notes: [196.0, 233.1, 293.7, 233.1, 174.6, 220.0, 261.6, 220.0],
        wave: 'triangle',
      },
      ending: {
        tempoMs: 440,
        notes: [261.6, 329.6, 392.0, 523.3, 493.9, 392.0, 440.0, 523.3],
        wave: 'sine',
      },
    };

    const mood = this.currentMood;
    if (mood === 'none') return;
    const cfg = patterns[mood];

    this.musicInterval = window.setInterval(() => {
      if (this.settings.muted || this.currentMood === 'none') return;
      const note = cfg.notes[this.stepIdx % cfg.notes.length];
      this.stepIdx++;
      if (note > 0) {
        this.playTone(note, cfg.tempoMs / 1000 * 0.9, cfg.wave, 0.055, undefined, 0, true);
      }
    }, cfg.tempoMs);
  }
}

export const sound = new SoundEngine();
