import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const context = await getTenantContext();
  
  if (!context || !['admin', 'platform_admin'].includes(context.userRole)) {
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
  
  if (!context || !['admin', 'platform_admin'].includes(context.userRole)) {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, subscriptionTier, status, maxUsers, maxStorage } = body;

    const tenant = await prisma.tenant.update({
      where: { id: params.tenantId },
      data: {
        ...(name && { name }),
        ...(subscriptionTier && { subscriptionTier }),
        ...(status && { status }),
        ...(maxUsers && { maxUsers }),
        ...(maxStorage && { maxStorage }),
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

// PATCH for status toggle (activate/deactivate)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const context = await getTenantContext();
  
  // Only platform_admin can activate/deactivate tenants
  if (!context || context.userRole !== 'platform_admin') {
    return NextResponse.json({ error: 'Forbidden - Platform Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { status } = body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const tenant = await prisma.tenant.update({
      where: { id: params.tenantId },
      data: { status },
    });

    return NextResponse.json({ 
      tenant,
      message: `Tenant ${status === 'active' ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error: any) {
    console.error('Error updating tenant status:', error);
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
  
  // DELETE is disabled - use deactivate instead
  return NextResponse.json({ 
    error: 'Delete not allowed - Please deactivate tenant instead to preserve data',
    alternative: 'Use PATCH with status="inactive" to deactivate'
  }, { status: 403 });
}
