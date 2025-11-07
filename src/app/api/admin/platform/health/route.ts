import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const context = await getTenantContext();
  
  // Only system admins can access platform health
  if (!context || context.userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  try {
    // Database health check
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const databaseResponseTime = Date.now() - dbStart;
    const database = databaseResponseTime < 100 ? 'healthy' : 'degraded';

    // Storage usage (simulated - would query actual storage in production)
    const totalRecords = await prisma.dynamicRecord.count();
    const storageUsage = Math.min(Math.round((totalRecords / 100000) * 100), 95);

    // Average response time (simulated)
    const avgResponseTime = Math.floor(Math.random() * 100) + 30;

    // Workflow execution stats
    const last24h = new Date();
    last24h.setHours(last24h.getHours() - 24);

    const workflowExecutions24h = await prisma.workflowExecution.count({
      where: {
        executedAt: { gte: last24h },
      },
    });

    const failedExecutions24h = await prisma.workflowExecution.count({
      where: {
        executedAt: { gte: last24h },
        status: 'failed',
      },
    });

    const health = {
      database,
      databaseResponseTime,
      storageUsage,
      avgResponseTime,
      workflowExecutions24h,
      failedExecutions24h,
      workflowSuccessRate: workflowExecutions24h > 0
        ? Math.round(((workflowExecutions24h - failedExecutions24h) / workflowExecutions24h) * 100)
        : 100,
      status: database === 'healthy' && storageUsage < 90 ? 'healthy' : 'warning',
    };

    return NextResponse.json(health);
  } catch (error: any) {
    console.error('Error checking platform health:', error);
    return NextResponse.json(
      { 
        database: 'unhealthy',
        status: 'error',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
