import { runShellCommand } from "./run";

export async function convertWavToMp3(
  sourceWavFile: string,
  targetMp3File: string
) {
  await runShellCommand([
    "ffmpeg",
    "-i",
    sourceWavFile,
    "-acodec",
    "libmp3lame",
    targetMp3File,
  ]);
}
