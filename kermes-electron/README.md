# Kermes POS Electron App

This Electron application provides USB printer support for the Kermes POS system.

## Prerequisites

- Node.js and npm installed
- Your React app running on localhost:3000
- USB printer connected to the system

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the Electron app:
```bash
npm start
```

## Building the Application

To create a distributable package:

```bash
npm run build
```

The built application will be available in the `dist` folder.

## Usage

In your React application, you can use the print functionality like this:

```javascript
// Example usage in a React component
const handlePrint = async () => {
  try {
    await window.electron.print('Your text to print');
    console.log('Print successful');
  } catch (error) {
    console.error('Print error:', error);
  }
};
```

## Development

- The app loads your React application from `http://localhost:3000`
- Make sure your React app is running before starting the Electron app
- In development mode, DevTools are automatically opened

## Security Notes

- The app uses context isolation for security
- Printer functionality is exposed through a preload script
- Make sure to handle printer errors appropriately in your React application 