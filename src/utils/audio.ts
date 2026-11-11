// Web Audio API Sound Synthesizer & Haptic Vibration

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playAudioFeedback(type: 'success' | 'duplicate' | 'error' | 'click' | 'clear', soundEnabled: boolean = true) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      // Pleasant high-pitch double chirp (success scan)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.start(now);
      osc.stop(now + 0.15);

      // Trigger slight haptic
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(60);
      }
    } else if (type === 'duplicate' || type === 'error') {
      // Low buzz tone for warning/duplicate
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.12);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);
      osc.start(now);
      osc.stop(now + 0.33);

      // Distinct alert vibration
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 60, 100]);
      }
    } else if (type === 'click') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'clear') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.16);
    }
  } catch (err) {
    console.warn('Audio feedback failed:', err);
  }
}
