#!/bin/bash

echo "Kermes POS Deployment Script"
echo "==========================="
echo

# Change to the project root directory
cd "$(dirname "$0")/.."

# Run the deployment script
node automation/deploy.js

# Check if the deployment was successful
if [ $? -ne 0 ]; then
  echo
  echo "Deployment failed with error code $?"
  exit $?
fi

echo
echo "Deployment completed successfully!" 