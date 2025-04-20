const usb = require('usb');

console.log('Listing all USB devices:');
usb.getDeviceList().forEach(device => {
  console.log('Device:', {
    vendorId: device.deviceDescriptor.idVendor,
    productId: device.deviceDescriptor.idProduct,
    manufacturer: device.deviceDescriptor.iManufacturer,
    product: device.deviceDescriptor.iProduct
  });
}); 