#!/bin/bash

set -e


# Check if the video file is provided
if [ -z "$1" ]; then
  echo "No video file provided. Usage: $0 <video-file> <slug>"
  exit 1
fi
if [ -z "$2" ]; then
  echo "No slug provided. Usage: $0 <video-file> <slug>"
  exit 1
fi

video_file=$1
slug=$2

# get the base path from video_file, without the filename
base_path=$(dirname $video_file)

output_dir=$base_path

npx tsx ./modules/process-video.ts $video_file $output_dir $slug