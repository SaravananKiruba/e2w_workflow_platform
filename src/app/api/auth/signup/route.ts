import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  tenantName: z.string().min(2),
  tenantSlug: z.string().min(2).regex(/^[a-z0-9-]+$/),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = signupSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Check if tenant slug is available
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: validatedData.tenantSlug },
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: 'Tenant slug already taken' },
        { status: 400 }
      );
    }

    // Create tenant and user in transaction
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: validatedData.tenantName,
          slug: validatedData.tenantSlug,
          status: 'active',
          subscriptionTier: 'free',
        },
      });

      // Create user
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          name: validatedData.name,
          password: hashedPassword,
          tenantId: tenant.id,
          role: 'admin',
          status: 'active',
        },
      });

      return { tenant, user };
    });

    return NextResponse.json({
      message: 'Account created successfully',
      tenantId: result.tenant.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
