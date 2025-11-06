import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const workflowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  moduleName: z.string(),
  trigger: z.object({
    type: z.enum(['onCreate', 'onUpdate', 'onDelete', 'onStatusChange', 'onFieldChange', 'scheduled']),
    field: z.string().optional(),
    schedule: z.string().optional(),
  }),
  conditions: z.object({
    operator: z.enum(['AND', 'OR']),
    rules: z.array(z.object({
      field: z.string(),
      operator: z.enum(['equals', 'notEquals', 'contains', 'greaterThan', 'lessThan', 'in', 'notIn']),
      value: z.any(),
    })),
  }).optional(),
  actions: z.array(z.object({
    type: z.enum(['sendEmail', 'updateRecord', 'createRecord', 'webhook', 'notification']),
    config: z.record(z.any()),
  })),
  priority: z.number().optional(),
});

export async function GET(req: NextRequest) {
  const context = await getTenantContext();
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const moduleName = searchParams.get('module');

    const workflows = await prisma.workflow.findMany({
      where: {
        tenantId: context.tenantId,
        ...(moduleName && { moduleName }),
      },
      orderBy: [{ isActive: 'desc' }, { priority: 'desc' }],
    });

    return NextResponse.json({ workflows });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const context = await getTenantContext();
  
  if (!context || !['admin', 'manager'].includes(context.userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = workflowSchema.parse(body);

    const workflow = await prisma.workflow.create({
      data: {
        tenantId: context.tenantId,
        name: validated.name,
        description: validated.description,
        moduleName: validated.moduleName,
        trigger: JSON.stringify(validated.trigger),
        conditions: validated.conditions ? JSON.stringify(validated.conditions) : null,
        actions: JSON.stringify(validated.actions),
        isActive: true,
        priority: validated.priority || 0,
        createdBy: context.userId,
      },
    });

    return NextResponse.json({ workflow }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating workflow:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
