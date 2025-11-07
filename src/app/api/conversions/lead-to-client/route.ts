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
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json(
        { error: 'leadId is required' },
        { status: 400 }
      );
    }

    // Fetch the Lead record
    const leadRecord = await prisma.dynamicRecord.findUnique({
      where: { id: leadId },
    });

    if (!leadRecord) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    if (leadRecord.tenantId !== context.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const leadData = JSON.parse(leadRecord.data);

    // Check if already converted
    if (leadData.status === 'Converted') {
      return NextResponse.json(
        { error: 'Lead already converted to client' },
        { status: 400 }
      );
    }

    // Convert Lead to Client
    const result = await ConversionService.convertLeadToClient(
      context.tenantId,
      leadId,
      leadData,
      context.userId
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in lead conversion:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Conversion failed' },
      { status: 500 }
    );
  }
}
