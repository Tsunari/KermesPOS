import { CartItem } from '../types/index';

export const printReceipt = (cartItems: CartItem[], total: number): void => {
  // Group items by category
  const groupedItems = cartItems.reduce((groups, item) => {
    const category = item.product.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, CartItem[]>);

  // Define the order of categories
  const categoryOrder = ['food', 'drink', 'dessert', 'Other'];

  // Generate receipt content with categories
  let receiptContent = `
    KERMES POS RECEIPT
    =================
    Date: ${new Date().toLocaleString()}
    =================
  `;

  // Add items by category
  categoryOrder.forEach(category => {
    if (groupedItems[category] && groupedItems[category].length > 0) {
      receiptContent += `
    ${category.toUpperCase()}
    ${'-'.repeat(category.length)}
      `;
      
      groupedItems[category].forEach(item => {
        receiptContent += `
    ${item.product.name}
      ${item.quantity} x ${item.product.price.toFixed(2).replace('.', ',')}€ = ${(item.product.price * item.quantity).toFixed(2).replace('.', ',')}€
      `;
      });
      
      receiptContent += `
    ${'-'.repeat(20)}
      `;
    }
  });

  // Add total
  receiptContent += `
    TOTAL: ${total.toFixed(2).replace('.', ',')}€
    =================
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
              font-size: 12px;
              line-height: 1.4;
            }
            .header {
              font-weight: bold;
              text-align: center;
              margin-bottom: 10px;
            }
            .category {
              font-weight: bold;
              margin-top: 10px;
            }
            .item {
              margin-left: 10px;
            }
            .total {
              font-weight: bold;
              text-align: right;
              margin-top: 10px;
            }
            .footer {
              text-align: center;
              margin-top: 10px;
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

export const printWithPrinter = (cartItems: CartItem[], total: number): void => {
  // Get printer settings from localStorage or use defaults
  const printerSettings = JSON.parse(localStorage.getItem('printerSettings') || '{}');
  const paperWidth = printerSettings.paperWidth || 80;
  const fontSize = printerSettings.fontSize || 12;
  const boldText = printerSettings.boldText || false;
  const selectedPrinter = printerSettings.selectedPrinter || '';

  // Group items by category
  const groupedItems = cartItems.reduce((groups, item) => {
    const category = item.product.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, CartItem[]>);

  // Define the order of categories
  const categoryOrder = ['food', 'drink', 'dessert', 'Other'];

  // Generate receipt content with categories
  let receiptContent = `
    KERMES POS RECEIPT
    =================
    Date: ${new Date().toLocaleString()}
    =================
  `;

  // Add items by category
  categoryOrder.forEach(category => {
    if (groupedItems[category] && groupedItems[category].length > 0) {
      receiptContent += `
    ${category.toUpperCase()}
    ${'-'.repeat(category.length)}
      `;
      
      groupedItems[category].forEach(item => {
        receiptContent += `
    ${item.product.name}
      ${item.quantity} x ${item.product.price.toFixed(2).replace('.', ',')}€ = ${(item.product.price * item.quantity).toFixed(2).replace('.', ',')}€
      `;
      });
      
      receiptContent += `
    ${'-'.repeat(20)}
      `;
    }
  });

  // Add total
  receiptContent += `
    TOTAL: ${total.toFixed(2).replace('.', ',')}€
    =================
    Thank you for your purchase!
  `;

  // Create a hidden iframe for printing
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  
  const iframeDoc = iframe.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            @page {
              size: ${paperWidth}mm auto;
              margin: 0;
            }
            body { 
              font-family: monospace;
              padding: 10px;
              width: ${paperWidth}mm;
              margin: 0 auto;
              font-size: ${fontSize}px;
              line-height: 1.4;
            }
            pre { 
              white-space: pre-wrap;
              margin: 0;
            }
            .header {
              font-weight: ${boldText ? 'bold' : 'normal'};
              text-align: center;
              margin-bottom: 10px;
            }
            .category {
              font-weight: ${boldText ? 'bold' : 'normal'};
              margin-top: 10px;
            }
            .item {
              margin-left: 10px;
            }
            .total {
              font-weight: ${boldText ? 'bold' : 'normal'};
              text-align: right;
              margin-top: 10px;
            }
            .footer {
              text-align: center;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <pre>${receiptContent}</pre>
        </body>
      </html>
    `);
    iframeDoc.close();
    
    // Wait for content to load
    setTimeout(() => {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }
      
      // Remove iframe after printing
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  }
};