#!/usr/bin/env bash
# Build script for Render

# Exit on error
set -e

# Navigate to the project directory
cd "$(dirname "$0")"

# Force Node.js to ignore exports field for better compatibility with Angular 10
export NODE_OPTIONS="--no-warnings --no-deprecation --max-old-space-size=4096"

# Clean install dependencies to avoid potential conflicts
rm -rf node_modules
npm ci

# Explicitly install compatible versions required by Angular 10
# Using exact known-available versions
npm install --no-save typescript@3.9.7
npm install --no-save @angular/compiler-cli@10.2.5
npm install --no-save @angular-devkit/build-angular@0.1002.0

# Build the application with production configuration
npm run build -- --prod

# No need to manually copy _redirects file anymore
# The file will be automatically included in the build output