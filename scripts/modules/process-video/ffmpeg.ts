import { runShellCommand } from "./run";

export async function mergeFrameWithAudio(
  framePath: string,
  audioPath: string,
  outputPath: string
) {
  await runShellCommand([
    "ffmpeg",
    "-loop",
    "1",
    "-i",
    framePath,
    "-i",
    audioPath,
    "-c:v",
    "libx264",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-shortest",
    "-pix_fmt",
    "yuv420p",
    outputPath,
  ]);
}
