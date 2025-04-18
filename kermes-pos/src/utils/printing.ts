import { CartItem } from '../types';

export const printReceipt = (cartItems: CartItem[], total: number): void => {
  const receiptContent = `
    Kermes POS Receipt
    -----------------
    ${cartItems.map(item => `
      ${item.product.name} x${item.quantity}
      ${(item.product.price * item.quantity).toFixed(2)}€
    `).join('\n')}
    -----------------
    Total: ${total.toFixed(2)}€
    -----------------
    Thank you for your purchase!
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    const content = `
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { 
              font-family: monospace;
              padding: 20px;
              max-width: 300px;
              margin: 0 auto;
            }
            pre { 
              white-space: pre-wrap;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <pre>${receiptContent}</pre>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.onload = function() {
      printWindow.print();
      printWindow.close();
    };
  }
};