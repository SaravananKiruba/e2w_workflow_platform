import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';

// POST /api/workflows/instances - Create workflow instance from template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 });
    }

    const body = await request.json();
    const { templateId, name, description, moduleName, customizations } = body;

    if (!templateId || !name || !moduleName) {
      return NextResponse.json(
        { error: 'Template ID, name, and module name are required' },
        { status: 400 }
      );
    }

    // Get template
    const template = await prisma.workflowTemplate.findFirst({
      where: {
        id: templateId,
        OR: [
          { isPublic: true },
          { tenantId: tenantContext.tenantId },
        ],
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Parse template data and apply customizations
    const templateData = JSON.parse(template.templateData);
    const mergedData = customizations
      ? { ...templateData, ...customizations }
      : templateData;

    // Create workflow instance
    const workflow = await prisma.workflow.create({
      data: {
        tenantId: tenantContext.tenantId,
        name,
        description: description || template.description,
        moduleName,
        trigger: JSON.stringify(mergedData.trigger || {}),
        conditions: mergedData.conditions ? JSON.stringify(mergedData.conditions) : null,
        actions: JSON.stringify(mergedData.actions || []),
        isActive: false, // Start as inactive
        priority: mergedData.priority || 0,
        templateId: templateId,
        createdBy: session.user.id || session.user.email || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      workflow: {
        id: workflow.id,
        name: workflow.name,
        moduleName: workflow.moduleName,
        isActive: workflow.isActive,
      },
    });
  } catch (error: any) {
    console.error('Error creating workflow instance:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/workflows/instances - List tenant workflows
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const moduleName = searchParams.get('moduleName');
    const isActive = searchParams.get('isActive');

    const workflows = await prisma.workflow.findMany({
      where: {
        tenantId: tenantContext.tenantId,
        ...(moduleName && { moduleName }),
        ...(isActive !== null && { isActive: isActive === 'true' }),
      },
      orderBy: [
        { isActive: 'desc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      workflows: workflows.map(w => ({
        id: w.id,
        name: w.name,
        description: w.description,
        moduleName: w.moduleName,
        isActive: w.isActive,
        priority: w.priority,
        templateId: w.templateId,
        createdAt: w.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
