import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { DynamicRecordService } from '@/lib/modules/dynamic-record-service';
import { AuditService } from '@/lib/audit/audit-service';

export async function POST(
  req: NextRequest,
  { params }: { params: { quotationId: string } }
) {
  const context = await getTenantContext();
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { recipientEmail, subject, message } = body;

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'recipientEmail is required' },
        { status: 400 }
      );
    }

    // Get quotation
    const quotation = await DynamicRecordService.getRecord(
      context.tenantId,
      'Quotations',
      params.quotationId
    );

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    // Check if status allows sending
    if (!['Draft', 'Approved'].includes(quotation.status)) {
      return NextResponse.json(
        { error: `Cannot send quotation with status: ${quotation.status}` },
        { status: 400 }
      );
    }

    // Build email body
    const emailBody = generateEmailBody(quotation, message);

    // TODO: Integrate with actual SMTP service
    // For now, we'll just log it and update the quotation status
    console.log('📧 Email sending triggered:', {
      to: recipientEmail,
      subject: subject || `Quotation ${quotation.quotationNumber}`,
      from: process.env.SMTP_FROM || 'noreply@easy2work.com',
    });

    // Update quotation status
    const updated = await DynamicRecordService.updateRecord(
      context.tenantId,
      'Quotations',
      params.quotationId,
      {
        ...quotation,
        status: 'Sent',
        sentAt: new Date().toISOString(),
        sentBy: context.userId,
        lastEmailSent: new Date().toISOString(),
        lastEmailSentTo: recipientEmail,
      },
      context.userId
    );

    // Log audit
    await AuditService.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'send_email',
      entity: 'Quotations',
      entityId: params.quotationId,
      metadata: {
        recipientEmail,
        quotationNumber: quotation.quotationNumber,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Quotation ${quotation.quotationNumber} sent to ${recipientEmail}`,
      quotation: updated,
    });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateEmailBody(quotation: any, customMessage?: string): string {
  const itemsList = quotation.items
    .map(
      (item: any) =>
        `- ${item.description}: ${item.quantity} x ₹${item.unitPrice.toFixed(2)} = ₹${item.amount.toFixed(2)}`
    )
    .join('\n');

  return `
Dear ${quotation.clientName},

${customMessage || 'We are pleased to submit the following quotation for your consideration.'}

QUOTATION DETAILS
================
Quotation Number: ${quotation.quotationNumber}
Date: ${new Date(quotation.quotationDate).toLocaleDateString()}
Valid Until: ${new Date(quotation.validUntil).toLocaleDateString()}

ITEMS
=====
${itemsList}

SUMMARY
=======
Subtotal: ₹${quotation.subtotal.toFixed(2)}
Tax: ₹${quotation.taxAmount.toFixed(2)}
${quotation.discountAmount ? `Discount: -₹${quotation.discountAmount.toFixed(2)}\n` : ''}
TOTAL: ₹${quotation.totalAmount.toFixed(2)}

${
  quotation.terms
    ? `TERMS & CONDITIONS
================
${quotation.terms}`
    : ''
}

${
  quotation.description
    ? `DESCRIPTION
===========
${quotation.description}`
    : ''
}

Please review the quotation and let us know if you have any questions or require modifications.

To accept this quotation or request changes, please reply to this email or contact us directly.

Best regards,
Easy2Work Team

---
This is an automated email from Easy2Work Business Solutions.
Please do not reply to this email address. For support, contact: support@easy2work.com
`;
}
