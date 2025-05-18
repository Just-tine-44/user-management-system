#!/usr/bin/env bash
# exit on error
set -o errexit

# Remove package-lock to ensure clean install
rm -f package-lock.json

# Use a Node version compatible with your dependencies
export NODE_OPTIONS=--max_old_space_size=4096
export NODE_VERSION=18.17.0
npm install --legacy-peer-deps --force
npm run build