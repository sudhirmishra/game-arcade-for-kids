/**
 * Pure Web Audio API Sound Synthesizer for WonderPix Arcade.
 * Zero external audio files, instantly responsive, and works offline.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private bgmPlaying: boolean = false;
  private bgmInterval: number | null = null;

  constructor() {
    // Check saved mute preference
    try {
      const savedMute = localStorage.getItem('wonderpix_muted');
      if (savedMute !== null) {
        this.muted = savedMute === 'true';
      }
    } catch {
      // ignore
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(mute: boolean) {
    this.muted = mute;
    try {
      localStorage.setItem('wonderpix_muted', String(mute));
    } catch {
      // ignore
    }
    if (mute && this.bgmPlaying) {
      this.stopBgm();
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // Playful bubble tap / button click
  public playTap(pitch = 520) {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.5, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Card flip / whoosh
  public playFlip() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  // Happy match chime (ascending major chord)
  public playMatch() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0.18, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.3);
    });
  }

  // Gentle mismatch sound (soft downward boop)
  public playMismatch() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.18);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Bouncy spring / impact sound
  public playBounce(velocityFactor = 1) {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const baseFreq = 180 + Math.min(velocityFactor * 80, 200);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, now + 0.14);

    const vol = Math.min(0.2, 0.08 + velocityFactor * 0.1);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Critter pop / clear sound
  public playPop() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Animal voice synthesizer for Memory Game and kids games
  public playAnimalVoice(label: string) {
    if (this.muted) return;
    this.initCtx();

    const normalized = label.toLowerCase();
    const now = this.ctx ? this.ctx.currentTime : 0;

    // 1. Synthesize specialized Web Audio acoustic timbre for the animal
    if (this.ctx) {
      if (normalized.includes('lion')) {
        // Deep rumble & roar (low FM growl)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const mod = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.6);

        mod.type = 'sine';
        mod.frequency.setValueAtTime(35, now);
        modGain.gain.setValueAtTime(40, now);

        mod.connect(osc.frequency);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        mod.start(now);
        osc.start(now);
        mod.stop(now + 0.65);
        osc.stop(now + 0.65);
      } else if (normalized.includes('frog')) {
        // Double "Ribbit" croak
        [0, 0.22].forEach((offset) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(140, now + offset);
          osc.frequency.linearRampToValueAtTime(210, now + offset + 0.08);
          osc.frequency.linearRampToValueAtTime(130, now + offset + 0.16);

          gain.gain.setValueAtTime(0.22, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.18);

          osc.connect(gain);
          gain.connect(this.ctx!.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.19);
        });
      } else if (normalized.includes('elephant')) {
        // High-pitched brassy trumpet
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.18);
        osc.frequency.exponentialRampToValueAtTime(380, now + 0.5);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.55);
      } else if (normalized.includes('monkey')) {
        // "Ooh-ooh-aah-aah" rapid chattering chirps
        [0, 0.1, 0.22, 0.34].forEach((offset, idx) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'sine';
          const pitch = idx >= 2 ? 780 : 560;
          osc.frequency.setValueAtTime(pitch, now + offset);
          osc.frequency.exponentialRampToValueAtTime(pitch * 1.3, now + offset + 0.07);

          gain.gain.setValueAtTime(0.18, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.09);

          osc.connect(gain);
          gain.connect(this.ctx!.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.09);
        });
      } else if (normalized.includes('owl')) {
        // "Hoo... Hoo-hooo!" resonant hollow tone
        [0, 0.28].forEach((offset, idx) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'sine';
          const duration = idx === 0 ? 0.2 : 0.35;
          osc.frequency.setValueAtTime(420, now + offset);
          osc.frequency.exponentialRampToValueAtTime(370, now + offset + duration);

          gain.gain.setValueAtTime(0.2, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + duration);

          osc.connect(gain);
          gain.connect(this.ctx!.destination);
          osc.start(now + offset);
          osc.stop(now + offset + duration + 0.02);
        });
      } else if (normalized.includes('penguin')) {
        // Honk honk
        [0, 0.18].forEach((offset) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(240, now + offset);
          osc.frequency.exponentialRampToValueAtTime(330, now + offset + 0.08);

          gain.gain.setValueAtTime(0.18, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.14);

          osc.connect(gain);
          gain.connect(this.ctx!.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.15);
        });
      } else if (normalized.includes('bunny')) {
        // Cute bouncy chirp
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.12);

        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (normalized.includes('fox')) {
        // Playful double yip
        [0, 0.14].forEach((offset) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(700, now + offset);
          osc.frequency.exponentialRampToValueAtTime(1150, now + offset + 0.09);

          gain.gain.setValueAtTime(0.16, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.11);

          osc.connect(gain);
          gain.connect(this.ctx!.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.12);
        });
      } else {
        // Friendly cheerful chirp for panda, koala, etc.
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(950, now + 0.15);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    }

    // 2. Play natural cheerful voice call using SpeechSynthesis API
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel(); // cancel any pending speech

        let speechPhrase = `${label}!`;
        if (normalized.includes('lion')) speechPhrase = 'Roar! Lion!';
        else if (normalized.includes('frog')) speechPhrase = 'Ribbit! Frog!';
        else if (normalized.includes('elephant')) speechPhrase = 'Trumpet! Elephant!';
        else if (normalized.includes('monkey')) speechPhrase = 'Ooh ooh aah aah! Monkey!';
        else if (normalized.includes('owl')) speechPhrase = 'Hoo hoo! Owl!';
        else if (normalized.includes('penguin')) speechPhrase = 'Honk honk! Penguin!';
        else if (normalized.includes('fox')) speechPhrase = 'Yip yip! Fox!';
        else if (normalized.includes('bunny')) speechPhrase = 'Hop hop! Bunny!';
        else if (normalized.includes('panda')) speechPhrase = 'Happy Panda!';
        else if (normalized.includes('koala')) speechPhrase = 'Cute Koala!';
        else if (normalized.includes('ice cream')) speechPhrase = 'Yum! Ice cream!';
        else if (normalized.includes('rocket')) speechPhrase = 'Blastoff! Rocket!';
        else if (normalized.includes('alien')) speechPhrase = 'Greetings Earthling!';
        else if (normalized.includes('star')) speechPhrase = 'Twinkle star!';

        const utterance = new SpeechSynthesisUtterance(speechPhrase);
        utterance.rate = 1.05;
        utterance.pitch = 1.25; // cheerful, friendly kid pitch
        utterance.volume = 0.85;

        // Try to pick a clear English voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(
          (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Kid') || v.name.includes('Google') || v.name.includes('Samantha'))
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        window.speechSynthesis.speak(utterance);
      } catch {
        // ignore if speech synthesis is blocked
      }
    }
  }

  // Victory fanfare
  public playWin() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [
      { f: 523.25, d: 0.12, t: 0 },
      { f: 659.25, d: 0.12, t: 0.14 },
      { f: 783.99, d: 0.12, t: 0.28 },
      { f: 1046.5, d: 0.35, t: 0.44 },
    ];

    notes.forEach((note) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now + note.t);

      gain.gain.setValueAtTime(0.2, now + note.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + note.t);
      osc.stop(now + note.t + note.d + 0.02);
    });
  }

  // Background arcade melody toggle
  public isBgmPlaying(): boolean {
    return this.bgmPlaying;
  }

  public toggleBgm(): boolean {
    if (this.bgmPlaying) {
      this.stopBgm();
      return false;
    } else {
      this.startBgm();
      return true;
    }
  }

  public startBgm() {
    if (this.muted || this.bgmPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    this.bgmPlaying = true;
    const melody = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 349.23]; // C, E, G, C, G, E, D, F
    let step = 0;

    this.bgmInterval = window.setInterval(() => {
      if (this.muted || !this.bgmPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;
      const freq = melody[step % melody.length];
      step++;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    }, 400);
  }

  public stopBgm() {
    this.bgmPlaying = false;
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const sound = new SoundEngine();
