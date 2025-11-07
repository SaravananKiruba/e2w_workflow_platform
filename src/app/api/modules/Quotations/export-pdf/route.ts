import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { prisma } from '@/lib/prisma';
import { PDFGenerationService, QuotationPDFData, TenantSettings } from '@/lib/services/pdf-generation-service';

/**
 * POST /api/modules/Quotations/export-pdf
 * 
 * Generate and download quotation as PDF
 * 
 * Body: { quotationId: string }
 * Returns: PDF file
 */
export async function POST(req: NextRequest) {
  const context = await getTenantContext();
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { quotationId } = await req.json();

    if (!quotationId) {
      return NextResponse.json(
        { error: 'Quotation ID is required' },
        { status: 400 }
      );
    }

    // Fetch quotation record
    const quotationRecord = await prisma.dynamicRecord.findFirst({
      where: {
        id: quotationId,
        tenantId: context.tenantId,
        moduleName: 'Quotations',
        status: 'active',
      },
    });

    if (!quotationRecord) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }

    const quotationData = JSON.parse(quotationRecord.data);

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

    // Prepare quotation data for PDF
    const pdfData: QuotationPDFData = {
      quotationNumber: quotationData.quotationNumber || 'N/A',
      quotationDate: quotationData.quotationDate || new Date().toISOString(),
      validUntil: quotationData.validUntil || quotationData.validFrom || new Date().toISOString(),
      
      clientName: quotationData.clientName || 'N/A',
      clientEmail: quotationData.clientEmail,
      clientPhone: quotationData.clientPhone,
      clientAddress: quotationData.clientAddress,
      clientGSTIN: quotationData.clientGSTIN || quotationData.gstin,
      
      items: quotationData.items || [],
      
      subtotal: parseFloat(quotationData.subtotal) || 0,
      discountAmount: parseFloat(quotationData.discountAmount) || 0,
      
      gstPercentage: parseFloat(quotationData.gstPercentage) || 0,
      gstType: quotationData.gstType,
      cgstPercentage: parseFloat(quotationData.cgstPercentage) || 0,
      sgstPercentage: parseFloat(quotationData.sgstPercentage) || 0,
      igstPercentage: parseFloat(quotationData.igstPercentage) || 0,
      cgstAmount: parseFloat(quotationData.cgstAmount) || 0,
      sgstAmount: parseFloat(quotationData.sgstAmount) || 0,
      igstAmount: parseFloat(quotationData.igstAmount) || 0,
      totalGSTAmount: parseFloat(quotationData.totalGSTAmount) || 0,
      totalAmount: parseFloat(quotationData.totalAmount) || 0,
      
      notes: quotationData.notes || quotationData.description,
      termsAndConditions: 'Payment is due within 30 days. Prices are valid for 30 days from quotation date. All prices are in Indian Rupees (INR).',
    };

    // Generate PDF
    const pdfBuffer = await PDFGenerationService.generateQuotationPDF(pdfData, tenantSettings);

    // Generate filename
    const filename = PDFGenerationService.generateFilename(
      'quotation',
      quotationData.quotationNumber || quotationId
    );

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        userId: context.userId,
        action: 'export_pdf',
        entity: 'Quotations',
        entityId: quotationId,
        metadata: JSON.stringify({
          quotationNumber: quotationData.quotationNumber,
          filename,
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
    console.error('Error generating quotation PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
