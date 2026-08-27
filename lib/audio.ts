const SOUND_MUTE_KEY = "smartdine-kitchen-muted";

function tone(
  ctx: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  gainValue: number,
  type: OscillatorType = "triangle",
) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.04);
}

let kitchenCtx: AudioContext | null = null;
let htmlAudio: HTMLAudioElement | null = null;
let htmlAudioUrl: string | null = null;
let armed = false;
let muted = readMutedPref();

function readMutedPref() {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.localStorage.getItem(SOUND_MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

function persistMuted(next: boolean) {
  try {
    window.localStorage.setItem(SOUND_MUTE_KEY, next ? "1" : "0");
  } catch {
    // ignore quota / private mode
  }
}

function getKitchenContext() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    return null;
  }

  if (!kitchenCtx || kitchenCtx.state === "closed") {
    kitchenCtx = new AudioCtx();
  }

  return kitchenCtx;
}

function buildChimeSamples(sampleRate = 22_050) {
  const duration = 0.62;
  const count = Math.floor(sampleRate * duration);
  const samples = new Float32Array(count);
  const notes = [
    { freq: 784, start: 0, len: 0.16 },
    { freq: 1046.5, start: 0.17, len: 0.16 },
    { freq: 1318.5, start: 0.36, len: 0.24 },
  ];

  for (let i = 0; i < count; i += 1) {
    const t = i / sampleRate;
    let sample = 0;
    for (const note of notes) {
      const local = t - note.start;
      if (local < 0 || local > note.len) {
        continue;
      }
      const envelope = Math.exp(-local * 9) * (1 - local / note.len);
      sample += Math.sin(2 * Math.PI * note.freq * local) * envelope;
    }
    samples[i] = Math.max(-1, Math.min(1, sample * 0.42));
  }

  return { samples, sampleRate };
}

function samplesToWavBlob(samples: Float32Array, sampleRate: number) {
  const count = samples.length;
  const buffer = new ArrayBuffer(44 + count * 2);
  const view = new DataView(buffer);
  const ascii = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  ascii(0, "RIFF");
  view.setUint32(4, 36 + count * 2, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  ascii(36, "data");
  view.setUint32(40, count * 2, true);

  let offset = 44;
  for (let i = 0; i < count; i += 1) {
    view.setInt16(offset, samples[i] * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function getHtmlAudio() {
  if (htmlAudio) {
    return htmlAudio;
  }

  const { samples, sampleRate } = buildChimeSamples();
  htmlAudioUrl = URL.createObjectURL(samplesToWavBlob(samples, sampleRate));
  htmlAudio = new Audio(htmlAudioUrl);
  htmlAudio.preload = "auto";
  htmlAudio.volume = 0.85;
  return htmlAudio;
}

async function unlockHtmlAudio() {
  const audio = getHtmlAudio();
  try {
    audio.currentTime = 0;
    audio.volume = 0;
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 0.85;
  } catch {
    // Autoplay still blocked — the next user click will retry.
  }
}

function playHtmlChime() {
  const audio = getHtmlAudio();
  audio.pause();
  audio.currentTime = 0;
  void audio.play().catch(() => {
    // Ignore AbortError if a second ticket arrives mid-play.
  });
}

function playWebChime(ctx: AudioContext) {
  const now = ctx.currentTime;
  tone(ctx, 784, now, 0.16, 0.09, "triangle");
  tone(ctx, 1046.5, now + 0.17, 0.16, 0.08, "triangle");
  tone(ctx, 1318.5, now + 0.36, 0.28, 0.07, "sine");
}

export function isKitchenSoundArmed() {
  return armed;
}

export function isKitchenSoundMuted() {
  return muted;
}

export function setKitchenSoundMuted(next: boolean) {
  muted = next;
  persistMuted(next);
}

/** Call from a click. Browsers refuse to start audio without a user gesture. */
export async function armKitchenSound() {
  const ctx = getKitchenContext();
  armed = true;
  await unlockHtmlAudio();
  if (ctx) {
    await ctx.resume();
  }
  return Boolean(ctx) || Boolean(htmlAudio);
}

export function playKitchenAlert() {
  if (!armed || muted) {
    return;
  }

  const ctx = getKitchenContext();
  if (ctx) {
    void ctx.resume().then(() => {
      if (ctx.state === "closed") {
        playHtmlChime();
        return;
      }
      playWebChime(ctx);
    });
    return;
  }

  playHtmlChime();
}

export function playWaiterChime() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    return;
  }

  const ctx = new AudioCtx();
  const now = ctx.currentTime;
  tone(ctx, 784, now, 0.22, 0.045, "sine");
  tone(ctx, 1174, now + 0.14, 0.28, 0.04, "sine");

  window.setTimeout(() => {
    void ctx.close();
  }, 800);
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
