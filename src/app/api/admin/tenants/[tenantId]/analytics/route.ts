import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const context = await getTenantContext();
  
  if (!context || context.userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  try {
    const tenantId = params.tenantId;

    // Get tenant info
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Get total users
    const totalUsers = await prisma.user.count({
      where: { tenantId },
    });

    // Get active users (logged in within last 30 days)
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const activeUsers = await prisma.user.count({
      where: {
        tenantId,
        lastLoginAt: { gte: last30Days },
      },
    });

    // Get total records per module
    const modules = await prisma.moduleConfiguration.findMany({
      where: {
        tenantId,
        status: 'active',
      },
      select: {
        moduleName: true,
        displayName: true,
      },
    });

    const moduleRecordCounts = await Promise.all(
      modules.map(async (module) => {
        const count = await prisma.dynamicRecord.count({
          where: {
            tenantId,
            moduleName: module.moduleName,
          },
        });

        return {
          moduleName: module.moduleName,
          displayName: module.displayName,
          recordCount: count,
        };
      })
    );

    const totalRecords = moduleRecordCounts.reduce((sum, m) => sum + m.recordCount, 0);

    // Get workflow statistics
    const totalWorkflows = await prisma.workflow.count({
      where: { tenantId },
    });

    const activeWorkflows = await prisma.workflow.count({
      where: { tenantId, isActive: true },
    });

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const workflowExecutions7d = await prisma.workflowExecution.count({
      where: {
        workflow: { tenantId },
        executedAt: { gte: last7Days },
      },
    });

    const successfulExecutions = await prisma.workflowExecution.count({
      where: {
        workflow: { tenantId },
        executedAt: { gte: last7Days },
        status: 'success',
      },
    });

    const workflowSuccessRate = workflowExecutions7d > 0
      ? Math.round((successfulExecutions / workflowExecutions7d) * 100)
      : 100;

    // Get audit log count (activity)
    const auditLogsCount = await prisma.auditLog.count({
      where: { tenantId },
    });

    const auditLogs7d = await prisma.auditLog.count({
      where: {
        tenantId,
        createdAt: { gte: last7Days },
      },
    });

    // Calculate storage usage (approximate based on records)
    // In production, you'd track actual database size
    const storageUsageMB = Math.round((totalRecords * 0.05) * 10) / 10; // ~50KB per record estimate

    // Get record growth
    const last24h = new Date();
    last24h.setHours(last24h.getHours() - 24);

    const recordsCreated24h = await prisma.dynamicRecord.count({
      where: {
        tenantId,
        createdAt: { gte: last24h },
      },
    });

    const analytics = {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        subscriptionTier: tenant.subscriptionTier,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        activePercentage: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0,
      },
      records: {
        total: totalRecords,
        byModule: moduleRecordCounts.sort((a, b) => b.recordCount - a.recordCount),
        created24h: recordsCreated24h,
      },
      workflows: {
        total: totalWorkflows,
        active: activeWorkflows,
        executions7d: workflowExecutions7d,
        successRate: workflowSuccessRate,
      },
      activity: {
        auditLogsTotal: auditLogsCount,
        auditLogs7d: auditLogs7d,
      },
      storage: {
        usageMB: storageUsageMB,
        recordCount: totalRecords,
      },
    };

    return NextResponse.json(analytics);
  } catch (error: any) {
    console.error('Error fetching tenant analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
