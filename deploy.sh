#!/usr/bin/env bash
set -euo pipefail

TOKEN="${1:?Usage: $0 <telegram-bot-token>}"

echo "==> Building and pushing Docker image..."
gcloud builds submit --config cloudbuild.yaml

echo "==> Updating container on VM..."
gcloud compute ssh immiaubot --zone=us-west1-a -- \
  "docker pull us-west1-docker.pkg.dev/immiaubot/immiaubot/app:latest && \
   docker stop \$(docker ps -q) && docker rm \$(docker ps -aq) && \
   docker run -d --restart=always --name immiaubot \
     -e TELEGRAM_BOT_TOKEN=\"$TOKEN\" \
     -v /mnt/stateful_partition/data:/data \
     us-west1-docker.pkg.dev/immiaubot/immiaubot/app:latest"

echo "==> Done."
