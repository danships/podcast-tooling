import "dotenv/config";
import { uploadVideo } from "./process-video/telegram";
import path from "node:path";
import { waitForFile } from "./process-video/wait-for-file";
import { mergeFrameWithAudio } from "./process-video/ffmpeg";
import { environment } from "./process-video/environment";
import { logger } from "./process-video/logger";
import { appendFilename } from "./process-video/append-filename";
import { ifNotExists } from "./process-video/if-not-exists";
import { replaceExtension } from "./process-video/replace-extension";
import { extractAudio } from "./process-video/extract-audio";
import { inParallel } from "./process-video/in-parallel";
import { replaceAudio } from "./process-video/replace-audio";
import { runShellCommand } from "./process-video/run";
import { generateTranscripts } from "./process-video/transcript";
import { summarize } from "./process-video/summarize";
import { fixTranscripts } from "./process-video/fix-transcripts";
import { createBlogPage } from "./process-video/create-blog-page";
import { updateBlogPageContents } from "./process-video/update-blog-page-contents";
import { convertWavToMp3 } from "./process-video/convert-wav-to-mp3";

if (process.argv.length !== 4) {
  console.log("Usage: process-video.ts <input-video-path> <output-video-path>");
  process.exit(1);
}

const videoFile = process.argv[2];
const outDir = process.argv[3];

// upload the video to debuggingdanbot
// TODO Disabled, complains about request entity too large
//void uploadVideo(videoFile);

const coverFile = path.join(outDir, "cover_video.png");
await waitForFile(coverFile);

logger("Generating intro and outtro bits");
const folderWithBits = environment.FOLDER_WITH_BITS;
const introPath = path.join(outDir, "bits_intro.mp4");
await ifNotExists(introPath, () =>
  mergeFrameWithAudio(
    coverFile,
    path.join(folderWithBits, "Ep intro cut (enhanced).wav"),
    introPath
  )
);

const outtroPath = path.join(outDir, "bits_outtro.mp4");
await ifNotExists(outtroPath, () =>
  mergeFrameWithAudio(
    coverFile,
    path.join(folderWithBits, "Ep outtro cut (enhanced).wav"),
    outtroPath
  )
);
logger("Generated intro and outtro bits");

// Take the filename from videoFile and append it to the outDir
const videoFilename = path.basename(videoFile);
const editedVideoFilename = appendFilename(
  path.join(outDir, videoFilename),
  "_edited",
  "mp4"
);
await waitForFile(editedVideoFilename);

logger("Generating audio from video");
const unprocessedAudioFilename = replaceExtension(editedVideoFilename, "mp3");
await ifNotExists(unprocessedAudioFilename, () =>
  extractAudio(editedVideoFilename, unprocessedAudioFilename)
);

logger(
  "Generated audio from video, please upload",
  unprocessedAudioFilename,
  "to Adobe Audition for processing"
);
const enhancedAudioFilename = appendFilename(
  unprocessedAudioFilename,
  "_enhanced",
  "wav"
);
await waitForFile(enhancedAudioFilename);
logger("Enhanced audio is ready");

// Now we fork into multiple directions: we are generating the final video and the final audio
// AND generate the transcripts and the subtitles
// AND upload the final video to Youtube (TODO, perhaps at some point)
// AND set up the blog page

await inParallel([
  // The audio / video track
  (async () => {
    const finalAudioPath = replaceExtension(editedVideoFilename, "mp3");
    await ifNotExists(finalAudioPath, async () =>
      convertWavToMp3(enhancedAudioFilename, finalAudioPath)
    );

    const finalVideoPath = appendFilename(editedVideoFilename, "-fixed_audio");
    await ifNotExists(finalVideoPath, async () => {
      logger("Replacing audio in the video");
      await replaceAudio(
        editedVideoFilename,
        enhancedAudioFilename,
        finalVideoPath
      );
      logger("### Audio is replaced, final video is ready ###", finalVideoPath);
    });
  })(),

  // The transcript and contents
  (async () => {
    const transcriptFilename = replaceExtension(enhancedAudioFilename, "txt");
    const subtitleFilename = replaceExtension(enhancedAudioFilename, "vtt");

    // First create the blog page, so that that already exists (add the intro etc later)
    const pageId = await createBlogPage(transcriptFilename);

    logger("Generating transcripts");
    await ifNotExists(transcriptFilename, () =>
      generateTranscripts(enhancedAudioFilename, outDir)
    );
    logger("Transcripts are ready", transcriptFilename, subtitleFilename);

    const summaryFilename = appendFilename(transcriptFilename, "_summary");
    const fixedTranscriptsFilename = appendFilename(
      transcriptFilename,
      "_fixed"
    );
    await inParallel([
      (async () => {
        await ifNotExists(summaryFilename, () =>
          summarize(transcriptFilename, summaryFilename)
        );
      })(),
      (async () => {
        await ifNotExists(fixedTranscriptsFilename, () =>
          fixTranscripts(transcriptFilename, fixedTranscriptsFilename)
        );
      })(),
    ]);
    await updateBlogPageContents(
      pageId,
      transcriptFilename,
      fixedTranscriptsFilename,
      summaryFilename
    );
  })(),
]);
