import { environment } from "./environment";
import { logger } from "./logger";
import { readFile } from "fs/promises";

export async function transcriptUpload(
  transcriptFileName: string,
  slug: string
) {
  // First check if the file already exists
  const { DATASTHOR_API_KEY, DATASTHOR_NAMESPACE } = environment;

  const readUrl = `https://www.datasthor.com/data/${DATASTHOR_NAMESPACE}/transcripts/${slug}.txt`;
  logger("Using transcript URL", readUrl);

  const existsResponse = await fetch(readUrl, {
    headers: { Authorization: `Bearer ${DATASTHOR_API_KEY}` },
  });
  if (existsResponse.status === 200) {
    logger("Transcript already exists, skipping upload");
    return;
  }
  logger(
    "Transcript does not exist, uploading",
    existsResponse.status,
    existsResponse.statusText
  );

  const writeUrl = `https://www.datasthor.com/api/data/v1/${DATASTHOR_NAMESPACE}/transcripts/${slug}.txt`;
  const transcriptContents = await readFile(transcriptFileName, "utf-8");

  const response = await fetch(writeUrl, {
    method: "POST",
    body: transcriptContents,
    headers: {
      "Content-Type": "text/plain",
      Authorization: `Bearer ${DATASTHOR_API_KEY}`,
    },
  });
  if (!response.ok) {
    throw new Error(
      `Failed to upload transcript: ${response.status} ${response.statusText}`
    );
  }
  logger("Transcript uploaded to Datasthor", writeUrl);
}
