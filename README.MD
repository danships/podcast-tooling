# podcast-tooling

This repository contains the tooling I use to automate the editing of my podcast, [Debugging Dan](https://www.debuggingdan.com).

## [./scripts](./scripts)

This is a collection of scripts. Well, currently only contains one script: `process-video.sh`.

### process-video

Provide this script with a video file and have it automatically perform:

1. Generate a introduction and outtro for audio with a video
2. Extract audio from video for enhancement
3. Replace enhanced audio back into video
4. Generate summary and transcript for audio
5. Create a page for the episode on Notion

```bash
dan@host:~/git/podcast-tooling$ ./process-video.sh
Usage: ./process-video.sh <video-file> [output-dir]
```

## [./transcribe/whisper](./transcribe/whisper)

A python environment to use whisper to locally generate transcripts for audio files.

Explanation and usage can be found in the [README](./transcribe/whisper/README.MD).

## [./enhance/dolby-io](./enhance/dolby-io/)

An experimental environment to use Dolby.io to enhance audio files. Used it to compare the Dolby.io enhancement
with [Adobe Podcast Enhance](https://podcast.adobe.com/enhance). The advantage of using dolby.io is that it has
an API. Unfortunately, Adobe Enhance generated beter results (but has no API unfortunately).
