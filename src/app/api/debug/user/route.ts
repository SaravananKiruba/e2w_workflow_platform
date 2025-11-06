import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if demo user exists
    const user = await prisma.user.findUnique({
      where: { email: 'demo@easy2work.com' },
    });

    if (!user) {
      return NextResponse.json({
        status: 'error',
        message: 'Demo user not found',
      });
    }

    return NextResponse.json({
      status: 'success',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenantId,
        role: user.role,
        status: user.status,
        hasPassword: !!user.password,
      },
    });
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    return NextResponse.json({
      status: 'error',
      message: String(error),
    });
  }
}
