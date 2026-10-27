// Usage: node scripts/prepare-library-piano.mjs <Salamander C4.mp3> <Salamander A3.mp3>
// Sources / CC BY 3.0 credit: public/assets/Library/audio/ATTRIBUTION.txt
import { spawnSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const sources = process.argv.slice(2);
if (sources.length !== 2) throw new Error("Provide the Salamander C4 and A3 source files.");
const output = new URL("../public/assets/Library/audio/", import.meta.url);
await mkdir(output, { recursive: true });
const notes = [
  { name: "grand-piano-c4.wav", duration: 1.05, releaseStart: 0.42, gain: 0.85 },
  { name: "grand-piano-a3.wav", duration: 0.95, releaseStart: 0.38, gain: 1.2 },
];

for (const [index, note] of notes.entries()) {
  const filter = [
    `atrim=start=0:end=${note.duration}`,
    "asetpts=PTS-STARTPTS",
    "highpass=f=45",
    "lowpass=f=5000",
    "treble=g=-4:f=2200",
    "afade=t=in:st=0:d=0.006",
    `afade=t=out:st=${note.releaseStart}:d=${note.duration - note.releaseStart}`,
    `volume=${note.gain}`,
  ].join(",");
  const result = spawnSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y", "-i", sources[index],
    "-af", filter, "-ar", "44100", "-ac", "2", "-c:a", "pcm_s16le",
    "-map_metadata", "-1", fileURLToPath(new URL(note.name, output)),
  ], { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Piano conversion failed: ${note.name}`);
  console.log(`${note.name}: ${note.duration}s, stereo PCM, softened hammer attack and release`);
}
