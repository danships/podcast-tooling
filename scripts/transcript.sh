#!/bin/bash

set -e

input_file=$1
output_dir=$2

if [ -z "$input_file" ] || [ -z "$output_dir" ]; then
  echo "Usage: $0 <input-file> <output-dir>"
  exit 1
fi

source ../transcribe/whisper/.whisper-env/bin/activate
whisper $input_file --language en --model medium --output_dir $output_dir