import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

async function handleChangePassword(req: NextRequest) {
  try {
    // Get user info from request headers (set by middleware)
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');

    console.log('[Change Password] userId:', userId, 'userRole:', userRole);
    console.log('[Change Password] All headers:', {
      'x-user-id': req.headers.get('x-user-id'),
      'x-user-role': req.headers.get('x-user-role'),
      'x-tenant-id': req.headers.get('x-tenant-id'),
    });

    // Only authenticated users can change their password
    if (!userId || !userRole) {
      console.log('[Change Password] Missing auth headers');
      return NextResponse.json({ error: 'Unauthorized - missing auth headers' }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    // Validation
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Get current user with password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
        email: true,
      },
    });

    if (!user) {
      console.log('[Change Password] User not found:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password || '');

    if (!passwordMatch) {
      console.log('[Change Password] Password mismatch for user:', userId);
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Check if new password is same as current
    const newPasswordSame = await bcrypt.compare(newPassword, user.password || '');

    if (newPasswordSame) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    console.log('[Change Password] Success for user:', userId);
    return NextResponse.json(
      { message: 'Password changed successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Change Password] Error:', error);
    return NextResponse.json(
      { error: 'Failed to change password', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return handleChangePassword(req);
}

export async function PATCH(req: NextRequest) {
  return handleChangePassword(req);
}
