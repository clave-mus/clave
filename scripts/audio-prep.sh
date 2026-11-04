#!/usr/bin/env bash
# Converte as gravações originais (.m4a do celular) para WAV mono 48 kHz, que é o que a análise lê.
# Os .wav não são versionados: ver test-fixtures/audio/.gitignore.
set -euo pipefail
cd "$(dirname "$0")/.."
for f in test-fixtures/audio/*.m4a; do
  ffmpeg -y -loglevel error -i "$f" -ac 1 -ar 48000 "${f%.m4a}.wav"
done
echo "$(ls test-fixtures/audio/*.wav | wc -l) arquivos prontos."
