import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const context = await getTenantContext();
  
  // Only admins can access approval queue
  if (!context || context.userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'review';

    const configs = await prisma.moduleConfiguration.findMany({
      where: {
        status: status as any,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ configs });
  } catch (error: any) {
    console.error('Error fetching approval queue:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
