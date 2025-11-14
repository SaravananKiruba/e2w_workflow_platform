import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const context = await getTenantContext();
  
  // Only platform admins can access all tenants
  if (!context || context.userRole !== 'platform_admin') {
    return NextResponse.json({ error: 'Forbidden - Platform Admin access required' }, { status: 403 });
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
  
  if (!context || context.userRole !== 'platform_admin') {
    return NextResponse.json({ error: 'Forbidden - Platform Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, slug, subscriptionTier, status } = body;

    // Validation
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    if (typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Tenant name must be at least 2 characters' },
        { status: 400 }
      );
    }

    if (typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: `Tenant slug "${slug}" already exists. Please use a different slug.` },
        { status: 409 }
      );
    }

    const tenant = await prisma.tenant.create({
      data: {
        name: name.trim(),
        slug: slug.toLowerCase(),
        subscriptionTier: subscriptionTier || 'free',
        status: status || 'active',
      },
    });

    return NextResponse.json({ tenant }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating tenant:', error);
    
    // Check for unique constraint error
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      return NextResponse.json(
        { error: `Tenant ${field} already exists. Please use a different value.` },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create tenant. Please try again.' },
      { status: 500 }
    );
  }
}
