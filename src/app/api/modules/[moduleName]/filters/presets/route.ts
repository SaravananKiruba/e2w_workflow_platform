import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { authOptions } from '@/lib/auth';

// GET /api/modules/[moduleName]/filters/presets - List filter presets
export async function GET(
  request: NextRequest,
  { params }: { params: { moduleName: string } }
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

    const moduleName = params.moduleName;

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

    // Get filter presets (user's own + public presets)
    const presets = await prisma.filterPreset.findMany({
      where: {
        tenantId: tenantContext.tenantId,
        moduleId: moduleConfig.id,
        OR: [
          { userId: session.user.id || '' },
          { isPublic: true },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      presets: presets.map(preset => ({
        id: preset.id,
        name: preset.name,
        filters: JSON.parse(preset.filters),
        isPublic: preset.isPublic,
        userId: preset.userId,
        createdAt: preset.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching filter presets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/modules/[moduleName]/filters/presets - Create filter preset
export async function POST(
  request: NextRequest,
  { params }: { params: { moduleName: string } }
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

    const moduleName = params.moduleName;
    const body = await request.json();
    const { name, filters, isPublic = false } = body;

    if (!name || !filters) {
      return NextResponse.json({ error: 'Name and filters are required' }, { status: 400 });
    }

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

    // Create filter preset
    const preset = await prisma.filterPreset.create({
      data: {
        tenantId: tenantContext.tenantId,
        moduleId: moduleConfig.id,
        name,
        userId: session.user.id || '',
        filters: JSON.stringify(filters),
        isPublic,
      },
    });

    return NextResponse.json({
      success: true,
      preset: {
        id: preset.id,
        name: preset.name,
        filters: JSON.parse(preset.filters),
        isPublic: preset.isPublic,
      },
    });
  } catch (error: any) {
    console.error('Error creating filter preset:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/modules/[moduleName]/filters/presets/[presetId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { moduleName: string } }
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

    const { searchParams } = new URL(request.url);
    const presetId = searchParams.get('presetId');

    if (!presetId) {
      return NextResponse.json({ error: 'Preset ID required' }, { status: 400 });
    }

    // Check ownership
    const preset = await prisma.filterPreset.findFirst({
      where: {
        id: presetId,
        tenantId: tenantContext.tenantId,
        userId: session.user.id || '',
      },
    });

    if (!preset) {
      return NextResponse.json({ error: 'Preset not found or unauthorized' }, { status: 404 });
    }

    await prisma.filterPreset.delete({
      where: { id: presetId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting filter preset:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
