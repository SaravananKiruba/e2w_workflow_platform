import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext, validateTenantAccess } from '@/lib/tenant-context';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const context = await getTenantContext();
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const moduleName = searchParams.get('moduleName');

    if (!moduleName) {
      return NextResponse.json(
        { error: 'moduleName query parameter required' },
        { status: 400 }
      );
    }

    // Get module configuration
    const moduleConfig = await prisma.moduleConfiguration.findFirst({
      where: {
        tenantId: context.tenantId,
        moduleName,
        status: 'active',
      },
      orderBy: { version: 'desc' },
    });

    if (!moduleConfig) {
      return NextResponse.json(
        { error: `Module ${moduleName} not found` },
        { status: 404 }
      );
    }

    const fields = JSON.parse(moduleConfig.fields);

    return NextResponse.json({
      moduleName,
      fields,
      version: moduleConfig.version,
      description: moduleConfig.description,
    });
  } catch (error) {
    console.error('Error fetching fields:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const context = await getTenantContext();
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { moduleName, fields, description } = body;

    if (!moduleName || !fields) {
      return NextResponse.json(
        { error: 'moduleName and fields required' },
        { status: 400 }
      );
    }

    // Get current configuration
    const currentConfig = await prisma.moduleConfiguration.findFirst({
      where: {
        tenantId: context.tenantId,
        moduleName,
        status: 'active',
      },
      orderBy: { version: 'desc' },
    });

    if (!currentConfig) {
      return NextResponse.json(
        { error: `Module ${moduleName} not found` },
        { status: 404 }
      );
    }

    // Create new version with updated fields
    const newVersion = currentConfig.version + 1;
    const updatedConfig = await prisma.moduleConfiguration.create({
      data: {
        tenantId: context.tenantId,
        moduleName,
        displayName: currentConfig.displayName,
        icon: currentConfig.icon,
        description: description || currentConfig.description,
        fields: JSON.stringify(fields),
        layouts: currentConfig.layouts,
        validations: currentConfig.validations,
        status: 'active',
        version: newVersion,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        userId: context.userId,
        action: 'update_module_config',
        entity: moduleName,
        entityId: updatedConfig.id,
        metadata: JSON.stringify({
          version: newVersion,
          fieldCount: fields.length,
        }),
      },
    });

    console.log('[CONFIG SYNC] Fields updated successfully for module:', moduleName);
    console.log('[CONFIG SYNC] New version:', newVersion);
    console.log('[CONFIG SYNC] Fields count:', fields.length);

    return NextResponse.json({
      message: 'Fields updated successfully',
      moduleName,
      version: newVersion,
      fields,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error updating fields:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
