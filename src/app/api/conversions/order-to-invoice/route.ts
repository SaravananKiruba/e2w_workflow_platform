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
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId is required' },
        { status: 400 }
      );
    }

    // Fetch the Order record
    const orderRecord = await prisma.dynamicRecord.findUnique({
      where: { id: orderId },
    });

    if (!orderRecord) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (orderRecord.tenantId !== context.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const orderData = JSON.parse(orderRecord.data);

    // Check if already converted
    if (orderData.status === 'Invoiced') {
      return NextResponse.json(
        { error: 'Order already converted to invoice' },
        { status: 400 }
      );
    }

    // Convert Order to Invoice
    const result = await ConversionService.convertOrderToInvoice(
      context.tenantId,
      orderId,
      orderData,
      context.userId
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in order conversion:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Conversion failed' },
      { status: 500 }
    );
  }
}
