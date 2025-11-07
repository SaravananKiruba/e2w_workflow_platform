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
  isActive: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  const context = await getTenantContext();
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const workflow = await prisma.workflow.findFirst({
      where: {
        id: params.workflowId,
        tenantId: context.tenantId,
      },
      include: {
        executions: {
          take: 10,
          orderBy: { executedAt: 'desc' },
        },
      },
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    return NextResponse.json({ workflow });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  const context = await getTenantContext();
  
  if (!context || !['admin', 'manager'].includes(context.userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = workflowSchema.parse(body);

    const workflow = await prisma.workflow.update({
      where: {
        id: params.workflowId,
      },
      data: {
        name: validated.name,
        description: validated.description,
        moduleName: validated.moduleName,
        trigger: JSON.stringify(validated.trigger),
        conditions: validated.conditions ? JSON.stringify(validated.conditions) : null,
        actions: JSON.stringify(validated.actions),
        isActive: validated.isActive ?? true,
        priority: validated.priority || 0,
      },
    });

    return NextResponse.json({ workflow });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error updating workflow:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  const context = await getTenantContext();
  
  if (!context || !['admin', 'manager'].includes(context.userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await prisma.workflow.delete({
      where: {
        id: params.workflowId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
