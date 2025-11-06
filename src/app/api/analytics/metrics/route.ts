import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { AnalyticsEngine } from '@/lib/analytics/analytics-engine';

export async function GET(req: NextRequest) {
  const context = await getTenantContext();
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const metric = searchParams.get('metric');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Default: last 30 days
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    let result: any;

    switch (metric) {
      case 'dashboard':
        result = await AnalyticsEngine.getDashboardMetrics(context.tenantId);
        break;

      case 'revenue':
        result = {
          metric: 'Total Revenue',
          value: await AnalyticsEngine.calculateTotalRevenue(context.tenantId, start, end),
        };
        break;

      case 'orders':
        result = {
          metric: 'Total Orders',
          value: await AnalyticsEngine.countTotalOrders(context.tenantId, start, end),
        };
        break;

      case 'pending-invoices':
        result = {
          metric: 'Pending Invoices',
          value: await AnalyticsEngine.countPendingInvoices(context.tenantId),
        };
        break;

      case 'payment-rate':
        result = {
          metric: 'Payment Collection Rate',
          value: await AnalyticsEngine.calculatePaymentRate(context.tenantId, start, end),
          unit: '%',
        };
        break;

      case 'avg-order-value':
        result = {
          metric: 'Average Order Value',
          value: await AnalyticsEngine.calculateAverageOrderValue(context.tenantId, start, end),
        };
        break;

      case 'orders-by-status':
        result = await AnalyticsEngine.countOrdersByStatus(context.tenantId, start, end);
        break;

      case 'top-clients':
        result = await AnalyticsEngine.getTopClientsByRevenue(context.tenantId, start, end, 10);
        break;

      case 'payment-methods':
        result = await AnalyticsEngine.getPaymentMethodDistribution(context.tenantId, start, end);
        break;

      case 'revenue-trend':
        result = await AnalyticsEngine.getRevenueTrend(context.tenantId, start, end);
        break;

      case 'overdue-invoices':
        result = await AnalyticsEngine.getOverdueInvoices(context.tenantId);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid metric. Use: dashboard, revenue, orders, pending-invoices, payment-rate, avg-order-value, orders-by-status, top-clients, payment-methods, revenue-trend, overdue-invoices' },
          { status: 400 }
        );
    }

    return NextResponse.json({ metric, result, period: { startDate: start, endDate: end } });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
