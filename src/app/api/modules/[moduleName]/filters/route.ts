import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';

// GET /api/modules/[moduleName]/filters - Get filter configuration
export async function GET(
  request: NextRequest,
  { params }: { params: { moduleName: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 });
    }

    const moduleName = params.moduleName;

    // Get module configuration with filter config
    const moduleConfig = await prisma.moduleConfiguration.findFirst({
      where: {
        tenantId: tenantContext.tenantId,
        moduleName,
        status: 'active',
      },
      orderBy: { version: 'desc' },
    });

    if (!moduleConfig) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const filterConfig = moduleConfig.filterConfig ? JSON.parse(moduleConfig.filterConfig) : null;
    const searchableFields = moduleConfig.searchableFields ? JSON.parse(moduleConfig.searchableFields) : [];

    return NextResponse.json({
      filterConfig,
      searchableFields,
      moduleId: moduleConfig.id,
    });
  } catch (error: any) {
    console.error('Error fetching filter config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/modules/[moduleName]/filters - Save filter configuration
export async function POST(
  request: NextRequest,
  { params }: { params: { moduleName: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 });
    }

    // Check if user is tenant admin
    if (tenantContext.role !== 'TENANT_ADMIN' && tenantContext.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const moduleName = params.moduleName;
    const body = await request.json();
    const { filterConfig, searchableFields } = body;

    // Get module configuration
    const moduleConfig = await prisma.moduleConfiguration.findFirst({
      where: {
        tenantId: tenantContext.tenantId,
        moduleName,
        status: 'active',
      },
      orderBy: { version: 'desc' },
    });

    if (!moduleConfig) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Update filter configuration
    const updated = await prisma.moduleConfiguration.update({
      where: { id: moduleConfig.id },
      data: {
        filterConfig: filterConfig ? JSON.stringify(filterConfig) : null,
        searchableFields: searchableFields ? JSON.stringify(searchableFields) : null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      moduleId: updated.id,
    });
  } catch (error: any) {
    console.error('Error saving filter config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
