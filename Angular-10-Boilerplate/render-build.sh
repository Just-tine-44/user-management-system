#!/usr/bin/env bash
# Build script for Render

# Exit on error
set -e

# Navigate to the project directory
cd "$(dirname "$0")"

# Install dependencies
npm install

# Build the application
npm run build

# No need to manually copy _redirects file anymore
# The file will be automatically included in the build output