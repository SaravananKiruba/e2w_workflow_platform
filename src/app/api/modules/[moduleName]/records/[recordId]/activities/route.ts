import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { DynamicRecordService } from '@/lib/modules/dynamic-record-service';

export async function GET(
  req: NextRequest,
  { params }: { params: { moduleName: string; recordId: string } }
) {
  const context = await getTenantContext();
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const activities = await DynamicRecordService.getRecordActivities(
      context.tenantId,
      params.moduleName,
      params.recordId
    );

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { moduleName: string; recordId: string } }
) {
  const context = await getTenantContext();
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    
    const activity = await DynamicRecordService.createRecordActivity(
      context.tenantId,
      params.moduleName,
      params.recordId,
      {
        activityType: body.type || body.activityType,
        title: body.title,
        description: body.description,
        metadata: body.metadata,
        createdBy: context.userId,
      }
    );

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}
