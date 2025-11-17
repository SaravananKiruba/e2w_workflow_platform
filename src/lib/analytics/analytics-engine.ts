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

  /**
   * Calculate outstanding amount (unpaid invoices)
   */
  static async calculateOutstandingAmount(tenantId: string): Promise<number> {
    const invoices = await prisma.dynamicRecord.findMany({
      where: {
        tenantId,
        moduleName: 'Invoices',
        status: 'active',
      },
    });

    return invoices.reduce((total, invoice) => {
      const data = JSON.parse(invoice.data);
      if (data.paymentStatus === 'Pending' || data.paymentStatus === 'Overdue') {
        return total + (data.totalAmount || 0);
      }
      return total;
    }, 0);
  }

  /**
   * Calculate total paid revenue (completed invoices)
   */
  static async calculatePaidRevenue(tenantId: string): Promise<number> {
    const invoices = await prisma.dynamicRecord.findMany({
      where: {
        tenantId,
        moduleName: 'Invoices',
        status: 'active',
      },
    });

    return invoices.reduce((total, invoice) => {
      const data = JSON.parse(invoice.data);
      if (data.paymentStatus === 'Paid') {
        return total + (data.totalAmount || 0);
      }
      return total;
    }, 0);
  }

  /**
   * Count pending quotations (not converted)
   */
  static async countPendingQuotations(tenantId: string): Promise<number> {
    const quotations = await prisma.dynamicRecord.findMany({
      where: {
        tenantId,
        moduleName: 'Quotations',
        status: 'active',
      },
    });

    return quotations.filter(quot => {
      const data = JSON.parse(quot.data);
      return data.status === 'Draft' || data.status === 'Sent';
    }).length;
  }

  /**
   * Count pending orders (not invoiced)
   */
  static async countPendingOrders(tenantId: string): Promise<number> {
    const orders = await prisma.dynamicRecord.findMany({
      where: {
        tenantId,
        moduleName: 'Orders',
        status: 'active',
      },
    });

    return orders.filter(ord => {
      const data = JSON.parse(ord.data);
      return data.status === 'Pending' || data.status === 'Confirmed';
    }).length;
  }

  /**
   * Get finance dashboard metrics
   */
  static async getFinanceDashboardMetrics(tenantId: string) {
    const today = new Date();
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      paidRevenue,
      outstandingAmount,
      pendingQuotations,
      pendingOrders,
      overdueInvoices,
      revenueTrend,
      topClients,
      totalInvoices,
      pendingInvoicesCount,
    ] = await Promise.all([
      this.calculatePaidRevenue(tenantId),
      this.calculateOutstandingAmount(tenantId),
      this.countPendingQuotations(tenantId),
      this.countPendingOrders(tenantId),
      this.getOverdueInvoices(tenantId),
      this.getRevenueTrend(tenantId, last30Days, today),
      this.getTopClientsByRevenue(tenantId, thisMonthStart, thisMonthEnd, 5),
      prisma.dynamicRecord.count({
        where: { tenantId, moduleName: 'Invoices', status: 'active' },
      }),
      this.countPendingInvoices(tenantId),
    ]);

    const overdueAmount = overdueInvoices.reduce(
      (sum, inv) => sum + (inv.totalAmount || 0),
      0
    );

    return {
      kpis: {
        paidRevenue: Math.round(paidRevenue * 100) / 100,
        outstandingAmount: Math.round(outstandingAmount * 100) / 100,
        pendingQuotations,
        pendingOrders,
        overdueInvoices: overdueInvoices.length,
        overdueAmount: Math.round(overdueAmount * 100) / 100,
        totalInvoices,
        pendingInvoicesCount,
      },
      charts: {
        revenueTrend,
        topClients,
      },
      alerts: {
        overdueInvoices: overdueInvoices.slice(0, 10), // Top 10 overdue
      },
    };
  }

  /**
   * Get workflow-level analytics
   * Combines metrics from all modules in a workflow (Sales, Purchase, Custom)
   */
  static async getWorkflowAnalytics(
    tenantId: string,
    workflowName: string,
    startDate: Date,
    endDate: Date
  ) {
    // Get all modules in this workflow
    const modules = await prisma.moduleConfiguration.findMany({
      where: {
        tenantId,
        workflowName,
        status: 'active',
      },
      select: {
        moduleName: true,
        displayName: true,
      },
    });

    const moduleNames = modules.map(m => m.moduleName);

    // Get all records for these modules
    const allRecords = await prisma.dynamicRecord.findMany({
      where: {
        tenantId,
        moduleName: { in: moduleNames },
        status: 'active',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Sales Workflow Analytics
    if (workflowName === 'Sales') {
      return await this.getSalesWorkflowAnalytics(tenantId, startDate, endDate, allRecords);
    }

    // Purchase Workflow Analytics
    if (workflowName === 'Purchase') {
      return await this.getPurchaseWorkflowAnalytics(tenantId, startDate, endDate, allRecords);
    }

    // Custom Workflow Analytics (Generic)
    return await this.getCustomWorkflowAnalytics(tenantId, workflowName, startDate, endDate, allRecords, modules);
  }

  /**
   * Sales Workflow Analytics
   * Pipeline: Leads → Clients → Quotations → Orders → Invoices → Payments
   */
  private static async getSalesWorkflowAnalytics(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    allRecords: any[]
  ) {
    // Count by module
    const leads = allRecords.filter(r => r.moduleName === 'Leads').length;
    const clients = allRecords.filter(r => r.moduleName === 'Clients').length;
    const quotations = allRecords.filter(r => r.moduleName === 'Quotations').length;
    const orders = allRecords.filter(r => r.moduleName === 'Orders').length;
    const invoices = allRecords.filter(r => r.moduleName === 'Invoices').length;
    const payments = allRecords.filter(r => r.moduleName === 'Payments').length;

    // Calculate revenue from orders
    const orderRecords = allRecords.filter(r => r.moduleName === 'Orders');
    const totalRevenue = orderRecords.reduce((sum, order) => {
      const data = JSON.parse(order.data);
      return sum + (data.totalAmount || 0);
    }, 0);

    // Calculate conversion rates
    const leadToClientRate = leads > 0 ? Math.round((clients / leads) * 100) : 0;
    const quotationToOrderRate = quotations > 0 ? Math.round((orders / quotations) * 100) : 0;
    const orderToInvoiceRate = orders > 0 ? Math.round((invoices / orders) * 100) : 0;
    const invoiceToPaymentRate = invoices > 0 ? Math.round((payments / invoices) * 100) : 0;

    // Get revenue trend (last 30 days)
    const revenueTrend = await this.getRevenueTrend(tenantId, startDate, endDate);

    // Get top clients by revenue
    const topClients = await this.getTopClientsByRevenue(tenantId, startDate, endDate, 10);

    // Get invoice status breakdown
    const invoiceRecords = allRecords.filter(r => r.moduleName === 'Invoices');
    const invoiceStatusBreakdown = invoiceRecords.reduce((acc: any, inv) => {
      const data = JSON.parse(inv.data);
      const status = data.paymentStatus || 'Pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Calculate outstanding amount
    const outstandingAmount = invoiceRecords.reduce((sum, inv) => {
      const data = JSON.parse(inv.data);
      if (data.paymentStatus === 'Pending' || data.paymentStatus === 'Overdue') {
        return sum + (data.totalAmount || 0);
      }
      return sum;
    }, 0);

    return {
      workflowName: 'Sales',
      period: { startDate, endDate },
      pipeline: {
        leads,
        clients,
        quotations,
        orders,
        invoices,
        payments,
      },
      conversionRates: {
        leadToClient: leadToClientRate,
        quotationToOrder: quotationToOrderRate,
        orderToInvoice: orderToInvoiceRate,
        invoiceToPayment: invoiceToPaymentRate,
      },
      revenue: {
        total: Math.round(totalRevenue * 100) / 100,
        trend: revenueTrend,
      },
      invoices: {
        statusBreakdown: invoiceStatusBreakdown,
        outstanding: Math.round(outstandingAmount * 100) / 100,
      },
      topClients,
    };
  }

  /**
   * Purchase Workflow Analytics
   * Pipeline: Vendors → Purchase Requests → Purchase Orders → GRN → Vendor Bills → Expenses
   */
  private static async getPurchaseWorkflowAnalytics(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    allRecords: any[]
  ) {
    // Count by module
    const vendors = allRecords.filter(r => r.moduleName === 'Vendors').length;
    const purchaseRequests = allRecords.filter(r => r.moduleName === 'PurchaseRequests').length;
    const purchaseOrders = allRecords.filter(r => r.moduleName === 'PurchaseOrders').length;
    const grns = allRecords.filter(r => r.moduleName === 'GRN').length;
    const vendorBills = allRecords.filter(r => r.moduleName === 'VendorBills').length;

    // Calculate total expenses
    const vendorBillRecords = allRecords.filter(r => r.moduleName === 'VendorBills');
    const totalExpenses = vendorBillRecords.reduce((sum, bill) => {
      const data = JSON.parse(bill.data);
      return sum + (data.totalAmount || 0);
    }, 0);

    // Calculate conversion rates
    const prToPORate = purchaseRequests > 0 ? Math.round((purchaseOrders / purchaseRequests) * 100) : 0;
    const poToGRNRate = purchaseOrders > 0 ? Math.round((grns / purchaseOrders) * 100) : 0;
    const grnToBillRate = grns > 0 ? Math.round((vendorBills / grns) * 100) : 0;

    // Get expense trend by month
    const expenseTrend: any[] = [];
    const monthlyExpenses: Record<string, number> = {};
    
    vendorBillRecords.forEach(bill => {
      const data = JSON.parse(bill.data);
      const month = new Date(bill.createdAt).toISOString().slice(0, 7); // YYYY-MM
      monthlyExpenses[month] = (monthlyExpenses[month] || 0) + (data.totalAmount || 0);
    });

    Object.entries(monthlyExpenses).sort().forEach(([month, amount]) => {
      expenseTrend.push({
        month,
        amount: Math.round(amount * 100) / 100,
      });
    });

    // Get top vendors by spending
    const vendorSpending: Record<string, number> = {};
    vendorBillRecords.forEach(bill => {
      const data = JSON.parse(bill.data);
      const vendorName = data.vendorName || 'Unknown';
      vendorSpending[vendorName] = (vendorSpending[vendorName] || 0) + (data.totalAmount || 0);
    });

    const topVendors = Object.entries(vendorSpending)
      .map(([vendorName, spending]) => ({
        vendorName,
        spending: Math.round(spending * 100) / 100,
      }))
      .sort((a, b) => b.spending - a.spending)
      .slice(0, 10);

    // Payment status breakdown for vendor bills
    const paymentStatusBreakdown = vendorBillRecords.reduce((acc: any, bill) => {
      const data = JSON.parse(bill.data);
      const status = data.paymentStatus || 'Pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Calculate pending payments
    const pendingPayments = vendorBillRecords.reduce((sum, bill) => {
      const data = JSON.parse(bill.data);
      if (data.paymentStatus === 'Pending' || data.paymentStatus === 'Overdue') {
        return sum + (data.totalAmount || 0);
      }
      return sum;
    }, 0);

    return {
      workflowName: 'Purchase',
      period: { startDate, endDate },
      pipeline: {
        vendors,
        purchaseRequests,
        purchaseOrders,
        grns,
        vendorBills,
      },
      conversionRates: {
        prToPO: prToPORate,
        poToGRN: poToGRNRate,
        grnToBill: grnToBillRate,
      },
      expenses: {
        total: Math.round(totalExpenses * 100) / 100,
        trend: expenseTrend,
        pending: Math.round(pendingPayments * 100) / 100,
      },
      paymentStatus: paymentStatusBreakdown,
      topVendors,
    };
  }

  /**
   * Custom Workflow Analytics (Generic)
   * For user-created workflows (HR, Projects, etc.)
   */
  private static async getCustomWorkflowAnalytics(
    tenantId: string,
    workflowName: string,
    startDate: Date,
    endDate: Date,
    allRecords: any[],
    modules: any[]
  ) {
    // Total records count
    const totalRecords = allRecords.length;

    // Records by module
    const recordsByModule = modules.map(module => ({
      moduleName: module.moduleName,
      displayName: module.displayName,
      count: allRecords.filter(r => r.moduleName === module.moduleName).length,
    }));

    // Growth trend by date
    const dailyRecords: Record<string, number> = {};
    allRecords.forEach(record => {
      const date = new Date(record.createdAt).toISOString().slice(0, 10);
      dailyRecords[date] = (dailyRecords[date] || 0) + 1;
    });

    const growthTrend = Object.entries(dailyRecords)
      .sort()
      .map(([date, count]) => ({ date, count }));

    // Try to extract status/category breakdown (if common field exists)
    const statusBreakdown: Record<string, number> = {};
    allRecords.forEach(record => {
      try {
        const data = JSON.parse(record.data);
        const status = data.status || data.category || 'Unknown';
        statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
      } catch {
        statusBreakdown['Unknown'] = (statusBreakdown['Unknown'] || 0) + 1;
      }
    });

    return {
      workflowName,
      period: { startDate, endDate },
      totalRecords,
      recordsByModule,
      growthTrend,
      statusBreakdown,
    };
  }
}
