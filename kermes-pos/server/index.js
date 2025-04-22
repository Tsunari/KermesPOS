const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const escpos = require('escpos');
const escposUSB = require('escpos-usb'); // Import escpos-usb

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// ESC/POS commands
const ESC = '\x1B';
const GS = '\x1D';
const INIT = ESC + '@';
const BOLD_ON = ESC + 'E\x01';
const BOLD_OFF = ESC + 'E\x00';
const ALIGN_LEFT = ESC + 'a\x00';
const ALIGN_CENTER = ESC + 'a\x01';
//const ALIGN_RIGHT = ESC + 'a\x02';
const CUT_PAPER = GS + 'V\x41\x00';

// Format price with currency symbol
const formatPrice = (price) => {
  return price.toFixed(2).replace('.', ',') + '€';
};

// Generate item receipt
const generateItemReceipt = (item) => {
  const { product, quantity } = item;
  
  let receipt = '';
  receipt += ALIGN_CENTER;
  receipt += BOLD_ON;
  receipt += product.name + '\n';
  receipt += BOLD_OFF;
  receipt += ALIGN_LEFT;
  receipt += `Category: ${product.category}\n`;
  receipt += `Quantity: ${quantity}\n`;
  receipt += `Price: ${formatPrice(product.price)} each\n`;
  receipt += `Total: ${formatPrice(product.price * quantity)}\n`;
  receipt += `Date: ${new Date().toLocaleString()}\n`;
  receipt += '--------------------------------\n';
  
  return receipt;
};

// Generate full cart receipt
const generateCartReceipt = (items, total) => {
  let receipt = INIT; // Initialize printer
  
  // Print header
  receipt += ALIGN_CENTER + BOLD_ON;
  receipt += 'KERMES POS RECEIPT\n';
  receipt += '--------------------------------\n';
  receipt += `Date: ${new Date().toLocaleString()}\n`;
  receipt += '--------------------------------\n';
  receipt += BOLD_OFF + ALIGN_LEFT;
  
  // Print items
  items.forEach(item => {
    receipt += generateItemReceipt(item);
  });
  
  // Print total
  receipt += '--------------------------------\n';
  receipt += BOLD_ON;
  receipt += `TOTAL: ${formatPrice(total)}\n`;
  receipt += BOLD_OFF;
  receipt += '--------------------------------\n';
  receipt += 'Thank you for your purchase!\n';
  
  // Cut paper
  receipt += CUT_PAPER;
  
  return receipt;
};

// Print endpoint
app.post('/api/print', async (req, res) => {
  try {
    const { items, total } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid items data' });
    }

    // Get list of available USB devices
    const devices = escposUSB.USB.findPrinter();
    console.log('Available printers:', devices);

    if (!devices.length) {
      throw new Error('No printer found. Please make sure the printer is connected.');
    }

    // Get the first available printer (you can modify this based on your specific setup)
    const printer = new escposUSB.USB(devices[0]);
    
    // Create an escpos Printer instance
    const escposPrinter = new escpos.Printer(printer);

    // Generate receipt
    const receipt = generateCartReceipt(items, total);

    // Print receipt
    printer.open((err) => {
      if (err) {
        console.error('Error opening printer:', err);
        return res.status(500).json({ error: 'Failed to open printer', details: err.message });
      }

      escposPrinter
        .text(receipt)
        .cut()
        .close();

      res.json({ success: true, message: 'Receipt printed successfully' });
    });
  } catch (error) {
    console.error('Print error:', error);
    res.status(500).json({ error: 'Failed to print receipt', details: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
