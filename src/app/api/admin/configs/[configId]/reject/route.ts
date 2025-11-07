import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { prisma } from '@/lib/prisma';
import { AuditService } from '@/lib/audit/audit-service';

export async function POST(
  req: NextRequest,
  { params }: { params: { configId: string } }
) {
  const context = await getTenantContext();
  
  // Only admins can reject configs
  if (!context || context.userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { comment } = body;

    if (!comment || comment.trim() === '') {
      return NextResponse.json(
        { error: 'Comment is required for rejection' },
        { status: 400 }
      );
    }

    // Get the config
    const config = await prisma.moduleConfiguration.findUnique({
      where: { id: params.configId },
      include: { tenant: true },
    });

    if (!config) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    if (config.status !== 'review') {
      return NextResponse.json(
        { error: 'Configuration is not in review status' },
        { status: 400 }
      );
    }

    // Update status to draft (rejected)
    const updatedConfig = await prisma.moduleConfiguration.update({
      where: { id: params.configId },
      data: {
        status: 'draft',
        // Store rejection comment in a metadata field (would need to add to schema in production)
      },
    });

    // Log the rejection
    await AuditService.log({
      tenantId: config.tenantId,
      userId: context.userId || 'system',
      action: 'config_rejected',
      entity: 'module_configuration',
      entityId: config.id,
      metadata: {
        moduleName: config.moduleName,
        version: config.version,
        comment,
        rejectedBy: context.userId,
      },
    });

    return NextResponse.json({
      success: true,
      config: updatedConfig,
      message: 'Configuration rejected successfully',
    });
  } catch (error: any) {
    console.error('Error rejecting configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
