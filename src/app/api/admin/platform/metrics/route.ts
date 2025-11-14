import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const context = await getTenantContext();
  
  // Only platform admins can access platform metrics
  if (!context || context.userRole !== 'platform_admin') {
    return NextResponse.json({ error: 'Forbidden - Platform Admin access required' }, { status: 403 });
  }

  try {
    // Get total tenants
    const totalTenants = await prisma.tenant.count();

    // Get active tenants
    const activeTenants = await prisma.tenant.count({
      where: { status: 'active' },
    });

    // Get total records across all dynamic modules
    const totalRecords = await prisma.dynamicRecord.count();

    // Get total workflows
    const totalWorkflows = await prisma.workflow.count();

    // Get pending approvals (configs in review status)
    const pendingApprovals = await prisma.moduleConfiguration.count({
      where: { status: 'review' },
    });

    // Get tenant growth (new tenants this month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const tenantsThisMonth = await prisma.tenant.count({
      where: {
        createdAt: { gte: startOfMonth },
      },
    });

    const lastMonthStart = new Date(startOfMonth);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    const tenantsLastMonth = await prisma.tenant.count({
      where: {
        createdAt: {
          gte: lastMonthStart,
          lt: startOfMonth,
        },
      },
    });

    const tenantGrowth = tenantsLastMonth > 0
      ? Math.round(((tenantsThisMonth - tenantsLastMonth) / tenantsLastMonth) * 100)
      : 100;

    // Get module usage statistics
    const moduleUsage = await prisma.moduleConfiguration.findMany({
      where: { status: 'active' },
      select: {
        moduleName: true,
        displayName: true,
      },
    });

    const moduleUsageWithCounts = await Promise.all(
      moduleUsage.map(async (module) => {
        const recordCount = await prisma.dynamicRecord.count({
          where: { moduleName: module.moduleName },
        });
        return {
          name: module.moduleName,
          displayName: module.displayName,
          recordCount,
        };
      })
    );

    // Calculate API calls (simulated - would need actual tracking in production)
    const apiCalls24h = Math.floor(Math.random() * 10000) + 5000;
    const apiTrend = Math.floor(Math.random() * 20) - 10;

    const metrics = {
      totalTenants,
      activeTenants,
      activePercentage: totalTenants > 0 ? Math.round((activeTenants / totalTenants) * 100) : 0,
      totalRecords,
      totalWorkflows,
      pendingApprovals,
      tenantGrowth,
      apiCalls24h,
      apiTrend,
      moduleUsage: moduleUsageWithCounts.sort((a, b) => b.recordCount - a.recordCount),
    };

    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error('Error fetching platform metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
