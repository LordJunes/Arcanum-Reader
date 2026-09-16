/**
 * GrimoireAudio - Web Audio API Sound-Engine mit 4 Sound-Profilen
 */
class GrimoireAudio {
  constructor() {
    this.ctx = null;
    this.volume = 0.7;
    this.soundProfile = 'parchment';
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playPageTurn() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const conf = this.getConfig();
      const bufferSize = Math.floor(this.ctx.sampleRate * conf.dur);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        const env = Math.sin((i / bufferSize) * Math.PI);
        data[i] = (Math.random() * 2 - 1) * Math.pow(env, conf.envPow);
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = conf.filter;
      filter.frequency.setValueAtTime(conf.fStart, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(conf.fEnd, this.ctx.currentTime + conf.dur);
      filter.Q.value = conf.Q;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(this.volume * conf.gain, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + conf.dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch (e) {
      console.warn("Audio Fehler:", e);
    }
  }

  getConfig() {
    switch (this.soundProfile) {
      case 'crisp':
        return { dur: 0.32, envPow: 1.5, filter: 'bandpass', fStart: 2800, fEnd: 1100, Q: 1.8, gain: 0.75 };
      case 'heavy':
        return { dur: 0.55, envPow: 2.2, filter: 'lowpass', fStart: 900, fEnd: 300, Q: 2.5, gain: 1.1 };
      case 'whisper':
        return { dur: 0.28, envPow: 1.2, filter: 'highpass', fStart: 1800, fEnd: 1200, Q: 0.8, gain: 0.5 };
      case 'parchment':
      default:
        return { dur: 0.45, envPow: 1.8, filter: 'bandpass', fStart: 1400, fEnd: 550, Q: 2.0, gain: 0.85 };
    }
  }
}

window.grimoireAudio = new GrimoireAudio();