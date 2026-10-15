/**
 * Game Boy DMG-01 Power-On Boot Chime Synthesizer
 * Uses the Web Audio API with square wave oscillators to recreate
 * the iconic Nintendo Game Boy power-on sound effect without external audio assets.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Pre-warms or unlocks the audio context from a user gesture (e.g. click).
 */
export function primeGameboyAudio(): void {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch {
    // ignore
  }
}

/**
 * Plays the iconic Game Boy power-on boot chime.
 * Two parts:
 * 1. Low-mid chime/arpeggio slide
 * 2. High resonant crisp ping (C7 ~2093 Hz)
 */
export function playGameboyPowerOnSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime + 0.05;

    // --- PART 1: The Introductory Sweep / Chime ---
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'square';
    // Frequency sweep from ~523 Hz to ~1046 Hz
    osc1.frequency.setValueAtTime(523.25, now);
    osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.12);

    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.15);

    // --- PART 2: The Iconic High "Ba-ling!" / Crystal Ping ---
    const dingTime = now + 0.22;
    const osc2 = ctx.createOscillator();
    const oscHarmonic = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'square';
    // Game Boy primary high note: B6 / C7 (~2093.00 Hz)
    osc2.frequency.setValueAtTime(2093.0, dingTime);

    oscHarmonic.type = 'square';
    // Subtle sub-octave C6 (~1046.5 Hz) for rich DMG-01 hardware warmth
    oscHarmonic.frequency.setValueAtTime(1046.5, dingTime);

    gain2.gain.setValueAtTime(0.0001, dingTime);
    gain2.gain.exponentialRampToValueAtTime(0.25, dingTime + 0.015);
    gain2.gain.exponentialRampToValueAtTime(0.08, dingTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.0001, dingTime + 0.7);

    osc2.connect(gain2);
    oscHarmonic.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(dingTime);
    oscHarmonic.start(dingTime);
    osc2.stop(dingTime + 0.75);
    oscHarmonic.stop(dingTime + 0.75);
  } catch (err) {
    console.warn('Game Boy sound effect could not play:', err);
  }
}

/**
 * Plays a classic Pokédex mechanical opening sound:
 * A subtle servo latch click followed by a dual retro boot chirp.
 */
export function playPokedexOpenSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime + 0.02;

    // Latch click (quick low click)
    const oscClick = ctx.createOscillator();
    const gainClick = ctx.createGain();
    oscClick.type = 'triangle';
    oscClick.frequency.setValueAtTime(140, now);
    oscClick.frequency.exponentialRampToValueAtTime(40, now + 0.04);
    gainClick.gain.setValueAtTime(0.3, now);
    gainClick.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    oscClick.connect(gainClick);
    gainClick.connect(ctx.destination);
    oscClick.start(now);
    oscClick.stop(now + 0.06);

    // Mechanical servo glide
    const oscServo = ctx.createOscillator();
    const gainServo = ctx.createGain();
    oscServo.type = 'sawtooth';
    oscServo.frequency.setValueAtTime(220, now + 0.05);
    oscServo.frequency.exponentialRampToValueAtTime(440, now + 0.22);
    gainServo.gain.setValueAtTime(0.001, now + 0.05);
    gainServo.gain.linearRampToValueAtTime(0.08, now + 0.12);
    gainServo.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    oscServo.connect(gainServo);
    gainServo.connect(ctx.destination);
    oscServo.start(now + 0.05);
    oscServo.stop(now + 0.26);

    // Boot chirp (classic electronic Dexter blip)
    const chirpTime = now + 0.26;
    const oscChirp = ctx.createOscillator();
    const gainChirp = ctx.createGain();
    oscChirp.type = 'square';
    oscChirp.frequency.setValueAtTime(587.33, chirpTime); // D5
    oscChirp.frequency.setValueAtTime(880.0, chirpTime + 0.06); // A5
    gainChirp.gain.setValueAtTime(0.001, chirpTime);
    gainChirp.gain.linearRampToValueAtTime(0.12, chirpTime + 0.02);
    gainChirp.gain.exponentialRampToValueAtTime(0.001, chirpTime + 0.18);
    oscChirp.connect(gainChirp);
    gainChirp.connect(ctx.destination);
    oscChirp.start(chirpTime);
    oscChirp.stop(chirpTime + 0.2);
  } catch {
    // ignore
  }
}
