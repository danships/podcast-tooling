import "dotenv/config";
import Parser from "rss-parser";
import { writeFile, readFile } from "node:fs/promises";
import { generateTranscripts } from "../process-video/transcript";
import { ifNotExists } from "../process-video/if-not-exists";
import { replaceExtension } from "../process-video/replace-extension";
import { appendFilename } from "../process-video/append-filename";
import { transcriptUpload } from "../process-video/transcript-upload";
import { fixTranscripts } from "../process-video/fix-transcripts";
import { generateJsonChapters } from "../process-video/json-chapters";
import { generateYoutubeDescription } from "../process-video/youtube-description";

const PODCAST_URL = "https://www.debuggingdan.com/podcast/feed.xml";
const PODCAST_FILE = "./test/feed.xml";

async function main() {
  const parser = new Parser();
  // const { items } = await parser.parseURL(PODCAST_URL);
  const { items } = await parser.parseString(await readFile(PODCAST_FILE));

  for (const item of items.slice(2)) {
    const { guid, enclosure } = item;
    const slug = guid?.split("/").pop();

    const mp3Url = enclosure?.url;
    if (!mp3Url || !slug) {
      console.error("Missing mp3Url or slug", item.guid);
      continue;
    }

    const mp3Path = `./test/${slug}.mp3`;
    await ifNotExists(mp3Path, async () => {
      const response = await fetch(mp3Url);

      await writeFile(mp3Path, Buffer.from(await response.arrayBuffer()));
    });
    const transcriptPath = replaceExtension(mp3Path, "txt");
    await ifNotExists(transcriptPath, () =>
      generateTranscripts(mp3Path, "./test")
    );

    const fixedTranscriptsFilename = appendFilename(transcriptPath, "_fixed");

    await ifNotExists(fixedTranscriptsFilename, () =>
      fixTranscripts(transcriptPath, fixedTranscriptsFilename)
    );

    await transcriptUpload(fixedTranscriptsFilename, slug);

    const jsonChapterFilename = appendFilename(
      transcriptPath,
      "_chapters",
      "json"
    );
    await ifNotExists(jsonChapterFilename, () =>
      generateJsonChapters(fixedTranscriptsFilename, jsonChapterFilename)
    );

    const youtubeDescriptionFilename = appendFilename(
      jsonChapterFilename,
      "_youtube",
      "txt"
    );
    await ifNotExists(youtubeDescriptionFilename, () =>
      generateYoutubeDescription(
        jsonChapterFilename,
        youtubeDescriptionFilename
      )
    );
  }
}

void main();
