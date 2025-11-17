import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET: Fetch all workflow categories for the tenant
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflows = await prisma.workflowCategory.findMany({
      where: {
        OR: [
          { tenantId: session.user.tenantId },
          { tenantId: null, isSystem: true }, // Include system defaults
        ],
        isActive: true,
      },
      orderBy: [
        { isSystem: 'desc' }, // System workflows first
        { name: 'asc' },
      ],
    });

    return NextResponse.json({ workflows });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 });
  }
}

// POST: Create a new custom workflow
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Tenant Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { name, displayName, description, icon, moduleSequence } = body;

    // Validate required fields
    if (!name || !displayName) {
      return NextResponse.json({ error: 'Name and display name are required' }, { status: 400 });
    }

    // Check if workflow already exists
    const existingWorkflow = await prisma.workflowCategory.findFirst({
      where: {
        tenantId: session.user.tenantId,
        name,
      },
    });

    if (existingWorkflow) {
      return NextResponse.json({ error: 'Workflow with this name already exists' }, { status: 400 });
    }

    const workflow = await prisma.workflowCategory.create({
      data: {
        tenantId: session.user.tenantId,
        name,
        displayName,
        description: description || '',
        icon: icon || 'FiGrid',
        isSystem: false,
        moduleSequence: moduleSequence ? JSON.stringify(moduleSequence) : '[]',
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({
      message: 'Workflow category created successfully',
      workflow,
    });
  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 });
  }
}

// PUT: Update an existing workflow
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Tenant Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { id, displayName, description, icon, moduleSequence } = body;

    if (!id) {
      return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 });
    }

    // Verify workflow belongs to tenant and is not a system workflow
    const existingWorkflow = await prisma.workflowCategory.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
        isSystem: false, // Can't edit system workflows
      },
    });

    if (!existingWorkflow) {
      return NextResponse.json({ error: 'Workflow not found or cannot be edited' }, { status: 404 });
    }

    const updatedWorkflow = await prisma.workflowCategory.update({
      where: { id },
      data: {
        displayName: displayName || existingWorkflow.displayName,
        description: description !== undefined ? description : existingWorkflow.description,
        icon: icon || existingWorkflow.icon,
        moduleSequence: moduleSequence ? JSON.stringify(moduleSequence) : existingWorkflow.moduleSequence,
      },
    });

    return NextResponse.json({
      message: 'Workflow updated successfully',
      workflow: updatedWorkflow,
    });
  } catch (error) {
    console.error('Error updating workflow:', error);
    return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 });
  }
}

// DELETE: Soft delete a workflow (only custom workflows)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Tenant Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 });
    }

    // Verify workflow belongs to tenant and is not system
    const workflow = await prisma.workflowCategory.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
        isSystem: false,
      },
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found or cannot be deleted' }, { status: 404 });
    }

    // Soft delete
    await prisma.workflowCategory.update({
      where: { id },
      data: { isActive: false },
    });

    // Also hide all modules in this workflow
    await prisma.$executeRaw`
      UPDATE module_configurations
      SET showInNav = 0, status = 'archived'
      WHERE tenantId = ${session.user.tenantId}
      AND workflowCategory = ${workflow.name}
    `;

    return NextResponse.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 });
  }
}
