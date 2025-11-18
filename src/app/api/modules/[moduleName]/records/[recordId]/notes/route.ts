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
    const notes = await DynamicRecordService.getRecordNotes(
      context.tenantId,
      params.moduleName,
      params.recordId
    );

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
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
    
    const note = await DynamicRecordService.createRecordNote(
      context.tenantId,
      params.moduleName,
      params.recordId,
      {
        content: body.content,
        isPinned: body.isPinned,
        mentions: body.mentions,
        createdBy: context.userId,
      }
    );

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
