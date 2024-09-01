import { runShellCommand } from "./run";

export async function extractAudio(videoPath: string, audioPath: string) {
  await runShellCommand([
    "ffmpeg",
    "-i",
    videoPath,
    "-q:a",
    "0",
    "-map",
    "a",
    audioPath,
  ]);
}
