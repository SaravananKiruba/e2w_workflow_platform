import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { prisma } from '@/lib/prisma';

// Get all module configurations including draft, review, and archived versions
export async function GET(req: NextRequest) {
  const context = await getTenantContext();
  
  if (!context || context.userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const moduleName = searchParams.get('moduleName');
    const status = searchParams.get('status');

    const whereClause: any = { tenantId: context.tenantId };
    
    if (moduleName) {
      whereClause.moduleName = moduleName;
    }
    
    if (status) {
      whereClause.status = status;
    }

    const configs = await prisma.moduleConfiguration.findMany({
      where: whereClause,
      orderBy: [{ moduleName: 'asc' }, { version: 'desc' }],
    });

    return NextResponse.json({ configs });
  } catch (error) {
    console.error('Error fetching configs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new module configuration (draft status)
export async function POST(req: NextRequest) {
  const context = await getTenantContext();
  
  if (!context || context.userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      moduleName,
      displayName,
      icon,
      description,
      fields,
      layouts,
      validations,
      status = 'draft',
    } = body;

    if (!moduleName || !displayName || !fields) {
      return NextResponse.json(
        { error: 'moduleName, displayName, and fields are required' },
        { status: 400 }
      );
    }

    // Check if module already exists
    const existingConfig = await prisma.moduleConfiguration.findFirst({
      where: {
        tenantId: context.tenantId,
        moduleName,
      },
      orderBy: { version: 'desc' },
    });

    const version = existingConfig ? existingConfig.version + 1 : 1;

    // Create new configuration
    const newConfig = await prisma.moduleConfiguration.create({
      data: {
        tenantId: context.tenantId,
        moduleName,
        displayName,
        icon: icon || 'FiBox',
        description: description || '',
        fields: JSON.stringify(fields),
        layouts: layouts ? JSON.stringify(layouts) : '{}',
        validations: validations ? JSON.stringify(validations) : '[]',
        status: status,
        version,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        userId: context.userId,
        action: 'create_module_config',
        entity: moduleName,
        entityId: newConfig.id,
        metadata: JSON.stringify({
          version,
          status,
          fieldCount: fields.length,
        }),
      },
    });

    return NextResponse.json({
      message: 'Configuration created successfully',
      config: {
        id: newConfig.id,
        moduleName: newConfig.moduleName,
        version: newConfig.version,
        status: newConfig.status,
      },
    });
  } catch (error) {
    console.error('Error creating config:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update configuration status (for approval workflow)
export async function PATCH(req: NextRequest) {
  const context = await getTenantContext();
  
  if (!context || context.userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { configId, status } = body;

    if (!configId || !status) {
      return NextResponse.json(
        { error: 'configId and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['draft', 'review', 'active', 'archived'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // If activating, deactivate other active versions of same module
    if (status === 'active') {
      const config = await prisma.moduleConfiguration.findUnique({
        where: { id: configId },
      });

      if (config) {
        await prisma.moduleConfiguration.updateMany({
          where: {
            tenantId: context.tenantId,
            moduleName: config.moduleName,
            status: 'active',
            id: { not: configId },
          },
          data: { status: 'archived' },
        });
      }
    }

    const updatedConfig = await prisma.moduleConfiguration.update({
      where: { id: configId },
      data: { status },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        userId: context.userId,
        action: 'update_config_status',
        entity: updatedConfig.moduleName,
        entityId: configId,
        metadata: JSON.stringify({ 
          newStatus: status,
          version: updatedConfig.version,
        }),
      },
    });

    return NextResponse.json({
      message: 'Configuration status updated successfully',
      config: {
        id: updatedConfig.id,
        moduleName: updatedConfig.moduleName,
        status: updatedConfig.status,
      },
    });
  } catch (error) {
    console.error('Error updating config status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

