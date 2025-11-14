import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const context = await getTenantContext();

  if (!context || context.userRole !== 'platform_admin') {
    return NextResponse.json({ error: 'Forbidden - Platform Admin access required' }, { status: 403 });
  }

  try {
    // Get all tenants with their record counts
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            modules: true,
            workflows: true,
          },
        },
      },
    });

    // Calculate storage for each tenant based on recordCount field
    const tenantStorageData = tenants.map((tenant) => ({
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
      recordCount: tenant.recordCount,
      storageUsedMB: Math.round((tenant.recordCount * 0.05) * 10) / 10,
    }));

    // Calculate total storage
    const totalStorageMB = tenantStorageData.reduce((sum, t) => sum + t.storageUsedMB, 0);
    const totalStorageGB = Math.round((totalStorageMB / 1024) * 100) / 100;

    return NextResponse.json({
      totalStorageMB,
      totalStorageGB,
      tenants: tenantStorageData,
    });
  } catch (error: any) {
    console.error('Storage calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate storage', details: error.message },
      { status: 500 }
    );
  }
}
