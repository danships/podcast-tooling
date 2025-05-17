import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import csv from 'csv-parser';

// Get command line arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error('Usage: ts-node csv-split.ts <input-csv> <input-video>');
  process.exit(1);
}

const [inputCSV, inputVideo] = args;

// Validate input files exist
if (!fs.existsSync(inputCSV)) {
  console.error(`Error: CSV file "${inputCSV}" does not exist`);
  process.exit(1);
}

if (!fs.existsSync(inputVideo)) {
  console.error(`Error: Video file "${inputVideo}" does not exist`);
  process.exit(1);
}

// Create output directory next to the video file
const videoDir = path.dirname(inputVideo);
const outputDir = path.join(videoDir, 'clips');

interface Clip {
  Name: string;
  'Start TC': string;
  'End TC': string;
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

function convertTimecode(timecode: string): string {
  // Convert from HH:MM:SS:FF to HH:MM:SS.mmm
  const [hours, minutes, seconds, frames] = timecode.split(':').map(Number);

  // Assuming 30fps (based on the video metadata)
  const milliseconds = Math.round((frames / 30) * 1000);

  // Format with leading zeros and milliseconds
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds
    .toString()
    .padStart(3, '0')}`;
}

// Store clips in array to maintain order
const clips: Clip[] = [];

fs.createReadStream(inputCSV)
  .pipe(csv())
  .on('data', (row: Clip) => {
    clips.push(row);
  })
  .on('end', () => {
    console.log('🎬 Processing clips...');
    clips.forEach((clip, index) => {
      const title = sanitizeFilename(clip.Name);
      const start = convertTimecode(clip['Start TC']);
      const end = convertTimecode(clip['End TC']);
      // Add sequence number with leading zeros
      const sequenceNumber = (index + 1).toString().padStart(3, '0');
      const outputPath = path.join(outputDir, `${sequenceNumber}_${title}.mp4`);

      const cmd = `ffmpeg -y -i "${inputVideo}" -ss ${start} -to ${end} -c copy "${outputPath}"`;

      exec(cmd, (err) => {
        if (err) {
          console.error(`❌ Failed to create "${title}":`, err.message);
        } else {
          console.log(`✅ Created: ${outputPath}`);
        }
      });
    });
    console.log('🎬 All clips scheduled.');
  });
