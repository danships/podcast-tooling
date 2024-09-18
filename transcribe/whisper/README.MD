# whisper

Use whisper to generate transcripts for audio files.

## Setup

```bash
python3 -m venv .whisper-env
source .whisper-env/bin/activate
pip install -r requirements.txt
```

## Usage

```bash
whisper file.mp3 --language en --model medium --output_format vtt
```
