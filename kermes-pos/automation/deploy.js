/**
 * Kermes POS Deployment Script
 * 
 * This script automates the build and deployment process for the Kermes POS application.
 * It builds the React application and deploys it to Firebase.
 * 
 * Usage:
 *   node automation/deploy.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..');
const BUILD_DIR = path.join(PROJECT_ROOT, 'build');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper function to execute commands
function runCommand(command, cwd = PROJECT_ROOT) {
  console.log(`${colors.cyan}Running: ${command}${colors.reset}`);
  try {
    execSync(command, { 
      cwd, 
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: true }
    });
    return true;
  } catch (error) {
    console.error(`${colors.red}Error executing command: ${command}${colors.reset}`);
    console.error(error.message);
    return false;
  }
}

// Main deployment function
async function deploy() {
  console.log(`${colors.magenta}=== Kermes POS Deployment ===${colors.reset}`);
  
  // Step 1: Check if Firebase is installed
  console.log(`${colors.yellow}Step 1: Checking Firebase CLI...${colors.reset}`);
  try {
    execSync('firebase --version', { stdio: 'ignore' });
    console.log(`${colors.green}Firebase CLI is installed.${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Firebase CLI is not installed. Please install it with:${colors.reset}`);
    console.error(`${colors.yellow}npm install -g firebase-tools${colors.reset}`);
    process.exit(1);
  }
  
  // Step 2: Check if user is logged in to Firebase
  console.log(`${colors.yellow}Step 2: Checking Firebase login status...${colors.reset}`);
  try {
    execSync('firebase projects:list', { stdio: 'ignore' });
    console.log(`${colors.green}You are logged in to Firebase.${colors.reset}`);
  } catch (error) {
    console.log(`${colors.yellow}You are not logged in to Firebase. Please log in:${colors.reset}`);
    if (!runCommand('firebase login')) {
      console.error(`${colors.red}Firebase login failed. Please try again.${colors.reset}`);
      process.exit(1);
    }
  }
  
  // Step 3: Build the React application
  console.log(`${colors.yellow}Step 3: Building the React application...${colors.reset}`);
  if (!runCommand('npm run build')) {
    console.error(`${colors.red}Build failed. Please fix the errors and try again.${colors.reset}`);
    process.exit(1);
  }
  
  // Step 4: Check if Firebase is initialized
  console.log(`${colors.yellow}Step 4: Checking Firebase initialization...${colors.reset}`);
  const firebaseConfigExists = fs.existsSync(path.join(PROJECT_ROOT, '.firebaserc'));
  
  if (!firebaseConfigExists) {
    console.log(`${colors.yellow}Firebase is not initialized. Initializing...${colors.reset}`);
    if (!runCommand('firebase init hosting --project kermesapp --public build --no-github')) {
      console.error(`${colors.red}Firebase initialization failed. Please try again.${colors.reset}`);
      process.exit(1);
    }
  } else {
    console.log(`${colors.green}Firebase is already initialized.${colors.reset}`);
  }
  
  // Step 5: Deploy to Firebase
  console.log(`${colors.yellow}Step 5: Deploying to Firebase...${colors.reset}`);
  if (!runCommand('firebase deploy --only hosting')) {
    console.error(`${colors.red}Deployment failed. Please fix the errors and try again.${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.green}=== Deployment completed successfully! ===${colors.reset}`);
  console.log(`${colors.cyan}Your application is now live on Firebase.${colors.reset}`);
}

// Run the deployment
deploy().catch(error => {
  console.error(`${colors.red}Deployment failed with error:${colors.reset}`);
  console.error(error);
  process.exit(1);
}); 