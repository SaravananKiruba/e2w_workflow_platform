import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const context = await getTenantContext();
  
  // Only platform admins can access platform-wide analytics
  if (!context || context.userRole !== 'platform_admin') {
    return NextResponse.json(
      { error: 'Forbidden - Platform Admin access required' },
      { status: 403 }
    );
  }

  try {
    // Get total records across all tenants
    const totalRecords = await prisma.dynamicRecord.count();

    // Get records by tenant
    const tenants = await prisma.tenant.findMany({
      select: { id: true, name: true, slug: true },
    });

    const recordsByTenant = await Promise.all(
      tenants.map(async (tenant) => {
        const recordCount = await prisma.dynamicRecord.count({
          where: { tenantId: tenant.id },
        });

        return {
          tenantId: tenant.id,
          tenantName: tenant.name,
          tenantSlug: tenant.slug,
          recordCount,
        };
      })
    );

    // Get records by module (across all tenants)
    const recordsByModule = await prisma.dynamicRecord.groupBy({
      by: ['moduleName'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // Get total users across all tenants
    const totalUsers = await prisma.user.count();

    // Get total tenants
    const totalTenants = await prisma.tenant.count();

    // Get total workflows
    const totalWorkflows = await prisma.workflow.count();

    // Get total audit logs
    const totalAuditLogs = await prisma.auditLog.count();

    // Get records created in last 24 hours
    const last24h = new Date();
    last24h.setHours(last24h.getHours() - 24);

    const recordsCreated24h = await prisma.dynamicRecord.count({
      where: { createdAt: { gte: last24h } },
    });

    // Get records created in last 7 days
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const recordsCreated7d = await prisma.dynamicRecord.count({
      where: { createdAt: { gte: last7Days } },
    });

    // Calculate approximate storage (50KB per record estimate)
    const storageUsageMB = Math.round((totalRecords * 0.05) * 10) / 10;

    const platformAnalytics = {
      summary: {
        totalRecords,
        totalUsers,
        totalTenants,
        totalWorkflows,
        totalAuditLogs,
      },
      records: {
        total: totalRecords,
        created24h: recordsCreated24h,
        created7d: recordsCreated7d,
        byTenant: recordsByTenant.sort((a, b) => b.recordCount - a.recordCount),
        byModule: recordsByModule.map((item) => ({
          moduleName: item.moduleName,
          count: item._count.id,
        })),
      },
      storage: {
        estimatedMB: storageUsageMB,
        estimatedGB: Math.round((storageUsageMB / 1024) * 100) / 100,
      },
      timestamp: new Date(),
    };

    return NextResponse.json(platformAnalytics);
  } catch (error: any) {
    console.error('Error fetching platform analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
