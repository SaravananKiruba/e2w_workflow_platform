import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { prisma } from '@/lib/prisma';
import { ConversionService } from '@/lib/services/conversion-service';

export async function POST(req: NextRequest) {
  const context = await getTenantContext();
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { quotationId } = body;

    if (!quotationId) {
      return NextResponse.json(
        { error: 'quotationId is required' },
        { status: 400 }
      );
    }

    // Fetch the Quotation record
    const quotationRecord = await prisma.dynamicRecord.findUnique({
      where: { id: quotationId },
    });

    if (!quotationRecord) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }

    if (quotationRecord.tenantId !== context.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const quotationData = JSON.parse(quotationRecord.data);

    // Check if already converted
    if (quotationData.status === 'Converted') {
      return NextResponse.json(
        { error: 'Quotation already converted to order' },
        { status: 400 }
      );
    }

    // Convert Quotation to Order
    const result = await ConversionService.convertQuotationToOrder(
      context.tenantId,
      quotationId,
      quotationData,
      context.userId
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in quotation conversion:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Conversion failed' },
      { status: 500 }
    );
  }
}
