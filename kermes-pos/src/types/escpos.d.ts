declare module 'escpos' {
  export class USB {
    constructor(vendorId?: number, productId?: number);
  }

  export class Printer {
    constructor(device: any);
    font(type: string): Printer;
    align(type: string): Printer;
    style(type: string): Printer;
    size(width: number, height: number): Printer;
    text(text: string): Printer;
    cut(): Printer;
    close(): void;
  }
}

declare module 'escpos-usb' {
  import { USB } from 'escpos';
  export { USB };
}

declare module 'escpos-network' {
  import { Network } from 'escpos';
  export { Network };
} 