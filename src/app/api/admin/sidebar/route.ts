import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';

// GET /api/admin/sidebar - Get sidebar configuration for current role
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || tenantContext.userRole || 'USER';

    // Get sidebar configuration for role
    const sidebarConfig = await prisma.sidebarConfiguration.findFirst({
      where: {
        tenantId: tenantContext.tenantId,
        role,
        isActive: true,
      },
    });

    if (!sidebarConfig) {
      // Return default configuration
      const defaultConfig = getDefaultSidebarConfig(role);
      return NextResponse.json({ items: defaultConfig });
    }

    return NextResponse.json({
      items: JSON.parse(sidebarConfig.items),
      role: sidebarConfig.role,
    });
  } catch (error: any) {
    console.error('Error fetching sidebar config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/sidebar - Update sidebar configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 });
    }

    // Check if user is tenant admin or platform admin
    const userRole = tenantContext.userRole || 'USER';
    if (userRole !== 'TENANT_ADMIN' && userRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { role, items } = body;

    if (!role || !items) {
      return NextResponse.json({ error: 'Role and items are required' }, { status: 400 });
    }

    // Upsert sidebar configuration
    const config = await prisma.sidebarConfiguration.upsert({
      where: {
        tenantId_role: {
          tenantId: tenantContext.tenantId,
          role,
        },
      },
      update: {
        items: JSON.stringify(items),
        updatedAt: new Date(),
      },
      create: {
        tenantId: tenantContext.tenantId,
        role,
        items: JSON.stringify(items),
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      configId: config.id,
    });
  } catch (error: any) {
    console.error('Error saving sidebar config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to get default sidebar configuration
function getDefaultSidebarConfig(role: string) {
  const baseItems = [
    { label: 'Dashboard', icon: 'FiHome', path: '/dashboard', order: 1 },
    { label: 'Leads', icon: 'FiUsers', path: '/modules/Leads', order: 2 },
    { label: 'Clients', icon: 'FiBriefcase', path: '/modules/Clients', order: 3 },
    { label: 'Quotations', icon: 'FiFileText', path: '/modules/Quotations', order: 4 },
    { label: 'Orders', icon: 'FiShoppingCart', path: '/modules/Orders', order: 5 },
    { label: 'Invoices', icon: 'FiDollarSign', path: '/modules/Invoices', order: 6 },
  ];

  if (role === 'TENANT_ADMIN' || role === 'admin') {
    baseItems.push(
      { label: 'Users', icon: 'FiUser', path: '/tenant-admin/users', order: 7 },
      { label: 'Field Builder', icon: 'FiSettings', path: '/tenant-admin/field-builder', order: 8 },
      { label: 'Workflows', icon: 'FiGitBranch', path: '/tenant-admin/workflow-builder', order: 9 }
    );
  }

  if (role === 'PLATFORM_ADMIN' || role === 'platform_admin') {
    baseItems.push(
      { label: 'Tenants', icon: 'FiDatabase', path: '/platform-admin/tenants', order: 10 },
      { label: 'Approval Queue', icon: 'FiCheckCircle', path: '/platform-admin/approval-queue', order: 11 }
    );
  }

  return baseItems;
}
