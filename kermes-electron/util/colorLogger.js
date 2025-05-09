const colorLogger = {
    formatMessage: (message) => {
      if (typeof message === 'object') {
        // Format objects or JSON as a pretty-printed string
        return JSON.stringify(message, null, 2);
      } else return message; // Return as-is for strings
    },
  
    info: (message) => {
      console.log(`\x1b[34mINFO: ${colorLogger.formatMessage(message)}\x1b[0m`); // Blue
    },
    success: (message) => {
      console.log(`\x1b[32mSUCCESS: ${colorLogger.formatMessage(message)}\x1b[0m`); // Green
    },
    warning: (message) => {
      console.log(`\x1b[33mWARNING: ${colorLogger.formatMessage(message)}\x1b[0m`); // Yellow
    },
    error: (message) => {
      console.log(`\x1b[31mERROR: ${colorLogger.formatMessage(message)}\x1b[0m`); // Red
    },
    debug: (message) => {
      console.log(`\x1b[36mDEBUG: ${colorLogger.formatMessage(message)}\x1b[0m`); // Cyan
    },
    verbose: (message) => {
      console.log(`\x1b[35mVERBOSE: ${colorLogger.formatMessage(message)}\x1b[0m`); // Magenta
    },
    critical: (message) => {
      console.log(`\x1b[41m\x1b[37mCRITICAL: ${colorLogger.formatMessage(message)}\x1b[0m`); // White text on Red background
    },
    separator: () => {console.log('36mSEPARATE:----------------------------------------[0m`');}, // Separator line
  };
  
  export default colorLogger;