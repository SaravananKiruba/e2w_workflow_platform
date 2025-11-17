import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
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
        tenantId: session.user.tenantId,
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
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
        tenantId: session.user.tenantId,
        moduleName,
        status: 'active',
      },
      orderBy: { version: 'desc' },
    });

    if (!currentConfig) {
      return NextResponse.json(
        { error: `Module ${moduleName} not found. Please create the module first in Module Builder.` },
        { status: 404 }
      );
    }

    // Update the current configuration with new fields
    // We'll update the existing record instead of creating a new version
    const updatedConfig = await prisma.moduleConfiguration.update({
      where: {
        id: currentConfig.id,
      },
      data: {
        description: description || currentConfig.description,
        fields: JSON.stringify(fields),
        isCustomized: true, // Mark as customized since fields are being updated
        lastFieldUpdate: new Date(),
        updatedBy: session.user.id,
        updatedAt: new Date(),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: 'update_module_config',
        entity: moduleName,
        entityId: updatedConfig.id,
        metadata: JSON.stringify({
          version: updatedConfig.version,
          fieldCount: fields.length,
        }),
      },
    });

    console.log('[CONFIG SYNC] Fields updated successfully for module:', moduleName);
    console.log('[CONFIG SYNC] Version:', updatedConfig.version);
    console.log('[CONFIG SYNC] Fields count:', fields.length);

    return NextResponse.json({
      message: 'Fields updated successfully',
      moduleName,
      version: updatedConfig.version,
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
