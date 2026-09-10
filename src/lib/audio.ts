/**
 * High-performance Web Audio API scanner beep and haptic feedback
 */
let audioCtx: AudioContext | null = null;

export function playSuccessBeep() {
  try {
    // 1. Haptic feedback (vibration) for mobile phones
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      navigator.vibrate([40, 30, 60]);
    }

    // 2. Synthesizer POS Scanner Beep
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // Standard POS barcode scanner tone: crisp high-pitched chirp
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1800, audioCtx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.09);
  } catch (e) {
    // Ignore audio autoplay restrictions gracefully
    console.debug('Audio feedback error:', e);
  }
}

export function playErrorBeep() {
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.18);
  } catch (e) {
    console.debug('Audio feedback error:', e);
  }
}
