#!/usr/bin/env bash
# Build script for Render

# Exit on error
set -e

# Navigate to the project directory
cd "$(dirname "$0")"

# Force Node.js to use a compatible version
export NODE_OPTIONS="--no-warnings --no-deprecation --max-old-space-size=4096"

# Clean install dependencies to avoid potential conflicts
rm -rf node_modules
npm ci

# Build the application with production configuration
npm run build