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
    const newPassword = body?.password;

    // Password is required
    if (!newPassword) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Validate password length
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: adminUser.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      message: 'Tenant admin password reset successfully',
      email: adminUser.email,
      password: newPassword,
    });
  } catch (error: any) {
    console.error('Reset admin password error:', error);
    return NextResponse.json({ error: 'Failed to reset password', details: error.message }, { status: 500 });
  }
}
