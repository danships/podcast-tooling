#!/bin/bash

set -e


# Check if the video file is provided
if [ -z "$1" ]; then
  echo "No video file provided. Usage: $0 <video-file> [output-dir]"
  exit 1
fi

video_file=$1

# get the base path from video_file, without the filename
base_path=$(dirname $video_file)

if [ -z "$2" ]; then
  output_dir=$base_path
else
  output_dir=$2
fi

npx tsx ./modules/process-video.ts $video_file $output_dir