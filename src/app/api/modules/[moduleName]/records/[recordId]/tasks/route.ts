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
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const assignedTo = searchParams.get('assignedTo') || undefined;

    const tasks = await DynamicRecordService.getRecordTasks(
      context.tenantId,
      params.moduleName,
      params.recordId,
      { status, assignedTo }
    );

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
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
    
    const task = await DynamicRecordService.createRecordTask(
      context.tenantId,
      params.moduleName,
      params.recordId,
      {
        title: body.title,
        description: body.description,
        taskType: body.taskType,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        dueTime: body.dueTime,
        priority: body.priority,
        assignedTo: body.assignedTo || context.userId,
        createdBy: context.userId,
      }
    );

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
