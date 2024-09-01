import { logger } from "./logger";
import { runShellCommand } from "./run";
import path from "node:path";
import { URL } from "node:url";

export async function generateTranscripts(
  audioFile: string,
  outputDir: string
) {
  logger(`Generating transcripts for ${audioFile} in ${outputDir}`);

  const scriptsPath = path.join(
    new URL(import.meta.url).pathname,
    "../../../../scripts"
  );

  await runShellCommand([
    path.join(scriptsPath, "transcript.sh"),
    audioFile,
    outputDir,
  ]);
}
