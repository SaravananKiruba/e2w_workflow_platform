import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { prisma } from '@/lib/prisma';
import { seedDefaultModules } from '@/lib/seed-default-modules';

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
    const { name, slug, subscriptionTier, status, domain, maxUsers, maxStorage, settings, branding } = body;

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

    // Generate random password for tenant admin
    const bcrypt = require('bcrypt');
    const crypto = require('crypto');
    const randomPassword = crypto.randomBytes(8).toString('hex'); // 16 char random password
    const hashedPassword = await bcrypt.hash(randomPassword, 10);
    
    // Generate tenant admin email
    const adminEmail = `admin@${slug}.easy2work.com`;

    // Create tenant and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: name.trim(),
          slug: slug.toLowerCase(),
          domain: domain || `${slug}.easy2work.com`,
          subscriptionTier: subscriptionTier || 'free',
          status: status || 'active',
          maxUsers: maxUsers || 10,
          maxStorage: maxStorage || 1000,
          settings: settings ? JSON.stringify(settings) : JSON.stringify({
            timezone: 'Asia/Kolkata',
            currency: 'INR',
            dateFormat: 'DD/MM/YYYY',
          }),
          branding: branding ? JSON.stringify(branding) : null,
          createdBy: context.userId,
        },
      });

      // Create tenant admin user
      const adminUser = await tx.user.create({
        data: {
          email: adminEmail,
          name: `${name} Admin`,
          password: hashedPassword,
          tenantId: tenant.id,
          role: 'admin',
          status: 'active',
        },
      });

      // Initialize auto-numbering sequences
      const autoNumberModules = [
        // Sales Workflow
        { moduleName: 'Leads', prefix: 'LD', format: '{prefix}-{padded:5}' },
        { moduleName: 'Clients', prefix: 'CL', format: '{prefix}-{padded:5}' },
        { moduleName: 'Quotations', prefix: 'QT', format: '{prefix}-{padded:5}' },
        { moduleName: 'Orders', prefix: 'ORD', format: '{prefix}-{padded:5}' },
        { moduleName: 'Invoices', prefix: 'INV', format: '{prefix}/{year}/{padded:3}' },
        { moduleName: 'Payments', prefix: 'TXN', format: '{prefix}-{padded:5}' },
        // Purchase Workflow
        { moduleName: 'Vendors', prefix: 'VND', format: '{prefix}-{padded:5}' },
        { moduleName: 'PurchaseRequests', prefix: 'PR', format: '{prefix}-{padded:5}' },
        { moduleName: 'PurchaseOrders', prefix: 'PO', format: '{prefix}-{padded:5}' },
        { moduleName: 'GoodsReceipt', prefix: 'GR', format: '{prefix}-{padded:5}' },
        { moduleName: 'VendorBills', prefix: 'VB', format: '{prefix}/{year}/{padded:3}' },
        { moduleName: 'VendorPayments', prefix: 'VP', format: '{prefix}-{padded:5}' },
      ];

      for (const module of autoNumberModules) {
        await tx.autoNumberSequence.create({
          data: {
            tenantId: tenant.id,
            moduleName: module.moduleName,
            prefix: module.prefix,
            format: module.format,
            nextNumber: 1,
          },
        });
      }

      return { tenant, adminUser };
    });

    // Seed default modules after transaction (outside transaction for better error handling)
    await seedDefaultModules(prisma, result.tenant.id, result.adminUser.id);

    // Return tenant info with admin credentials
    return NextResponse.json({
      tenant: result.tenant,
      adminCredentials: {
        email: adminEmail,
        password: randomPassword, // Send plaintext password once for platform admin to share
        message: 'Please share these credentials with the tenant admin. They can reset the password after first login.',
      },
    }, { status: 201 });
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
