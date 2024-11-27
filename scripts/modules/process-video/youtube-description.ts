import { readFile, writeFile } from "node:fs/promises";

export async function generateYoutubeDescription(
  jsonChaptersFile: string,
  outputFile: string
) {
  const rawChapters = await readFile(jsonChaptersFile, "utf8");
  const chapters = JSON.parse(rawChapters.replace(/^```json\s*|\s*```$/g, ""));

  const description = chapters
    .map(
      (chapter: { startTime: string; title: string }) =>
        `${chapter.startTime} - ${chapter.title}`
    )
    .join("\n");

  await writeFile(outputFile, description);
}
