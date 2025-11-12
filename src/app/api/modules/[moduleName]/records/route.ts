import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { DynamicRecordService } from '@/lib/modules/dynamic-record-service';
import { AutoNumberingService } from '@/lib/services/auto-numbering-service';
import { z } from 'zod';

export async function GET(
  req: NextRequest,
  { params }: { params: { moduleName: string } }
) {
  const context = await getTenantContext();
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const filters = searchParams.get('filters');
    const sortBy = searchParams.get('sortBy') || undefined;
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    // Week 1-2: Use advanced filtering
    if (filters || search) {
      const parsedFilters = filters ? JSON.parse(filters) : [];
      const result = await DynamicRecordService.getRecordsWithFilters(
        context.tenantId,
        params.moduleName,
        {
          filters: parsedFilters,
          search: search || undefined,
          searchFields: ['name', 'email', 'phone', 'company', 'description'],
          sortBy,
          sortOrder,
          page,
          pageSize,
        }
      );
      return NextResponse.json(result);
    }

    // Legacy support: simple list
    const records = await DynamicRecordService.getRecords(
      context.tenantId,
      params.moduleName
    );

    return NextResponse.json({ records, pagination: { total: records.length } });
  } catch (error) {
    console.error('Error fetching records:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { moduleName: string } }
) {
  const context = await getTenantContext();
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Auto-generate number for modules that support it
    const modulesWithAutoNumber = ['Quotations', 'Orders', 'Invoices', 'Payments'];
    const numberFieldMap: Record<string, string> = {
      'Quotations': 'quotationNumber',
      'Orders': 'orderNumber',
      'Invoices': 'invoiceNumber',
      'Payments': 'transactionId',
    };

    if (modulesWithAutoNumber.includes(params.moduleName) && !body[numberFieldMap[params.moduleName]]) {
      const generatedNumber = await AutoNumberingService.generateNumber(
        context.tenantId,
        params.moduleName
      );
      body[numberFieldMap[params.moduleName]] = generatedNumber;
    }

    const record = await DynamicRecordService.createRecord(
      context.tenantId,
      params.moduleName,
      body,
      context.userId
    );

    // Special handling: When payment is created, mark invoice as 'Paid'
    if (params.moduleName === 'Payments' && body.invoiceId) {
      try {
        const { prisma } = await import('@/lib/prisma');
        
        // Fetch the invoice
        const invoiceRecord = await prisma.dynamicRecord.findUnique({
          where: { id: body.invoiceId },
        });

        if (invoiceRecord && invoiceRecord.tenantId === context.tenantId) {
          const invoiceData = JSON.parse(invoiceRecord.data);
          
          // Update invoice status to 'Paid'
          await prisma.dynamicRecord.update({
            where: { id: body.invoiceId },
            data: {
              data: JSON.stringify({
                ...invoiceData,
                status: 'Paid',
                paidDate: new Date().toISOString(),
                paidAmount: body.amount || body.paymentAmount,
              }),
              updatedBy: context.userId,
            },
          });

          // Audit log
          await prisma.auditLog.create({
            data: {
              tenantId: context.tenantId,
              userId: context.userId,
              action: 'payment_received',
              entity: 'Invoices',
              entityId: body.invoiceId,
              metadata: JSON.stringify({
                invoiceId: body.invoiceId,
                paymentId: record.id,
                amount: body.amount || body.paymentAmount,
                transactionId: body.transactionId,
              }),
            },
          });
        }
      } catch (error) {
        console.error('Error updating invoice status:', error);
        // Don't fail the payment creation if invoice update fails
      }
    }

    return NextResponse.json({ record }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating record:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
