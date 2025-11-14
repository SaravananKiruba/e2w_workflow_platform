import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest, { params }: { params: { tenantId: string } }) {
  try {
    // Auth is handled by middleware which sets headers
    const userRole = req.headers.get('x-user-role');
    const userId = req.headers.get('x-user-id');

    if (!userRole || userRole !== 'platform_admin') {
      return NextResponse.json({ error: 'Forbidden - Platform admin required' }, { status: 403 });
    }

    const tenantId = params.tenantId;

    // Find tenant admin user for the tenant
    const adminUser = await prisma.user.findFirst({
      where: {
        tenantId,
        role: 'admin',
        status: 'active',
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Tenant admin user not found' }, { status: 404 });
    }

    const body = await req.json();
    let newPassword = body?.password;

    // If no password provided, generate a random one
    if (!newPassword) {
      const crypto = await import('crypto');
      newPassword = crypto.randomBytes(8).toString('hex');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: adminUser.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      message: 'Tenant admin password reset',
      email: adminUser.email,
      password: newPassword,
    });
  } catch (error: any) {
    console.error('Reset admin password error:', error);
    return NextResponse.json({ error: 'Failed to reset password', details: error.message }, { status: 500 });
  }
}
