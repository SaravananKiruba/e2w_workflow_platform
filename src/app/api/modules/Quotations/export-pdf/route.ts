import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { DynamicRecordService } from '@/lib/modules/dynamic-record-service';

export async function POST(
  req: NextRequest,
  { params }: { params: { quotationId: string } }
) {
  const context = await getTenantContext();
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get quotation
    const quotation = await DynamicRecordService.getRecord(
      context.tenantId,
      'Quotations',
      params.quotationId
    );

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    // Generate HTML for PDF
    const html = generateQuotationHTML(quotation);

    // For now, return the HTML - in production, use a PDF library like:
    // - puppeteer: npm install puppeteer
    // - pdfkit: npm install pdfkit
    // - html2pdf: npm install html2pdf.js
    
    // This is a placeholder that returns HTML that can be printed to PDF
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="Quotation-${quotation.quotationNumber}.html"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateQuotationHTML(quotation: any): string {
  const items = quotation.items || [];
  const itemsHTML = items
    .map(
      (item: any) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.description}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.unitPrice.toFixed(2)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.tax || 0}%</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.amount.toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Quotation ${quotation.quotationNumber}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 20px;
      background: white;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border: 1px solid #e0e0e0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 30px;
      border-bottom: 2px solid #2196f3;
      padding-bottom: 20px;
    }
    .company-info h1 {
      margin: 0;
      color: #2196f3;
      font-size: 28px;
    }
    .company-info p {
      margin: 5px 0;
      color: #666;
      font-size: 12px;
    }
    .doc-info {
      text-align: right;
    }
    .doc-info h2 {
      margin: 0;
      font-size: 24px;
      color: #333;
    }
    .doc-info p {
      margin: 5px 0;
      color: #666;
      font-size: 12px;
    }
    .client-section {
      margin-bottom: 30px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }
    .client-info, .quote-info {
      padding: 15px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    .client-info h3, .quote-info h3 {
      margin: 0 0 10px 0;
      color: #2196f3;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .client-info p, .quote-info p {
      margin: 5px 0;
      font-size: 12px;
      color: #333;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background: #2196f3;
      color: white;
      padding: 12px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
    }
    .summary {
      margin-left: auto;
      width: 300px;
      margin-top: 20px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
      font-size: 12px;
    }
    .summary-row.total {
      border-bottom: 2px solid #2196f3;
      font-weight: 600;
      color: #2196f3;
      padding: 12px 0;
      font-size: 14px;
    }
    .terms {
      margin-top: 30px;
      padding: 15px;
      background: #f9f9f9;
      border-left: 4px solid #2196f3;
      font-size: 11px;
      color: #555;
      line-height: 1.6;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 10px;
      color: #999;
    }
    .status {
      display: inline-block;
      padding: 4px 8px;
      background: #e3f2fd;
      color: #1976d2;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="company-info">
        <h1>📋 QUOTATION</h1>
        <p>Easy2Work Business Solutions</p>
      </div>
      <div class="doc-info">
        <h2>${quotation.quotationNumber}</h2>
        <p><strong>Date:</strong> ${new Date(quotation.quotationDate).toLocaleDateString()}</p>
        <p><strong>Valid Until:</strong> ${new Date(quotation.validUntil).toLocaleDateString()}</p>
        <p><span class="status">${quotation.status}</span></p>
      </div>
    </div>

    <div class="client-section">
      <div class="client-info">
        <h3>Bill To</h3>
        <p><strong>${quotation.clientName}</strong></p>
        <p>${quotation.clientEmail}</p>
        <p>${quotation.clientPhone || 'N/A'}</p>
        <p>${quotation.clientAddress || 'N/A'}</p>
      </div>
      <div class="quote-info">
        <h3>Quote Details</h3>
        ${quotation.referenceNumber ? `<p><strong>Reference:</strong> ${quotation.referenceNumber}</p>` : ''}
        <p><strong>Valid From:</strong> ${new Date(quotation.validFrom).toLocaleDateString()}</p>
        <p><strong>Valid Until:</strong> ${new Date(quotation.validUntil).toLocaleDateString()}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: center; width: 80px;">Qty</th>
          <th style="text-align: right; width: 100px;">Unit Price</th>
          <th style="text-align: center; width: 60px;">Tax</th>
          <th style="text-align: right; width: 100px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>

    <div class="summary">
      <div class="summary-row">
        <span>Subtotal:</span>
        <span>₹${quotation.subtotal.toFixed(2)}</span>
      </div>
      <div class="summary-row">
        <span>Tax:</span>
        <span>₹${quotation.taxAmount.toFixed(2)}</span>
      </div>
      ${quotation.discountAmount ? `
      <div class="summary-row">
        <span>Discount:</span>
        <span>-₹${quotation.discountAmount.toFixed(2)}</span>
      </div>
      ` : ''}
      <div class="summary-row total">
        <span>Total:</span>
        <span>₹${quotation.totalAmount.toFixed(2)}</span>
      </div>
    </div>

    ${quotation.terms ? `
    <div class="terms">
      <strong>Terms & Conditions:</strong><br>
      ${quotation.terms.split('\n').join('<br>')}
    </div>
    ` : ''}

    ${quotation.description ? `
    <div class="terms">
      <strong>Description:</strong><br>
      ${quotation.description.split('\n').join('<br>')}
    </div>
    ` : ''}

    <div class="footer">
      <p>This is an automated quotation generated by Easy2Work. For inquiries, please contact our sales team.</p>
      <p>© 2025 Easy2Work. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}
