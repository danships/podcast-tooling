import { runShellCommand } from "./run";

export async function replaceAudio(
  videoPath: string,
  audioPath: string,
  outputPath: string
) {
  await runShellCommand([
    "ffmpeg",
    "-i",
    videoPath,
    "-i",
    audioPath,
    "-c:v",
    "copy",
    "-map",
    "0:v:0",
    "-map",
    "1:a:0",
    "-shortest",
    outputPath,
  ]);
}
