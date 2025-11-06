import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { prisma } from '@/lib/prisma';

// Get all module configurations including draft, review, and archived versions
export async function GET(req: NextRequest) {
  const context = await getTenantContext();
  
  if (!context || context.userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const configs = await prisma.moduleConfiguration.findMany({
      where: { tenantId: context.tenantId },
      orderBy: [{ moduleName: 'asc' }, { version: 'desc' }],
    });

    return NextResponse.json({ configs });
  } catch (error) {
    console.error('Error fetching configs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
