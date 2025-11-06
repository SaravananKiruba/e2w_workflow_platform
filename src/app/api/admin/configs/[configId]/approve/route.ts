import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';

// SaaS Provider endpoint - approve config changes
export async function POST(
  req: NextRequest,
  { params }: { params: { configId: string } }
) {
  const context = await getTenantContext();
  
  // Check if user is SaaS Provider (special permission)
  const isSaaSProvider = process.env.SAAS_PROVIDER_EMAIL === context?.userId; // Simplified check
  
  if (!isSaaSProvider) {
    return NextResponse.json({ error: 'Forbidden - SaaS Provider only' }, { status: 403 });
  }

  try {
    const { action, reason } = await req.json();

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const config = await prisma.moduleConfiguration.findUnique({
      where: { id: params.configId },
    });

    if (!config) {
      return NextResponse.json({ error: 'Config not found' }, { status: 404 });
    }

    if (config.status !== 'review') {
      return NextResponse.json({ error: 'Config not in review status' }, { status: 400 });
    }

    if (action === 'approve') {
      // Deactivate other active versions
      await prisma.moduleConfiguration.updateMany({
        where: {
          tenantId: config.tenantId,
          moduleName: config.moduleName,
          status: 'active',
        },
        data: { status: 'archived' },
      });

      // Activate this config
      const activated = await prisma.moduleConfiguration.update({
        where: { id: params.configId },
        data: {
          status: 'active',
          approvedBy: context!.userId,
          approvedAt: new Date(),
        },
      });

      return NextResponse.json({
        config: activated,
        message: 'Configuration approved and activated',
      });
    } else {
      // Reject - set back to draft with reason
      const rejected = await prisma.moduleConfiguration.update({
        where: { id: params.configId },
        data: {
          status: 'draft',
        },
      });

      return NextResponse.json({
        config: rejected,
        message: `Configuration rejected: ${reason || 'No reason provided'}`,
      });
    }
  } catch (error) {
    console.error('Error processing approval:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
