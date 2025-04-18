# Kermes POS Deployment Automation

This folder contains scripts to automate the build and deployment process for the Kermes POS application.

## Prerequisites

Before using these scripts, make sure you have:

1. Node.js installed (v14 or higher)
2. Firebase CLI installed (`npm install -g firebase-tools`)
3. A Firebase account and project created

## Available Scripts

### Windows Users

Run the `deploy.bat` file by double-clicking it or executing it from the command prompt:

```
cd path/to/kermes-pos
automation\deploy.bat
```

### macOS/Linux Users

Run the `deploy.sh` script from the terminal:

```
cd path/to/kermes-pos
chmod +x automation/deploy.sh  # Make the script executable (first time only)
./automation/deploy.sh
```

### All Platforms

You can also run the Node.js script directly:

```
cd path/to/kermes-pos
node automation/deploy.js
```

## What the Script Does

The deployment script performs the following steps:

1. Checks if Firebase CLI is installed
2. Verifies if you're logged in to Firebase (prompts for login if not)
3. Builds the React application
4. Checks if Firebase is initialized in the project (initializes if not)
5. Deploys the application to Firebase Hosting

## Troubleshooting

If you encounter any issues during deployment:

1. Make sure you have the necessary permissions for the Firebase project
2. Check that your Firebase project is properly set up
3. Verify that you're logged in to the correct Firebase account
4. Check the console output for specific error messages

## Customization

You can modify the `deploy.js` script to customize the deployment process:

- Change the Firebase project ID in the initialization step
- Add additional build steps if needed
- Modify the deployment configuration 