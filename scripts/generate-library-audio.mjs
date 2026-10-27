// Original Library toolbar/alarm sounds. Run: node scripts/generate-library-audio.mjs
// Sampled piano controls are prepared separately by prepare-library-piano.mjs.
import { mkdir, writeFile } from "node:fs/promises";

const sampleRate = 44100;
const output = new URL("../public/assets/Library/audio/", import.meta.url);
await mkdir(output, { recursive: true });

const sine = (frequency, time) => Math.sin(2 * Math.PI * frequency * time);
const attack = (time, seconds = 0.002) => Math.min(1, time / seconds);

function bell(time, frequency) {
  if (time < 0) return 0;
  return attack(time, 0.004) * (
    sine(frequency, time) * Math.exp(-time / 0.75) +
    0.3 * sine(frequency * 2.756, time) * Math.exp(-time / 0.3) +
    0.12 * sine(frequency * 5.404, time) * Math.exp(-time / 0.13)
  );
}

async function saveSound(name, duration, render, peak) {
  const frames = Math.round(sampleRate * duration);
  const samples = new Float64Array(frames);
  let maximum = 0;
  for (let i = 0; i < frames; i++) {
    const time = i / sampleRate;
    // The last 20 ms taper to silence, avoiding a discontinuity at EOF.
    samples[i] = render(time) * Math.min(1, (duration - time) / 0.02);
    if (!Number.isFinite(samples[i])) throw new Error(`Invalid audio: ${name}`);
    maximum = Math.max(maximum, Math.abs(samples[i]));
  }
  if (maximum === 0) throw new Error(`Silent audio: ${name}`);
  const wav = Buffer.alloc(44 + frames * 2);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20); // PCM
  wav.writeUInt16LE(1, 22); // mono
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(frames * 2, 40);
  for (let i = 0; i < frames; i++) {
    wav.writeInt16LE(Math.round((samples[i] / maximum) * peak * 32767), 44 + i * 2);
  }
  await writeFile(new URL(name, output), wav);
  console.log(`${name}: ${duration}s, mono PCM 44.1 kHz, peak ${peak}`);
}

await saveSound("brass-tap.wav", 0.16, (t) => attack(t) * (
  sine(1450, t) * Math.exp(-t / 0.016) +
  0.2 * sine(2350, t) * Math.exp(-t / 0.009)
), 0.4);

await saveSound("desk-bell.wav", 3.8, (t) =>
  bell(t, 659.255) + 0.8 * bell(t - 0.72, 880), 0.6,
);
