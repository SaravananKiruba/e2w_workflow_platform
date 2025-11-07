import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { prisma } from '@/lib/prisma';
import { PDFGenerationService, InvoicePDFData, TenantSettings } from '@/lib/services/pdf-generation-service';

/**
 * POST /api/modules/Invoices/export-pdf
 * 
 * Generate and download invoice as PDF with Indian GST compliance
 * 
 * Body: { invoiceId: string }
 * Returns: PDF file
 */
export async function POST(req: NextRequest) {
  const context = await getTenantContext();
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { invoiceId } = await req.json();

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    // Fetch invoice record
    const invoiceRecord = await prisma.dynamicRecord.findFirst({
      where: {
        id: invoiceId,
        tenantId: context.tenantId,
        moduleName: 'Invoices',
        status: 'active',
      },
    });

    if (!invoiceRecord) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const invoiceData = JSON.parse(invoiceRecord.data);

    // Fetch tenant settings
    const tenant = await prisma.tenant.findUnique({
      where: { id: context.tenantId },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Parse tenant settings with safe defaults
    let parsedSettings: any = {};
    try {
      if (tenant.settings) {
        parsedSettings = JSON.parse(tenant.settings);
      }
    } catch (e) {
      console.warn('Failed to parse tenant settings:', e);
    }

    const tenantSettings: TenantSettings = {
      companyName: tenant.name,
      companyAddress: parsedSettings.address || undefined,
      companyPhone: parsedSettings.phone || undefined,
      companyEmail: parsedSettings.email || undefined,
      companyGSTIN: parsedSettings.gstin || undefined,
      companyPAN: parsedSettings.pan || undefined,
      bankName: parsedSettings.bankName || undefined,
      accountNumber: parsedSettings.accountNumber || undefined,
      ifscCode: parsedSettings.ifscCode || undefined,
      branchName: parsedSettings.branchName || undefined,
    };

    // Prepare invoice data for PDF
    const pdfData: InvoicePDFData = {
      // Invoice specific fields
      invoiceNumber: invoiceData.invoiceNumber || 'N/A',
      invoiceDate: invoiceData.invoiceDate || new Date().toISOString(),
      dueDate: invoiceData.dueDate || invoiceData.invoiceDate || new Date().toISOString(),
      orderNumber: invoiceData.orderNumber || invoiceData.orderReference,
      paymentStatus: invoiceData.paymentStatus || invoiceData.status || 'Pending',
      
      // Quote data fields (inherited from QuotationPDFData)
      quotationNumber: invoiceData.quotationNumber || '',
      quotationDate: invoiceData.quotationDate || invoiceData.invoiceDate || new Date().toISOString(),
      validUntil: invoiceData.validUntil || invoiceData.dueDate || new Date().toISOString(),
      
      // Client details
      clientName: invoiceData.clientName || 'N/A',
      clientEmail: invoiceData.clientEmail,
      clientPhone: invoiceData.clientPhone,
      clientAddress: invoiceData.clientAddress,
      clientGSTIN: invoiceData.clientGSTIN || invoiceData.gstin,
      
      // Line items
      items: invoiceData.items || [],
      
      // Pricing
      subtotal: parseFloat(invoiceData.subtotal) || 0,
      discountAmount: parseFloat(invoiceData.discountAmount) || 0,
      
      // GST details
      gstPercentage: parseFloat(invoiceData.gstPercentage) || 0,
      gstType: invoiceData.gstType,
      cgstPercentage: parseFloat(invoiceData.cgstPercentage) || 0,
      sgstPercentage: parseFloat(invoiceData.sgstPercentage) || 0,
      igstPercentage: parseFloat(invoiceData.igstPercentage) || 0,
      cgstAmount: parseFloat(invoiceData.cgstAmount) || 0,
      sgstAmount: parseFloat(invoiceData.sgstAmount) || 0,
      igstAmount: parseFloat(invoiceData.igstAmount) || 0,
      totalGSTAmount: parseFloat(invoiceData.totalGSTAmount) || 0,
      totalAmount: parseFloat(invoiceData.totalAmount) || 0,
      
      // Bank details (override tenant settings if invoice has specific bank details)
      bankName: invoiceData.bankName || parsedSettings.bankName,
      accountNumber: invoiceData.accountNumber || parsedSettings.accountNumber,
      ifscCode: invoiceData.ifscCode || parsedSettings.ifscCode,
      branchName: invoiceData.branchName || parsedSettings.branchName,
      
      // Additional info
      notes: invoiceData.notes || invoiceData.description,
      termsAndConditions: invoiceData.termsAndConditions || 'Payment is due as per the due date mentioned above. Late payments may attract interest charges. All disputes are subject to [City] jurisdiction only.',
    };

    // Generate PDF
    const pdfBuffer = await PDFGenerationService.generateInvoicePDF(pdfData, tenantSettings);

    // Generate filename
    const filename = PDFGenerationService.generateFilename(
      'invoice',
      invoiceData.invoiceNumber || invoiceId
    );

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        userId: context.userId,
        action: 'export_pdf',
        entity: 'Invoices',
        entityId: invoiceId,
        metadata: JSON.stringify({
          invoiceNumber: invoiceData.invoiceNumber,
          filename,
          paymentStatus: invoiceData.paymentStatus,
        }),
      },
    });

    // Return PDF (convert Buffer to Uint8Array for Next.js compatibility)
    const uint8Array = new Uint8Array(pdfBuffer);
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Error generating invoice PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
