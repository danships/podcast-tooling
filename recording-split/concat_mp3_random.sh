#!/bin/bash

# Usage: ./concat_mp3_random.sh [source_dir] [output_file] [max_duration_sec]

SRC_DIR="${1:-.}"
OUT_FILE="${2:-output.mp3}"
MAX_DURATION="${3:-0}"  # 0 = no limit

TMP_DIR=$(mktemp -d)
LIST_FILE="$TMP_DIR/files.txt"
CURRENT_DURATION=0

# Randomize MP3 list and properly escape filenames
find "$SRC_DIR" -name "*.mp3" -print0 | shuf -z > "$TMP_DIR/random.txt"

# Collect MP3 files until max duration (if set)
> "$LIST_FILE"
while IFS= read -r -d '' file; do
    if [[ $MAX_DURATION -gt 0 ]]; then
        DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$file")
        DURATION=${DURATION%.*}  # round down
        if (( CURRENT_DURATION + DURATION > MAX_DURATION )); then
            break
        fi
        CURRENT_DURATION=$((CURRENT_DURATION + DURATION))
    fi
    # Get absolute path and escape single quotes
    abs_file=$(realpath "$file")
    escaped_file=$(printf '%s' "$abs_file" | sed "s/'/'\\''/g")
    printf "file '%s'\n" "$escaped_file" >> "$LIST_FILE"
done < "$TMP_DIR/random.txt"

# Concatenate with ffmpeg
ffmpeg -f concat -safe 0 -i "$LIST_FILE" -c copy "$OUT_FILE"

# Cleanup
rm -rf "$TMP_DIR"
