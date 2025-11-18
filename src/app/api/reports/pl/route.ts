/**
 * Profit & Loss (P&L) Report API
 * 
 * Automatically calculates P&L from existing data:
 * - Revenue: Sum of all Invoices
 * - Expenses: Sum of all Payments/Purchases
 * - Net Profit: Revenue - Expenses
 * 
 * EPIC 4.1: Auto P&L Report
 * 
 * GET /api/reports/pl?tenantId=xxx&from=YYYY-MM-DD&to=YYYY-MM-DD
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get('tenantId');
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId' },
        { status: 400 }
      );
    }

    // Default to current month if no dates provided
    const now = new Date();
    const fromDate = fromParam ? parseISO(fromParam) : startOfMonth(now);
    const toDate = toParam ? parseISO(toParam) : endOfMonth(now);

    console.log('[P&L API] Calculating for:', {
      tenantId,
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
    });

    // ===== REVENUE CALCULATION =====
    // Get all invoices in the period
    const invoices = await prisma.dynamicRecord.findMany({
      where: {
        tenantId,
        moduleName: 'Invoices',
        status: 'active',
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      select: {
        id: true,
        data: true,
        createdAt: true,
      },
    });

    let totalRevenue = 0;
    const revenueBreakdown: any[] = [];

    invoices.forEach((invoice) => {
      const data = typeof invoice.data === 'string' ? JSON.parse(invoice.data) : invoice.data;
      const amount = parseFloat(data.totalAmount || data.total || data.amount || 0);
      totalRevenue += amount;

      if (amount > 0) {
        revenueBreakdown.push({
          id: invoice.id,
          date: invoice.createdAt,
          description: `Invoice ${data.invoiceNumber || invoice.id.substring(0, 8)}`,
          amount,
        });
      }
    });

    // ===== EXPENSE CALCULATION =====
    // Get payments and purchases
    const payments = await prisma.dynamicRecord.findMany({
      where: {
        tenantId,
        moduleName: { in: ['Payments', 'Purchases', 'Expenses'] },
        status: 'active',
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      select: {
        id: true,
        moduleName: true,
        data: true,
        createdAt: true,
      },
    });

    let totalExpenses = 0;
    const expenseBreakdown: any[] = [];

    payments.forEach((payment) => {
      const data = typeof payment.data === 'string' ? JSON.parse(payment.data) : payment.data;
      const amount = parseFloat(data.totalAmount || data.total || data.amount || 0);
      totalExpenses += amount;

      if (amount > 0) {
        expenseBreakdown.push({
          id: payment.id,
          date: payment.createdAt,
          type: payment.moduleName,
          description: `${payment.moduleName} ${data.paymentNumber || data.referenceNumber || payment.id.substring(0, 8)}`,
          amount,
        });
      }
    });

    // ===== NET PROFIT =====
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Build response
    const plReport = {
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
      },
      revenue: {
        total: totalRevenue,
        count: invoices.length,
        breakdown: revenueBreakdown.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
      },
      expenses: {
        total: totalExpenses,
        count: payments.length,
        breakdown: expenseBreakdown.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
      },
      status: netProfit >= 0 ? 'profit' : 'loss',
    };

    console.log('[P&L API] Summary:', {
      revenue: totalRevenue,
      expenses: totalExpenses,
      profit: netProfit,
      margin: profitMargin.toFixed(2) + '%',
    });

    return NextResponse.json(plReport);
  } catch (error) {
    console.error('[P&L API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate P&L report' },
      { status: 500 }
    );
  }
}
