const usb = require('usb');
const EventEmitter = require('events');

class USBPrinter extends EventEmitter {
  constructor(vendorId, productId) {
    super();
    usb.
    this.device = usb.findByIds(vendorId, productId);
    if (!this.device) {
      throw new Error('Printer not found');
    }
  }

  open() {
    this.device.open();
    this.interface = this.device.interfaces[0];
    this.interface.claim();
    this.endpoint = this.interface.endpoints[0];
    this.emit('open');
  }

  close() {
    this.interface.release(true, () => {
      this.device.close();
      this.emit('close');
    });
  }

  write(data) {
    this.endpoint.transfer(data, (err) => {
      if (err) {
        this.emit('error', err);
      }
    });
  }

  cut() {
    const CUT_COMMAND = Buffer.from([0x1D, 0x56, 0x00]); // Full cut
    this.write(CUT_COMMAND);
  }

  printText(text) {
    const encodedText = Buffer.from(text + '\n', 'ascii');
    this.write(encodedText);
  }

  align(alignType) {
    const ALIGN_COMMANDS = {
      left: Buffer.from([0x1B, 0x61, 0x00]),
      center: Buffer.from([0x1B, 0x61, 0x01]),
      right: Buffer.from([0x1B, 0x61, 0x02]),
    };
    this.write(ALIGN_COMMANDS[alignType]);
  }
}

module.exports = USBPrinter;