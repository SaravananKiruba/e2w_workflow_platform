/**
 * Module Analytics API
 * 
 * Provides analytics data for any module:
 * - Total count
 * - Total sales/revenue (for sales modules)
 * - Total purchases/expenses (for purchase modules)
 * - Month-over-month trends
 * 
 * GET /api/modules/[moduleName]/analytics?tenantId=xxx&period=month
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';

export async function GET(
  request: NextRequest,
  { params }: { params: { moduleName: string } }
) {
  try {
    const { moduleName } = params;
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get('tenantId');
    const period = searchParams.get('period') || 'month'; // month, quarter, year

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId' },
        { status: 400 }
      );
    }

    // Calculate date ranges
    const now = new Date();
    const currentPeriodStart = startOfMonth(now);
    const currentPeriodEnd = endOfMonth(now);
    const previousPeriodStart = startOfMonth(subMonths(now, 1));
    const previousPeriodEnd = endOfMonth(subMonths(now, 1));

    // Get all records for current period
    const currentRecords = await prisma.dynamicRecord.findMany({
      where: {
        tenantId,
        moduleName,
        status: 'active',
        createdAt: {
          gte: currentPeriodStart,
          lte: currentPeriodEnd,
        },
      },
      select: {
        id: true,
        data: true,
        createdAt: true,
      },
    });

    // Get all records for previous period
    const previousRecords = await prisma.dynamicRecord.findMany({
      where: {
        tenantId,
        moduleName,
        status: 'active',
        createdAt: {
          gte: previousPeriodStart,
          lte: previousPeriodEnd,
        },
      },
      select: {
        id: true,
        data: true,
      },
    });

    // Get total count (all time)
    const totalCount = await prisma.dynamicRecord.count({
      where: {
        tenantId,
        moduleName,
        status: 'active',
      },
    });

    // Calculate monetary totals based on module type
    const isSalesModule = ['Quotations', 'Orders', 'Invoices'].includes(moduleName);
    const isPurchaseModule = ['Payments', 'Purchases', 'Expenses'].includes(moduleName);

    let currentTotal = 0;
    let previousTotal = 0;

    if (isSalesModule || isPurchaseModule) {
      // Look for totalAmount, total, amount, or similar fields
      currentTotal = currentRecords.reduce((sum, record) => {
        const data = typeof record.data === 'string' ? JSON.parse(record.data) : record.data;
        const amount = data.totalAmount || data.total || data.amount || 0;
        return sum + (parseFloat(amount) || 0);
      }, 0);

      previousTotal = previousRecords.reduce((sum, record) => {
        const data = typeof record.data === 'string' ? JSON.parse(record.data) : record.data;
        const amount = data.totalAmount || data.total || data.amount || 0;
        return sum + (parseFloat(amount) || 0);
      }, 0);
    }

    // Calculate trends
    const countTrend = previousRecords.length > 0
      ? ((currentRecords.length - previousRecords.length) / previousRecords.length) * 100
      : 0;

    const amountTrend = previousTotal > 0
      ? ((currentTotal - previousTotal) / previousTotal) * 100
      : 0;

    // Build response
    const analytics = {
      moduleName,
      period: 'month',
      totalCount,
      currentPeriod: {
        count: currentRecords.length,
        total: currentTotal,
        startDate: currentPeriodStart.toISOString(),
        endDate: currentPeriodEnd.toISOString(),
      },
      previousPeriod: {
        count: previousRecords.length,
        total: previousTotal,
        startDate: previousPeriodStart.toISOString(),
        endDate: previousPeriodEnd.toISOString(),
      },
      trends: {
        countChange: countTrend,
        amountChange: amountTrend,
      },
      isSalesModule,
      isPurchaseModule,
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('[Module Analytics API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
