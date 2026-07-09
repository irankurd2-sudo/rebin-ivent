import { FileText, Download, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import { Sale, Settings } from '../types';
import { formatDateWithSettings } from '../utils/dateFormat';

interface InvoiceGeneratorProps {
  sale: Sale;
  settings: Settings;
  onClose: () => void;
}

export function InvoiceGenerator({ sale, settings, onClose }: InvoiceGeneratorProps) {
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.companyName || 'Invoice', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (settings.companyAddress) {
      doc.text(settings.companyAddress, pageWidth / 2, 28, { align: 'center' });
    }
    if (settings.companyPhone) {
      doc.text(`Phone: ${settings.companyPhone}`, pageWidth / 2, 34, { align: 'center' });
    }
    if (settings.companyEmail) {
      doc.text(`Email: ${settings.companyEmail}`, pageWidth / 2, 40, { align: 'center' });
    }

    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(20, 45, pageWidth - 20, 45);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 20, 55);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${sale.id.substring(0, 8).toUpperCase()}`, 20, 65);
    doc.text(`Date: ${formatDateWithSettings(sale.date, settings.dateFormat)}`, 20, 72);
    doc.text(`Payment Method: ${sale.paymentMethod.toUpperCase()}`, 20, 79);

    if (sale.customerName) {
      doc.setFont('helvetica', 'bold');
      doc.text('Bill To:', 20, 90);
      doc.setFont('helvetica', 'normal');
      doc.text(sale.customerName, 20, 97);
    }

    if (sale.sellerName) {
      doc.setFont('helvetica', 'bold');
      doc.text('Sold By:', pageWidth - 70, 90);
      doc.setFont('helvetica', 'normal');
      doc.text(sale.sellerName, pageWidth - 70, 97);
    }

    const tableStartY = sale.customerName || sale.sellerName ? 110 : 90;

    doc.setFillColor(240, 240, 240);
    doc.rect(20, tableStartY, pageWidth - 40, 10, 'F');

    doc.setFont('helvetica', 'bold');
    doc.text('Product', 25, tableStartY + 7);
    doc.text('Qty', pageWidth - 100, tableStartY + 7);
    doc.text('Price', pageWidth - 75, tableStartY + 7);
    doc.text('Discount', pageWidth - 50, tableStartY + 7);
    doc.text('Total', pageWidth - 25, tableStartY + 7, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    const rowY = tableStartY + 17;
    doc.text(sale.productName, 25, rowY);
    doc.text(sale.quantity.toString(), pageWidth - 100, rowY);

    const currencySymbol = 'IQD';
    const displayPrice = (sale.unitPrice * settings.usdToIqdRate).toFixed(0);
    const displayDiscount = (sale.discount * settings.usdToIqdRate).toFixed(0);

    doc.text(`${currencySymbol}${displayPrice}`, pageWidth - 75, rowY);
    doc.text(`${currencySymbol}${displayDiscount}`, pageWidth - 50, rowY);

    doc.line(20, rowY + 5, pageWidth - 20, rowY + 5);

    const subtotal = sale.unitPrice * sale.quantity;
    const displaySubtotal = (subtotal * settings.usdToIqdRate).toFixed(0);
    const displayTax = (sale.tax * settings.usdToIqdRate).toFixed(0);
    const displayTotal = (sale.total * settings.usdToIqdRate).toFixed(0);

    const summaryY = rowY + 15;
    doc.text('Subtotal:', pageWidth - 80, summaryY);
    doc.text(`${currencySymbol}${displaySubtotal}`, pageWidth - 25, summaryY, { align: 'right' });

    doc.text('Discount:', pageWidth - 80, summaryY + 7);
    doc.text(`-${currencySymbol}${displayDiscount}`, pageWidth - 25, summaryY + 7, { align: 'right' });

    doc.text('Tax:', pageWidth - 80, summaryY + 14);
    doc.text(`${currencySymbol}${displayTax}`, pageWidth - 25, summaryY + 14, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total:', pageWidth - 80, summaryY + 24);
    doc.text(`${currencySymbol}${displayTotal}`, pageWidth - 25, summaryY + 24, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for your business!', pageWidth / 2, summaryY + 40, { align: 'center' });

    return doc;
  };

  const handleDownload = () => {
    const doc = generatePDF();
    doc.save(`invoice-${sale.id.substring(0, 8)}.pdf`);
  };

  const handlePrint = () => {
    const doc = generatePDF();
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfUrl);
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleReceipt = () => {
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) return;

    const currencySymbol = 'IQD';
    const displayPrice = (sale.unitPrice * settings.usdToIqdRate).toFixed(0);
    const displayDiscount = (sale.discount * settings.usdToIqdRate).toFixed(0);
    const displayTax = (sale.tax * settings.usdToIqdRate).toFixed(0);
    const displayTotal = (sale.total * settings.usdToIqdRate).toFixed(0);

    receiptWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt</title>
        <style>
          @media print {
            @page { margin: 0; size: 80mm auto; }
            body { margin: 0; }
          }
          body {
            font-family: 'Courier New', monospace;
            width: 80mm;
            margin: 0 auto;
            padding: 10mm;
            font-size: 12px;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-top: 1px dashed #000; margin: 5px 0; }
          .row { display: flex; justify-content: space-between; margin: 3px 0; }
          .total { font-size: 14px; margin-top: 10px; }
          h1 { font-size: 16px; margin: 5px 0; }
          h2 { font-size: 14px; margin: 5px 0; }
        </style>
      </head>
      <body>
        <div class="center">
          <h1 class="bold">${settings.companyName || 'RECEIPT'}</h1>
          ${settings.companyAddress ? `<div>${settings.companyAddress}</div>` : ''}
          ${settings.companyPhone ? `<div>Tel: ${settings.companyPhone}</div>` : ''}
        </div>
        <div class="line"></div>
        <div class="row">
          <span>Receipt #:</span>
          <span>${sale.id.substring(0, 8).toUpperCase()}</span>
        </div>
        <div class="row">
          <span>Date:</span>
          <span>${formatDateWithSettings(sale.date, settings.dateFormat)}</span>
        </div>
        <div class="row">
          <span>Payment:</span>
          <span>${sale.paymentMethod.toUpperCase()}</span>
        </div>
        ${sale.customerName ? `
          <div class="row">
            <span>Customer:</span>
            <span>${sale.customerName}</span>
          </div>
        ` : ''}
        ${sale.sellerName ? `
          <div class="row">
            <span>Cashier:</span>
            <span>${sale.sellerName}</span>
          </div>
        ` : ''}
        <div class="line"></div>
        <div class="bold">ITEMS</div>
        <div class="line"></div>
        <div>${sale.productName}</div>
        <div class="row">
          <span>${sale.quantity} x ${currencySymbol}${displayPrice}</span>
          <span>${currencySymbol}${(sale.quantity * parseFloat(displayPrice)).toFixed(0)}</span>
        </div>
        ${sale.discount > 0 ? `
          <div class="row">
            <span>Discount:</span>
            <span>-${currencySymbol}${displayDiscount}</span>
          </div>
        ` : ''}
        ${sale.tax > 0 ? `
          <div class="row">
            <span>Tax:</span>
            <span>${currencySymbol}${displayTax}</span>
          </div>
        ` : ''}
        <div class="line"></div>
        <div class="row bold total">
          <span>TOTAL:</span>
          <span>${currencySymbol}${displayTotal}</span>
        </div>
        <div class="line"></div>
        <div class="center" style="margin-top: 10px;">
          Thank you for your business!
        </div>
      </body>
      </html>
    `);

    receiptWindow.document.close();
    setTimeout(() => {
      receiptWindow.print();
    }, 250);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Generate Invoice</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Invoice #</p>
              <p className="font-semibold">{sale.id.substring(0, 8).toUpperCase()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-semibold">{formatDateWithSettings(sale.date, settings.dateFormat)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Customer</p>
              <p className="font-semibold">{sale.customerName || 'Walk-in'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payment Method</p>
              <p className="font-semibold capitalize">{sale.paymentMethod}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">{sale.productName}</span>
              <span className="font-semibold">
                {sale.quantity} × IQD
                {(sale.unitPrice * settings.usdToIqdRate).toFixed(0)}
              </span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Discount</span>
                <span>
                  -IQD
                  {(sale.discount * settings.usdToIqdRate).toFixed(0)}
                </span>
              </div>
            )}
            {sale.tax > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax</span>
                <span>
                  IQD
                  {(sale.tax * settings.usdToIqdRate).toFixed(0)}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t mt-2 font-bold text-lg">
              <span>Total</span>
              <span className="text-blue-600">
                IQD
                {(sale.total * settings.usdToIqdRate).toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Printer className="w-5 h-5" />
            Print Invoice
          </button>
          <button
            onClick={handleReceipt}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <FileText className="w-5 h-5" />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
