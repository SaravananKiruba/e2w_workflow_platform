import { prisma } from '@/lib/prisma';

export class AnalyticsEngine {
  /**
   * Calculate total revenue for period
   */
  static async calculateTotalRevenue(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const invoices = await prisma.dynamicRecord.findMany({
      where: {
        tenantId,
        moduleName: 'Invoices',
        status: 'active',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return invoices.reduce((total, invoice) => {
      const data = JSON.parse(invoice.data);
      return total + (data.totalAmount || 0);
    }, 0);
  }

  /**
   * Count total orders for period
   */
  static async countTotalOrders(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    return await prisma.dynamicRecord.count({
      where: {
        tenantId,
        moduleName: 'Orders',
        status: 'active',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  /**
   * Count pending invoices
   */
  static async countPendingInvoices(tenantId: string): Promise<number> {
    const invoices = await prisma.dynamicRecord.findMany({
      where: {
        tenantId,
        moduleName: 'Invoices',
        status: 'active',
      },
    });

    return invoices.filter(inv => {
      const data = JSON.parse(inv.data);
      return data.paymentStatus === 'Pending' || data.paymentStatus === 'Overdue';
    }).length;
  }

  /**
   * Calculate payment collection rate
   */
  static async calculatePaymentRate(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const invoices = await prisma.dynamicRecord.findMany({
      where: {
        tenantId,
        moduleName: 'Invoices',
        status: 'active',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    if (invoices.length === 0) return 0;

    const paidCount = invoices.filter(inv => {
      const data = JSON.parse(inv.data);
      return data.paymentStatus === 'Paid';
    }).length;

    return (paidCount / invoices.length) * 100;
  }

  /**
   * Calculate average order value
   */
  static async calculateAverageOrderValue(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const orders = await prisma.dynamicRecord.findMany({
      where: {
        tenantId,
        moduleName: 'Orders',
        status: 'active',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    if (orders.length === 0) return 0;

    const total = orders.reduce((sum, order) => {
      const data = JSON.parse(order.data);
      return sum + (data.totalAmount || 0);
    }, 0);

    return total / orders.length;
  }

  /**
   * Count orders by status
   */
  static async countOrdersByStatus(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, number>> {
    const orders = await prisma.dynamicRecord.findMany({
      where: {
        tenantId,
        moduleName: 'Orders',
        status: 'active',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const statusCounts: Record<string, number> = {};

    orders.forEach(order => {
      const data = JSON.parse(order.data);
      const orderStatus = data.status || 'Unknown';
      statusCounts[orderStatus] = (statusCounts[orderStatus] || 0) + 1;
    });

    return statusCounts;
  }

  /**
   * Get top clients by revenue
   */
  static async getTopClientsByRevenue(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ): Promise<Array<{ clientName: string; revenue: number; orderCount: number }>> {
    const invoices = await prisma.dynamicRecord.findMany({
      where: {
        tenantId,
        moduleName: 'Invoices',
        status: 'active',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const clientStats: Record<string, { revenue: number; orders: number }> = {};

    invoices.forEach(invoice => {
      const data = JSON.parse(invoice.data);
      const clientName = data.clientName || 'Unknown';

      if (!clientStats[clientName]) {
        clientStats[clientName] = { revenue: 0, orders: 0 };
      }

      clientStats[clientName].revenue += data.totalAmount || 0;
      clientStats[clientName].orders += 1;
    });

    return Object.entries(clientStats)
      .map(([clientName, stats]) => ({
        clientName,
        revenue: stats.revenue,
        orderCount: stats.orders,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  /**
   * Get payment method distribution
   */
  static async getPaymentMethodDistribution(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, number>> {
    const payments = await prisma.dynamicRecord.findMany({
      where: {
        tenantId,
        moduleName: 'Payments',
        status: 'active',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const distribution: Record<string, number> = {};

    payments.forEach(payment => {
      const data = JSON.parse(payment.data);
      const method = data.paymentMethod || 'Unknown';
      distribution[method] = (distribution[method] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Get revenue trend over periods
   */
  static async getRevenueTrend(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    periodDays: number = 7
  ): Promise<Array<{ date: string; revenue: number }>> {
    const invoices = await prisma.dynamicRecord.findMany({
      where: {
        tenantId,
        moduleName: 'Invoices',
        status: 'active',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const trendData: Record<string, number> = {};
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      trendData[dateStr] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    invoices.forEach(invoice => {
      const data = JSON.parse(invoice.data);
      const dateStr = invoice.createdAt.toISOString().split('T')[0];

      if (trendData[dateStr] !== undefined) {
        trendData[dateStr] += data.totalAmount || 0;
      }
    });

    return Object.entries(trendData).map(([date, revenue]) => ({ date, revenue }));
  }

  /**
   * Get dashboard metrics summary
   */
  static async getDashboardMetrics(tenantId: string) {
    const today = new Date();
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [
      totalRevenue,
      totalOrders,
      pendingInvoices,
      paymentRate,
      avgOrderValue,
      ordersByStatus,
      topClients,
    ] = await Promise.all([
      this.calculateTotalRevenue(tenantId, thisMonthStart, thisMonthEnd),
      this.countTotalOrders(tenantId, thisMonthStart, thisMonthEnd),
      this.countPendingInvoices(tenantId),
      this.calculatePaymentRate(tenantId, thisMonthStart, thisMonthEnd),
      this.calculateAverageOrderValue(tenantId, thisMonthStart, thisMonthEnd),
      this.countOrdersByStatus(tenantId, thisMonthStart, thisMonthEnd),
      this.getTopClientsByRevenue(tenantId, thisMonthStart, thisMonthEnd, 5),
    ]);

    return {
      period: {
        start: thisMonthStart,
        end: thisMonthEnd,
      },
      metrics: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        pendingInvoices,
        paymentRate: Math.round(paymentRate * 100) / 100,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      },
      breakdown: {
        ordersByStatus,
        topClients,
      },
    };
  }

  /**
   * Get overdue invoices
   */
  static async getOverdueInvoices(tenantId: string): Promise<Array<any>> {
    const invoices = await prisma.dynamicRecord.findMany({
      where: {
        tenantId,
        moduleName: 'Invoices',
        status: 'active',
      },
    });

    const today = new Date();

    return invoices
      .filter(inv => {
        const data = JSON.parse(inv.data);
        const dueDate = new Date(data.dueDate);
        return dueDate < today && (data.paymentStatus === 'Pending' || data.paymentStatus === 'Partial');
      })
      .map(inv => ({
        id: inv.id,
        ...JSON.parse(inv.data),
        daysOverdue: Math.floor(
          (today.getTime() - new Date(JSON.parse(inv.data).dueDate).getTime()) / (1000 * 60 * 60 * 24)
        ),
      }));
  }
}
