import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import { execSync } from 'child_process';
import * as path from 'path';
import sharp from 'sharp';

const FRAME_DIR = 'frames';
const SUMMARY_DIR = 'summaries';
const INTERVAL = 10; // seconds
const MODEL = 'gemma3:12b-it-qat';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

const PROMPT = `You are analyzing a coding livestream. In prior frames, the coder performed:

- [T-2]: {{ t-2 }}
- [T-1]: {{ t-1 }}

Now, describe what the coder is doing in the current frame **in relation to those previous steps**. Focus on **why** this step is being done — not just what is visible.

Return only a **single, concise sentence** summarizing what the coder is trying to accomplish **at this point in the workflow**, using high-level terms (e.g., writing tests, refining UX logic, finalizing error handling).`;

// Ensure folders exist
async function ensureFoldersExist({
  FRAME_DIR,
  SUMMARY_DIR,
}: {
  FRAME_DIR: string;
  SUMMARY_DIR: string;
}) {
  for (const dir of [FRAME_DIR, SUMMARY_DIR]) {
    if (!(await fsSync.existsSync(dir))) {
      await fs.mkdir(dir, { recursive: true });
    }
  }
}

function extractFrames(
  inputVideo: string,
  interval: number,
  outputDir: string
): void {
  const escapedInput = inputVideo.replace(/[\\'"]/g, '\\$&');
  const escapedOutput = outputDir.replace(/[\\'"]/g, '\\$&');

  execSync(
    `ffmpeg -i "${escapedInput}" -vf fps=1/${interval} "${escapedOutput}/frame_%04d.jpg"`,
    { shell: '/bin/bash' }
  );
}

async function run(): Promise<void> {
  const video = process.argv[2];
  if (!video) {
    console.log('Supply a video file as input.');
    process.exit(1);
  }

  const basePath = path.dirname(video);
  const frameDir = path.join(basePath, FRAME_DIR);
  const summaryDir = path.join(basePath, SUMMARY_DIR);

  await ensureFoldersExist({ FRAME_DIR: frameDir, SUMMARY_DIR: summaryDir });

  // Only extract frames if none exist
  const existingFrames = await fs.readdir(frameDir);
  const hasFrames = existingFrames.some((f) => f.endsWith('.jpg'));
  if (!hasFrames) {
    await extractFrames(video, INTERVAL, frameDir);
  } else {
    console.log('Frames already exist, skipping extraction');
  }

  const frameFiles = (await fs.readdir(frameDir)).filter((f) =>
    f.endsWith('.jpg')
  );

  const summaryLines: string[] = [];

  for (let i = 0; i < frameFiles.length; i++) {
    const file = frameFiles[i];
    const timestamp = i * INTERVAL;
    const framePath = path.join(frameDir, file);
    const summaryPath = path.join(summaryDir, `${file}.json`);

    if (fsSync.existsSync(summaryPath)) {
      const existingContents = await fs.readFile(summaryPath, 'utf-8');
      const existingSummary = JSON.parse(existingContents) as {
        timestamp: number;
        description: string;
      };
      summaryLines.push(`- **${timestamp}s**: ${existingSummary.description}`);
      continue;
    }

    // 🔧 Resize image to 720px wide
    const resizedBuffer = await sharp(framePath)
      .resize({ width: 720 })
      .jpeg({ quality: 80 })
      .toBuffer();

    const base64 = resizedBuffer.toString('base64');

    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt: PROMPT.replace('{{ t-2 }}', summaryLines[i - 2]).replace(
          '{{ t-1 }}',
          summaryLines[i - 1]
        ),
        images: [base64],
        stream: false,
      }),
    });

    const data = await response.json();
    const description = data.response;

    fs.writeFile(
      summaryPath,
      JSON.stringify({ timestamp, description }, null, 2)
    );
    summaryLines.push(`- **${timestamp}s**: ${description}`);
    console.log(file, `${timestamp}s -> ${description}`);
  }

  await fs.writeFile(`${video}.summary.md`, summaryLines.join('\n'));
}

run();
