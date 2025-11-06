import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { DynamicRecordService } from '@/lib/modules/dynamic-record-service';
import { AuditService } from '@/lib/audit/audit-service';

export async function POST(req: NextRequest) {
  const context = await getTenantContext();
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { quotationId, action } = body; // action: 'approve', 'reject', 'send'

    if (!quotationId || !action) {
      return NextResponse.json(
        { error: 'quotationId and action are required' },
        { status: 400 }
      );
    }

    // Get current quotation
    const quotation = await DynamicRecordService.getRecord(
      context.tenantId,
      'Quotations',
      quotationId
    );

    if (!quotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }

    let updatedData: Record<string, any> = {};
    let auditAction = '';

    switch (action) {
      case 'approve':
        if (quotation.status !== 'Pending Approval') {
          return NextResponse.json(
            { error: 'Only pending quotations can be approved' },
            { status: 400 }
          );
        }
        updatedData = {
          status: 'Approved',
          approvedBy: context.userId,
          approvedAt: new Date().toISOString(),
        };
        auditAction = 'approve_quotation';
        break;

      case 'reject':
        if (quotation.status !== 'Pending Approval') {
          return NextResponse.json(
            { error: 'Only pending quotations can be rejected' },
            { status: 400 }
          );
        }
        updatedData = {
          status: 'Rejected',
          notes: (quotation.notes || '') + `\n\nRejection Reason: ${body.reason || 'No reason provided'}`,
        };
        auditAction = 'reject_quotation';
        break;

      case 'send':
        if (!['Draft', 'Approved'].includes(quotation.status)) {
          return NextResponse.json(
            { error: 'Only draft or approved quotations can be sent' },
            { status: 400 }
          );
        }
        updatedData = {
          status: 'Sent',
          sentAt: new Date().toISOString(),
          sentBy: context.userId,
        };
        auditAction = 'send_quotation';
        break;

      case 'accept':
        if (quotation.status !== 'Sent') {
          return NextResponse.json(
            { error: 'Only sent quotations can be accepted' },
            { status: 400 }
          );
        }
        updatedData = {
          status: 'Accepted',
          acceptedAt: new Date().toISOString(),
          acceptedBy: context.userId,
        };
        auditAction = 'accept_quotation';
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Allowed: approve, reject, send, accept' },
          { status: 400 }
        );
    }

    // Update quotation
    const updated = await DynamicRecordService.updateRecord(
      context.tenantId,
      'Quotations',
      quotationId,
      updatedData,
      context.userId
    );

    // Log audit
    await AuditService.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: auditAction,
      entity: 'Quotations',
      entityId: quotationId,
      changes: {
        before: quotation.status,
        after: updatedData.status,
      },
      metadata: body,
    });

    return NextResponse.json({ quotation: updated }, { status: 200 });
  } catch (error: any) {
    console.error('Error in quotation approval:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
