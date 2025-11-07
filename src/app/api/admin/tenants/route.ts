import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const context = await getTenantContext();
  
  // Only system admins can access all tenants
  if (!context || context.userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [tenants, totalCount] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          _count: {
            select: {
              users: true,
              modules: true,
              workflows: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.tenant.count({ where }),
    ]);

    return NextResponse.json({
      tenants,
      totalCount,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const context = await getTenantContext();
  
  if (!context || context.userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, slug, subscriptionTier, status } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        subscriptionTier: subscriptionTier || 'free',
        status: status || 'active',
      },
    });

    return NextResponse.json({ tenant }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating tenant:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
