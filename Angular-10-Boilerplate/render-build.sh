#!/usr/bin/env bash
# exit on error
set -o errexit

# Use a Node version compatible with your dependencies
export NODE_OPTIONS=--max_old_space_size=4096
npm install --legacy-peer-deps
npm run build