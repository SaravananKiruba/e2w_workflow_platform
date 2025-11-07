import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const context = await getTenantContext();
  
  if (!context || context.userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: params.tenantId },
      include: {
        _count: {
          select: {
            users: true,
            modules: true,
            workflows: true,
            branches: true,
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json({ tenant });
  } catch (error: any) {
    console.error('Error fetching tenant:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const context = await getTenantContext();
  
  if (!context || context.userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, subscriptionTier, status } = body;

    const tenant = await prisma.tenant.update({
      where: { id: params.tenantId },
      data: {
        ...(name && { name }),
        ...(subscriptionTier && { subscriptionTier }),
        ...(status && { status }),
      },
    });

    return NextResponse.json({ tenant });
  } catch (error: any) {
    console.error('Error updating tenant:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const context = await getTenantContext();
  
  if (!context || context.userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  try {
    // Note: In production, you might want to soft delete or archive instead
    await prisma.tenant.delete({
      where: { id: params.tenantId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting tenant:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
