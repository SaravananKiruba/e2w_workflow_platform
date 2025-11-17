import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { AnalyticsEngine } from '@/lib/analytics/analytics-engine';

export async function GET(
  req: NextRequest,
  { params }: { params: { workflowName: string } }
) {
  const context = await getTenantContext();
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only Manager and Owner can access workflow analytics
  if (!['manager', 'owner'].includes(context.userRole)) {
    return NextResponse.json(
      { error: 'Forbidden - Manager or Owner access required' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Default: last 30 days
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const workflowName = params.workflowName;

    // Get workflow analytics
    const analytics = await AnalyticsEngine.getWorkflowAnalytics(
      context.tenantId,
      workflowName,
      startDate,
      endDate
    );

    return NextResponse.json(analytics);
  } catch (error: any) {
    console.error('Error fetching workflow analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
