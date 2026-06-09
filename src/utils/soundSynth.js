class SpaceSoundSynth {
  constructor() {
    this.ctx = null;
    this.engineNode = null;
    this.ambientNode = null;
    this.isInitialized = false;
    this.masterVolume = null;
    this.muted = true;
  }
  
  init() {
    if (this.isInitialized) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    try {
      this.ctx = new AudioContext();
      this.masterVolume = this.ctx.createGain();
      this.masterVolume.gain.value = this.muted ? 0.0 : 0.5;
      this.masterVolume.connect(this.ctx.destination);
      this.isInitialized = true;
    } catch (e) {
      console.warn("Failed to initialize Web Audio API:", e);
    }
  }
  
  startEngineHum() {
    this.init();
    if (!this.isInitialized || this.engineNode) return;
    
    try {
      // Low rumble oscillator 1
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1
      
      // Low rumble oscillator 2 (slightly detuned)
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(55.4, this.ctx.currentTime);
      
      // Low pass filter to remove harsh high frequencies, yielding a mechanical hum
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(80, this.ctx.currentTime);
      
      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(0.2, this.ctx.currentTime);
      
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.masterVolume);
      
      osc1.start(0);
      osc2.start(0);
      
      this.engineNode = { osc1, osc2, filter, gainNode };
    } catch (e) {
      console.error("Error starting engine hum:", e);
    }
  }
  
  stopEngineHum() {
    if (this.engineNode) {
      try {
        this.engineNode.osc1.stop();
        this.engineNode.osc2.stop();
      } catch (e) {}
      this.engineNode = null;
    }
  }

  startAmbientPad() {
    this.init();
    if (!this.isInitialized || this.ambientNode) return;

    try {
      // G minor/suspended chord (G2, D3, G3, Bb3, C4)
      const frequencies = [98.0, 146.83, 196.0, 233.08, 261.63];
      const oscillators = [];
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, this.ctx.currentTime);
      filter.Q.value = 1.2;

      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(0.08, this.ctx.currentTime);

      frequencies.forEach(freq => {
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 0.5, this.ctx.currentTime);
        osc.connect(filter);
        osc.start(0);
        oscillators.push(osc);
      });

      filter.connect(gainNode);
      gainNode.connect(this.masterVolume);

      // Low Frequency Oscillator (LFO) to sweep the filter cut-off (simulating interstellar winds)
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime); // 12.5 seconds per sweep cycle
      
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(80, this.ctx.currentTime); // Sweep radius +- 80Hz
      
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start(0);

      this.ambientNode = { oscillators, filter, gainNode, lfo, lfoGain };
    } catch (e) {
      console.error("Error starting ambient pad:", e);
    }
  }

  stopAmbientPad() {
    if (this.ambientNode) {
      try {
        this.ambientNode.oscillators.forEach(osc => osc.stop());
        this.ambientNode.lfo.stop();
      } catch (e) {}
      this.ambientNode = null;
    }
  }

  playWarpSweep(delay = 0, duration = 2.2) {
    this.init();
    if (!this.isInitialized) return;
    
    try {
      const now = this.ctx.currentTime + delay;
      
      // Pitch sweeping oscillator
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      // Sweep up to 1300Hz exponentially over the specified duration
      osc.frequency.exponentialRampToValueAtTime(1300, now + duration);
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(180, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + duration);
      filter.Q.value = 1.5;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.3); // Rapid fade in
      gain.gain.setValueAtTime(0.2, now + duration - 0.4);
      gain.gain.linearRampToValueAtTime(0, now + duration); // Fade out at arrival

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterVolume);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.error("Error playing warp sweep:", e);
    }
  }
  
  playClick() {
    this.init();
    if (!this.isInitialized) return;
    
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      
      osc.connect(gain);
      gain.connect(this.masterVolume);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {
      console.error("Error playing click sound:", e);
    }
  }

  playHover() {
    this.init();
    if (!this.isInitialized) return;
    
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      // Hover beep
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.03);
      
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      
      osc.connect(gain);
      gain.connect(this.masterVolume);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {
      console.error("Error playing hover sound:", e);
    }
  }

  playScannerPing(frequencyFactor = 1.0) {
    this.init();
    if (!this.isInitialized || this.muted) return;
    
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      const startFreq = 800 + frequencyFactor * 1000;
      const endFreq = 400 + frequencyFactor * 500;
      
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.03);
      
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      
      osc.connect(gain);
      gain.connect(this.masterVolume);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {
      // Catch transient audio context blocks
    }
  }

  setMute(mute) {
    this.muted = mute;
    if (!this.isInitialized) {
      if (!mute) {
        this.init();
      } else {
        return;
      }
    }
    
    try {
      const targetVal = mute ? 0.0 : 0.5;
      this.masterVolume.gain.setTargetAtTime(targetVal, this.ctx.currentTime, 0.1);
      
      if (!mute) {
        // Resume context if suspended
        if (this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        this.startEngineHum();
        this.startAmbientPad();
      }
    } catch (e) {
      console.warn("Audio mute state error:", e);
    }
  }
}

export const spaceSoundSynth = new SpaceSoundSynth();
export default spaceSoundSynth;
