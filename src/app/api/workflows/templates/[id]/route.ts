import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { authOptions } from '@/lib/auth';

// GET /api/workflows/templates/[id] - Get template details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 });
    }

    const template = await prisma.workflowTemplate.findFirst({
      where: {
        id: params.id,
        OR: [
          { isPublic: true },
          { tenantId: tenantContext.tenantId },
        ],
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      isPublic: template.isPublic,
      isPlatformTemplate: template.tenantId === null,
      version: template.version,
      templateData: JSON.parse(template.templateData),
      createdAt: template.createdAt,
    });
  } catch (error: any) {
    console.error('Error fetching template details:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/workflows/templates/[id] - Delete template (tenant-specific only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 });
    }

    // Check authorization
    if (tenantContext.userRole !== 'TENANT_ADMIN' && tenantContext.userRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Find template
    const template = await prisma.workflowTemplate.findFirst({
      where: {
        id: params.id,
        tenantId: tenantContext.tenantId, // Can only delete own templates
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found or cannot be deleted' },
        { status: 404 }
      );
    }

    await prisma.workflowTemplate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
