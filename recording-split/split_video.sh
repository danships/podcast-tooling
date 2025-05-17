#!/bin/bash

input="$1"
if [ -z "$input" ]; then
  echo "Usage: $0 <video_file>"
  exit 1
fi

# Get the directory of the input file
input_dir=$(dirname "$input")
filename=$(basename -- "$input")
name="${filename%.*}"
ext="${filename##*.}"

# Get total duration in seconds
duration=$(ffprobe -v error -select_streams v:0 -show_entries format=duration -of csv=p=0 "$input")
split_point=$(awk "BEGIN {printf \"%.2f\", $duration / 2}")

# First half
ffmpeg -i "$input" -ss 0 -t "$split_point" -c copy "${input_dir}/${name}_part1.${ext}"

# Second half
ffmpeg -i "$input" -ss "$split_point" -c copy "${input_dir}/${name}_part2.${ext}"
