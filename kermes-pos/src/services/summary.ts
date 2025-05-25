import { CartItem } from '../types';
import { jsPDF } from 'jspdf';

export interface SummarySigner {
  name: string;
  surname: string;
}

export interface SummaryOptions {
  transactions: any[]; // Accepts array of CartTransaction
  signers: SummarySigner[];
  currency?: string;
  kursName?: string;
  date?: string;
}

/**
 * Generates a professional summary PDF for the kermes cart from a transactions array.
 * @param options SummaryOptions
 */
export function generateSummaryPDF(options: SummaryOptions): void {
  let { transactions, signers, kursName = 'Münih Fatih Kermes', date = new Date().toLocaleDateString(), currency = '€' } = options;

  // Aggregate all sold items and total from transactions, grouped by product category
  const groupMap = new Map<string, { groupName: string, items: CartItem[] }>();
  let total = 0;
  transactions.forEach(tx => {
    try {
      const items = JSON.parse(tx.items_data);
      items.forEach((item: any) => {
        if (item?.product?.id) {
          const category = item.product.category || 'Diğer';
          if (!groupMap.has(category)) {
            groupMap.set(category, { groupName: category, items: [] });
          }
          // Find or add item in group
          const groupObj = groupMap.get(category)!;
          let cartItem = groupObj.items.find(ci => ci.product.id === item.product.id);
          if (!cartItem) {
            cartItem = { product: item.product, quantity: 0 };
            groupObj.items.push(cartItem);
          }
          cartItem.quantity += item.quantity || 0;
          total += (item.quantity || 0) * item.product.price;
        }
      });
    } catch {}
  });

  const doc = new jsPDF();

  // Header
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text('TUTANAK', 105, 18, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  // Center and wrap the header text
  kursName = kursName.split(' ').slice(0, 2).join(' ');
  const headerText = `${date} Tarihinde yapılan kermeste aşağıdaki tabloda belirtilen şekilde ${kursName} okul-aile birliğine gelir elde edilmiştir.`;
  const headerText2 = `${date} Tarihinde - ${kursName} - etkinliginde asagidaki tabloda belirtilen sekilde gelir elde edilmistir.`;
  const headerLines = doc.splitTextToSize(headerText2, 180);
  headerLines.forEach((line: string, i: number) => {
    doc.text(line, 105, 30 + i * 5, { align: 'center' });
  });

  // Table layout (smaller)
  const tableTop = 37 + (headerLines.length - 1) * 5;
  const rowHeight = 5;
  const colWidths = [48, 18, 18, 22];
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const tableLeft = 105 - tableWidth / 2;

  let y = tableTop;
  let currentPageHeight = y; // Track current height for pagination
  const pageHeightThreshold = 270; // jsPDF default page height is ~297mm, leave margin
  doc.setFontSize(8);

  // For each group
  Array.from(groupMap.values()).forEach((groupObj, groupIdx) => {
    // Add a bit of space before each group header except the first
    if (groupIdx > 0) {
      y += 1;
      currentPageHeight += 1;
    }
    // Sort items in the group alphabetically by product name
    groupObj.items.sort((a, b) => a.product.name.localeCompare(b.product.name, 'tr'));
    // Group header
    doc.setFont('times', 'bold');
    doc.text(groupObj.groupName.toLocaleUpperCase(), tableLeft + tableWidth / 2, y + 3, { align: 'center' });
    doc.setFont('times', 'normal');
    y += rowHeight;
    currentPageHeight += rowHeight;
    // Table header
    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.rect(tableLeft, y, tableWidth, rowHeight, 'S');
    doc.text('Gelir adi', tableLeft + colWidths[0] / 2, y + 3.5, { align: 'center' });
    doc.text('Adet', tableLeft + colWidths[0] + colWidths[1] / 2, y + 3.5, { align: 'center' });
    doc.text('Fiyat', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] / 2, y + 3.5, { align: 'center' });
    doc.text('Toplam', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] / 2, y + 3.5, { align: 'center' });
    // Draw vertical lines for header row only
    let x = tableLeft;
    for (let i = 0; i <= colWidths.length; i++) {
      doc.line(x, y, x, y + rowHeight);
      x += colWidths[i] || 0;
    }
    // Table rows for this group
    let groupTotal = 0;
    groupObj.items.forEach(item => {
      // Check if adding a new row would exceed the page height
      if (currentPageHeight + rowHeight > pageHeightThreshold) {
        doc.addPage();
        y = 20; // Reset y for new page (top margin)
        currentPageHeight = y;
        // Redraw table header and vertical lines on new page
        doc.setDrawColor(0);
        doc.setLineWidth(0.2);
        doc.rect(tableLeft, y, tableWidth, rowHeight, 'S');
        doc.text('Gelir adi', tableLeft + colWidths[0] / 2, y + 3.5, { align: 'center' });
        doc.text('Adet', tableLeft + colWidths[0] + colWidths[1] / 2, y + 3.5, { align: 'center' });
        doc.text('Fiyat', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] / 2, y + 3.5, { align: 'center' });
        doc.text('Toplam', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] / 2, y + 3.5, { align: 'center' });
        // Draw vertical lines for this header row only
        let x2 = tableLeft;
        for (let i = 0; i <= colWidths.length; i++) {
          doc.line(x2, y, x2, y + rowHeight);
          x2 += colWidths[i] || 0;
        }
        y += rowHeight;
        currentPageHeight += rowHeight;
      }
      y += rowHeight;
      currentPageHeight += rowHeight;
      doc.rect(tableLeft, y, tableWidth, rowHeight, 'S');
      doc.text(item.product.name, tableLeft + colWidths[0] / 2, y + 3.5, { align: 'center' });
      doc.text(String(item.quantity), tableLeft + colWidths[0] + colWidths[1] / 2, y + 3.5, { align: 'center' });
      doc.text(item.product.price.toFixed(2) + currency, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] / 2, y + 3.5, { align: 'center' });
      doc.text((item.quantity * item.product.price).toFixed(2) + currency, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] / 2, y + 3.5, { align: 'center' });
      // Draw vertical lines for this row only
      let x2 = tableLeft;
      for (let i = 0; i <= colWidths.length; i++) {
        doc.line(x2, y, x2, y + rowHeight);
        x2 += colWidths[i] || 0;
      }
      groupTotal += item.quantity * item.product.price;
    });
    // Group total row
    doc.setFont('times', 'bold');
    y += rowHeight;
    currentPageHeight += rowHeight;
    doc.rect(tableLeft, y, tableWidth, rowHeight, 'S');
    doc.text('Grup toplam', tableLeft + colWidths[0] / 2, y + 3.5, { align: 'center' });
    doc.text(groupTotal.toFixed(2) + currency, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] / 2, y + 3.5, { align: 'center' });
    doc.setFont('times', 'normal');
    y += rowHeight;
    currentPageHeight += rowHeight;
  });

  // Overall total row
  doc.setFont('times', 'bold');
  doc.text('Genel toplam', tableLeft + colWidths[0] / 2, y + 3.5, { align: 'center' });
  doc.text(total.toFixed(2) + currency, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] / 2, y + 3.5, { align: 'center' });
  doc.setFont('times', 'normal');
  y += rowHeight * 2;

  // Summary text (centered)
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  const summaryText = `Genel toplamda ${total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}${currency} gelir elde edilmiş olup ve okul aile birliği hesabına yatırılmıştır.\nİş bu tutanak tarafımızca imza altına alınmıştır.`;
  const summaryText2 = `Genel toplamda ${total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}${currency} gelir elde edilmis olup,\nIs bu tutanak tarafimizca imza altina alinmistir.`;
  const summaryLines = doc.splitTextToSize(summaryText2, 180);
  summaryLines.forEach((line: string, i: number) => {
    doc.text(line, 105, y + 6 + i * 5, { align: 'center' });
  });

  // Signature fields (centered below)
  const sigY = y + 30;
  const sigWidth = 40;
  const sigSpacing = 10;
  const sigStartX = 105 - ((signers.length * sigWidth + (signers.length - 1) * sigSpacing) / 2);
  signers.forEach((signer, i) => {
    const x = sigStartX + i * (sigWidth + sigSpacing);
    doc.line(x, sigY, x + sigWidth, sigY); // signature line
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.text(signer.name + ' ' + signer.surname, x + sigWidth / 2, sigY + 5, { align: 'center' });
    doc.setFontSize(10);
    if (i === 0) {
      doc.text('Teslim alan', x + sigWidth / 2, sigY + 10, { align: 'center' });
    } else {
      doc.text('Teslim eden', x + sigWidth / 2, sigY + 10, { align: 'center' });
    }
    doc.setFontSize(12); // Reset to default for next loop/section 
  });

  // Download in browser
  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kermes-summary-${date.replace(/\//g, '-')}.pdf`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    return;
  }
  // Fallback: Node.js or other env, just return the jsPDF instance
  // return doc;
}
