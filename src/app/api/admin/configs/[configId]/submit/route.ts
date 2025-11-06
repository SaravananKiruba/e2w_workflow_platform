import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { ModuleConfigService } from '@/lib/metadata/module-config-service';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { configId: string } }
) {
  const context = await getTenantContext();
  
  // Only admins can request approval
  if (!context || context.userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const config = await prisma.moduleConfiguration.findUnique({
      where: { id: params.configId },
    });

    if (!config || config.tenantId !== context.tenantId) {
      return NextResponse.json({ error: 'Config not found' }, { status: 404 });
    }

    if (config.status !== 'draft') {
      return NextResponse.json({ error: 'Only draft configs can be submitted' }, { status: 400 });
    }

    const updated = await prisma.moduleConfiguration.update({
      where: { id: params.configId },
      data: { status: 'review' },
    });

    return NextResponse.json({ config: updated, message: 'Submitted for review' });
  } catch (error) {
    console.error('Error submitting for review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
