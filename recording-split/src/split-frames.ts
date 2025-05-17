import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import { execSync } from 'child_process';
import * as path from 'path';
import sharp from 'sharp';

const FRAME_DIR = 'frames';
const SUMMARY_DIR = 'summaries';
const INTERVAL = 10; // seconds
const MODEL = 'gemma3:12b-it-qat';
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

const PROMPT = `You are analyzing a coding livestream. If the frame is showing an IDE, output the file path that is being edited. If the frame is showing a webbrowser, output the URL. Else, return a 1-2 sentence summary of the screen. ONLY output the full path or the URL, nothing else.`;

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

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  initialBackoffMs: number = INITIAL_BACKOFF_MS
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxRetries - 1) break;

      const backoffMs = initialBackoffMs * Math.pow(2, attempt);
      console.log(
        `Attempt ${attempt + 1} failed, retrying in ${backoffMs}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError;
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

    const response = await retryWithBackoff(async () => {
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

      if (!response.ok) {
        throw new Error(
          `Ollama API request failed with status ${response.status}`
        );
      }

      return response;
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
