const express = require("express");
const usb = require('usb');

const app = express();
const port = 3001;

app.use(express.json());

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  next();
});

// Function to find the printer
function findPrinter() {
  const devices = usb.getDeviceList();
  return devices.find(device => 
    device.deviceDescriptor.idVendor === 1305 && 
    device.deviceDescriptor.idProduct === 3
  );
}

function cleanup(printer, iface) {
  if (iface) {
    try {
      iface.release();
    } catch (e) {
      console.error('Error releasing interface:', e);
    }
  }
  
  if (printer) {
    try {
      printer.close();
    } catch (e) {
      console.error('Error closing printer:', e);
    }
  }
}

app.post("/api/print", (req, res) => {
  let printer = null;
  let iface = null;
  
  try {
    console.log('Received print request');
    
    printer = findPrinter();
    if (!printer) {
      console.error('Printer not found');
      res.status(500).send("Printer not found");
      return;
    }

    console.log('Found printer:', printer);
    
    // Open the printer
    printer.open();
    
    // Claim the interface
    iface = printer.interface(0);
    iface.claim();

    // Find the correct endpoint (usually endpoint 1 or 2)
    const endpoint = iface.endpoint(1) || iface.endpoint(2);
    if (!endpoint) {
      console.error('No suitable endpoint found');
      cleanup(printer, iface);
      res.status(500).send("No suitable endpoint found");
      return;
    }

    console.log('Using endpoint:', endpoint);
    
    // Create a buffer with ESC/POS commands
    const buffer = Buffer.from([
      // Initialize printer
      0x1B, 0x40,
      // Print text
      ...Buffer.from('TEST PRINT\n'),
      // Feed and cut
      0x0A, 0x0A, 0x0A,  // Feed 3 lines
      0x1D, 0x56, 0x00   // Cut paper
    ]);

    // Send the data
    endpoint.transfer(buffer, (error) => {
      if (error) {
        console.error('Print error:', error);
        cleanup(printer, iface);
        res.status(500).send("Print error: " + error.message);
      } else {
        console.log('Print command sent successfully');
        // Wait a bit before cleanup to ensure the transfer is complete
        setTimeout(() => {
          cleanup(printer, iface);
          res.send("Printed successfully!");
        }, 1000);
      }
    });
  } catch (error) {
    cleanup(printer, iface);
    console.error("Error:", error);
    res.status(500).send("Error: " + error.message);
  }
});

app.listen(port, () => {
  console.log(`Printer server running on http://localhost:${port}`);
  console.log('Ready to receive print requests');
});
