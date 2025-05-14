#!/bin/bash

# This script builds the Next.js application and deploys it to Firebase Hosting

# Build the Next.js application
npx next build

# Deploy to Firebase Hosting
firebase deploy --only hosting
