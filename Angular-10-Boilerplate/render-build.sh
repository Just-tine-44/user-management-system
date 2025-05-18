#!/usr/bin/env bash
# Build script for Render

# Exit on error
set -e

# Navigate to the project directory
cd "$(dirname "$0")"

# Force Node.js to ignore exports field for better compatibility with Angular 10
export NODE_OPTIONS="--no-warnings --no-deprecation"

# Clean install dependencies to avoid potential conflicts
rm -rf node_modules
npm ci

# Explicitly install the compatible compiler-cli version
npm install --no-save @angular/compiler-cli@10.2.5

# Build the application with production configuration
npm run build -- --prod

# No need to manually copy _redirects file anymore
# The file will be automatically included in the build output