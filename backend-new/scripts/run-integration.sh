#!/usr/bin/env bash
set -euo pipefail

REGION=${1:-}
BUCKET=${2:-}
ACCESS_KEY_ID=${3:-}
SECRET_ACCESS_KEY=${4:-}

# Load defaults from .env.example if present
if [ -f ".env.example" ]; then
  _env_region=$(grep -E '^AWS_REGION=' .env.example | sed 's/^AWS_REGION=//')
  _env_bucket=$(grep -E '^AWS_BUCKET_NAME=' .env.example | sed 's/^AWS_BUCKET_NAME=//')
  _env_key=$(grep -E '^AWS_ACCESS_KEY_ID=' .env.example | sed 's/^AWS_ACCESS_KEY_ID=//')
  _env_secret=$(grep -E '^AWS_SECRET_ACCESS_KEY=' .env.example | sed 's/^AWS_SECRET_ACCESS_KEY=//')
  # strip surrounding quotes if any
  _env_region=$(echo "${_env_region}" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
  _env_bucket=$(echo "${_env_bucket}" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
  _env_key=$(echo "${_env_key}" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
  _env_secret=$(echo "${_env_secret}" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")

  REGION=${REGION:-${_env_region}}
  BUCKET=${BUCKET:-${_env_bucket}}
  ACCESS_KEY_ID=${ACCESS_KEY_ID:-${_env_key}}
  SECRET_ACCESS_KEY=${SECRET_ACCESS_KEY:-${_env_secret}}
fi

if [ -z "$REGION" ]; then
  read -r -p "AWS Region (e.g. us-east-1): " REGION
fi
if [ -z "$BUCKET" ]; then
  read -r -p "AWS Bucket name: " BUCKET
fi
if [ -z "$ACCESS_KEY_ID" ]; then
  read -r -p "AWS Access Key ID (leave blank to use env/role): " ACCESS_KEY_ID
fi
if [ -n "$ACCESS_KEY_ID" ] && [ -z "$SECRET_ACCESS_KEY" ]; then
  read -rs -p "AWS Secret Access Key (input hidden): " SECRET_ACCESS_KEY
  echo
fi

export AWS_REGION="$REGION"
export AWS_BUCKET_NAME="$BUCKET"
if [ -n "$ACCESS_KEY_ID" ]; then
  export AWS_ACCESS_KEY_ID="$ACCESS_KEY_ID"
  export AWS_SECRET_ACCESS_KEY="$SECRET_ACCESS_KEY"
fi
export RUN_AWS_S3_INTEGRATION=true

echo "Running S3 integration tests against bucket '$BUCKET' in region '$REGION'..."

npm run test:integration
