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

# Ensure _redirects file exists in the build output
cp _redirects dist/angular-signup-verification-boilerplate/