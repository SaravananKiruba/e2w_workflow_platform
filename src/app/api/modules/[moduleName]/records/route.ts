import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { DynamicRecordService } from '@/lib/modules/dynamic-record-service';
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

    let records;
    if (search) {
      records = await DynamicRecordService.searchRecords(
        context.tenantId,
        params.moduleName,
        search,
        ['name', 'email', 'phone'] // Default search fields
      );
    } else {
      records = await DynamicRecordService.getRecords(
        context.tenantId,
        params.moduleName
      );
    }

    return NextResponse.json({ records });
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

    const record = await DynamicRecordService.createRecord(
      context.tenantId,
      params.moduleName,
      body,
      context.userId
    );

    return NextResponse.json({ record }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating record:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
