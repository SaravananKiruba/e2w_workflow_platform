import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { authOptions } from '@/lib/auth';

// GET /api/workflows/templates - Fetch all workflow templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Get public platform templates + tenant-specific templates
    const templates = await prisma.workflowTemplate.findMany({
      where: {
        OR: [
          { isPublic: true, tenantId: null }, // Platform templates
          { tenantId: tenantContext.tenantId }, // Tenant-specific templates
        ],
        ...(category && { category }),
      },
      orderBy: [
        { isPublic: 'desc' }, // Platform templates first
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      templates: templates.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        isPublic: t.isPublic,
        isPlatformTemplate: t.tenantId === null,
        version: t.version,
        createdAt: t.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching workflow templates:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/workflows/templates - Create new workflow template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, category, templateData, isPublic = false } = body;

    if (!name || !category || !templateData) {
      return NextResponse.json(
        { error: 'Name, category, and templateData are required' },
        { status: 400 }
      );
    }

    // Only platform admins can create public templates
    const isPlatformAdmin = tenantContext.userRole === 'PLATFORM_ADMIN';
    const canMakePublic = isPlatformAdmin && isPublic;

    const template = await prisma.workflowTemplate.create({
      data: {
        name,
        description,
        category,
        templateData: JSON.stringify(templateData),
        isPublic: canMakePublic,
        tenantId: canMakePublic ? null : tenantContext.tenantId,
        createdBy: session.user.id || session.user.email || 'unknown',
        version: '1.0.0',
      },
    });

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.name,
        category: template.category,
      },
    });
  } catch (error: any) {
    console.error('Error creating workflow template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
