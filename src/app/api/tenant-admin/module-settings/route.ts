import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import prisma from '@/lib/prisma';

/**
 * GET /api/tenant-admin/module-settings
 * Get module settings for configuration
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is tenant admin
    if (context.userRole !== 'admin' && context.userRole !== 'owner') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const moduleName = searchParams.get('moduleName');

    if (!moduleName) {
      return NextResponse.json({ error: 'moduleName is required' }, { status: 400 });
    }

    // Get module configuration
    const config = await prisma.moduleConfiguration.findFirst({
      where: {
        tenantId: context.tenantId,
        moduleName,
        status: 'active',
      },
      orderBy: { version: 'desc' },
      select: { moduleSettings: true },
    });

    const settings = config?.moduleSettings ? JSON.parse(config.moduleSettings) : {};

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching module settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch module settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tenant-admin/module-settings
 * Update module settings (tenant admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is tenant admin
    if (context.userRole !== 'admin' && context.userRole !== 'owner') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { moduleName, settings } = body;

    if (!moduleName || !settings) {
      return NextResponse.json(
        { error: 'moduleName and settings are required' },
        { status: 400 }
      );
    }

    // Get current module configuration
    const config = await prisma.moduleConfiguration.findFirst({
      where: {
        tenantId: context.tenantId,
        moduleName,
        status: 'active',
      },
      orderBy: { version: 'desc' },
    });

    if (!config) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Merge with existing settings
    const currentSettings = config.moduleSettings ? JSON.parse(config.moduleSettings) : {};
    const mergedSettings = { ...currentSettings, ...settings };

    // Update module configuration
    await prisma.moduleConfiguration.update({
      where: { id: config.id },
      data: {
        moduleSettings: JSON.stringify(mergedSettings),
        updatedBy: context.userId,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, settings: mergedSettings });
  } catch (error) {
    console.error('Error updating module settings:', error);
    return NextResponse.json(
      { error: 'Failed to update module settings' },
      { status: 500 }
    );
  }
}
