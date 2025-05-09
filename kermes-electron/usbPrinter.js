import usb from 'usb';
import EventEmitter from 'events';
import wmi from 'node-wmi';
import colorLogger from './util/colorLogger.js';

/**
 * USBPrinter class provides functionality to interact with USB printers.
 * It allows opening, closing, writing data, and sending commands to the printer.
 * Additionally, it provides static methods to list available printers and USB devices.
 * 
 * @class USBPrinter
 * @extends EventEmitter
 * 
 * @example
 * const printer = new USBPrinter(vendorId, productId);
 * printer.open();
 * printer.printText("Hello, World!");
 * printer.cut();
 * printer.close();
 * 
 * @param {number} vendorId - The USB vendor ID of the printer.
 * @param {number} productId - The USB product ID of the printer.
 * 
 * @throws {Error} If the printer is not found for the given vendorId and productId.
 * 
 * 
 */
class USBPrinter extends EventEmitter {
  constructor(vendorId, productId) {
    super();
    this.device = usb.findByIds(vendorId, productId);
    if (!this.device) {
       throw new Error(`Printer not found for Vendor ID: ${vendorId}, Product ID: ${productId}`);
    }
  }

  open() {
    try {
      this.device.open();
      this.interface = this.device.interfaces[0];
      if (!this.interface) {
        throw new Error('No interface found on the device');
      }
      this.interface.claim();
      this.endpoint = this.interface.endpoints[0];
      this.emit('open');
    } catch (error) {
      console.error('Error opening USB device:', error);
      throw error; // Re-throw the error to handle it in the calling code
    }
  }

  close() {
    try {
      if (this.interface) {
        this.interface.release(true, () => {
          this.device.close();
          this.emit('close');
        });
      } else {
        console.warn('No interface to release');
        this.device.close();
        this.emit('close');
      }
    } catch (error) {
      console.error('Error closing USB device:', error);
    }
  }

  write(data) {
    try {
      this.endpoint.transfer(data, (err) => {
        if (err) {
          this.emit('error', err);
        }
      });
    } catch (error) {
      console.error('Error writing to USB device:', error);
      this.emit('error', error);
    }
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

  static async getPrinters() {
    try {
      const printers = await new Promise((resolve, reject) => {
        wmi.Query({
          class: 'Win32_Printer',
        }, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      return printers.map((printer) => ({
        name: printer.Name,
        portName: printer.PortName,
        driverName: printer.DriverName,
        status: printer.PrinterStatus,
      }));
    } catch (error) {
      console.error('Failed to query printers using WMI:', error);
      return [];
    }
  }

  static async listDevices() {
    const devices = usb.getDeviceList();
    const detailedDevices = await Promise.all(
      devices.map(async (device) => {
        const descriptor = device.deviceDescriptor;
        let manufacturer = null;
        let product = null;
  
        try {
          manufacturer = await new Promise((resolve) => {
            device.getStringDescriptor(descriptor.iManufacturer, (err, data) => {
              resolve(err ? null : data);
            });
          });
        } catch (error) {
          console.error(`Failed to get manufacturer for device ${descriptor.idVendor}:${descriptor.idProduct}`, error);
        }
  
        try {
          product = await new Promise((resolve) => {
            device.getStringDescriptor(descriptor.iProduct, (err, data) => {
              resolve(err ? null : data);
            });
          });
        } catch (error) {
          console.error(`Failed to get product for device ${descriptor.idVendor}:${descriptor.idProduct}`, error);
        }
  
        return {
          vendorId: descriptor.idVendor,
          productId: descriptor.idProduct,
          manufacturer: manufacturer || `Vendor ${descriptor.idVendor}`,
          product: product || `Product ${descriptor.idProduct}`,
        };
      })
    );
    return detailedDevices;
  }

  static async mapPrinterToUSBDevice(printerName) {
    const printers = await USBPrinter.getPrinters();
    const usbDevices = await USBPrinter.listDevices();

    const printer = printers.find((p) => p.name === printerName);
    if (!printer) {
      console.error(`Printer not found: ${printerName}`);
      return null;
    }

    const matchedDevice = usbDevices.find((device) => {
      return printer.portName.toLowerCase().includes('usb');
    });

    if (!matchedDevice) {
      colorLogger.error(`No USB device found for printer: ${printerName}`);
      return null;
    }
    console.log(`Matched USB device for printer ${printerName}:`, matchedDevice);
    return matchedDevice;
  }
}

export default USBPrinter;