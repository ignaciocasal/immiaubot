#!/usr/bin/env bash
set -euo pipefail

TOKEN="${1:?Usage: $0 <telegram-bot-token>}"
ZONE="us-west1-a"
PROJECT="immiaubot"
IMAGE="us-west1-docker.pkg.dev/$PROJECT/immiaubot/app:latest"
VM="immiaubot"

echo "==> Building and pushing Docker image..."
gcloud builds submit --config cloudbuild.yaml

echo "==> Authenticating Docker to Artifact Registry on VM..."
SA_EMAIL=$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')-compute@developer.gserviceaccount.com
gcloud iam service-accounts keys create /tmp/immiaubot-deploy-key.json \
  --iam-account="$SA_EMAIL" --quiet
gcloud compute scp /tmp/immiaubot-deploy-key.json "$VM:/tmp/ar-key.json" \
  --zone="$ZONE" --quiet
rm -f /tmp/immiaubot-deploy-key.json

echo "==> Updating container on VM..."
gcloud compute ssh "$VM" --zone="$ZONE" -- \
  "cat /tmp/ar-key.json | docker login -u _json_key --password-stdin https://us-west1-docker.pkg.dev && \
   docker pull $IMAGE && \
   docker stop \$(docker ps -q) && docker rm \$(docker ps -aq) && \
   docker run -d --restart=always --name immiaubot \
     -e TELEGRAM_BOT_TOKEN=\"$TOKEN\" \
     -v /mnt/stateful_partition/data:/data \
     $IMAGE && \
   rm -f /tmp/ar-key.json"

echo "==> Done."
