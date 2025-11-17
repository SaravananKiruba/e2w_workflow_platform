import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET: Fetch all custom modules for the tenant
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use raw query to avoid TypeScript issues with new fields
    const modules: any[] = await prisma.$queryRaw`
      SELECT * FROM module_configurations
      WHERE tenantId = ${session.user.tenantId}
      AND status = 'active'
      ORDER BY workflowCategory ASC, position ASC
    `;

    // Parse JSON fields
    const parsedModules = modules.map(module => ({
      ...module,
      allowedRoles: module.allowedRoles ? JSON.parse(module.allowedRoles) : ['manager', 'owner', 'staff'],
    }));

    return NextResponse.json({ modules: parsedModules });
  } catch (error) {
    console.error('Error fetching custom modules:', error);
    return NextResponse.json({ error: 'Failed to fetch modules' }, { status: 500 });
  }
}

// POST: Create a new custom module
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Tenant Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const {
      moduleName,
      displayName,
      icon,
      description,
      workflowCategory,
      insertAfter,
      allowedRoles,
      fields,
    } = body;

    // Validate required fields
    if (!moduleName || !displayName) {
      return NextResponse.json({ error: 'Module name and display name are required' }, { status: 400 });
    }

    // Check if module name already exists for this tenant
    const existingModule = await prisma.moduleConfiguration.findFirst({
      where: {
        tenantId: session.user.tenantId,
        moduleName,
        status: 'active',
      },
    });

    if (existingModule) {
      return NextResponse.json({ error: 'Module with this name already exists' }, { status: 400 });
    }

    // Calculate position based on insertAfter
    let position = 999; // Default to end
    
    if (insertAfter) {
      const afterModules: any[] = await prisma.$queryRaw`
        SELECT * FROM module_configurations
        WHERE tenantId = ${session.user.tenantId}
        AND moduleName = ${insertAfter}
        AND status = 'active'
        ORDER BY version DESC
        LIMIT 1
      `;

      if (afterModules.length > 0) {
        const afterModule = afterModules[0];
        position = afterModule.position + 1;

        // Shift other modules in same workflow down
        await prisma.$executeRaw`
          UPDATE module_configurations
          SET position = position + 1
          WHERE tenantId = ${session.user.tenantId}
          AND workflowCategory = ${workflowCategory || 'Custom'}
          AND position >= ${position}
          AND status = 'active'
        `;
      }
    }

    // Default field configuration if not provided
    const defaultFields = fields || JSON.stringify([
      {
        name: 'name',
        label: 'Name',
        type: 'text',
        required: true,
        searchable: true,
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        required: false,
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: ['Active', 'Inactive'],
        defaultValue: 'Active',
      },
    ]);

    const fieldsStr = typeof fields === 'string' ? fields : defaultFields;
    const allowedRolesStr = JSON.stringify(allowedRoles || ['manager', 'owner', 'staff']);
    const id = `cm${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Insert using raw query
    await prisma.$executeRaw`
      INSERT INTO module_configurations (
        id, tenantId, moduleName, displayName, icon, description,
        workflowCategory, workflowName, position, insertAfter, showInNav, allowedRoles,
        isCustomModule, isCustomized, fields, status, version, createdAt, updatedAt, createdBy
      ) VALUES (
        ${id}, ${session.user.tenantId}, ${moduleName}, ${displayName}, ${icon || 'FiGrid'},
        ${description || ''}, ${workflowCategory || 'Custom'}, ${workflowCategory || 'Custom'}, 
        ${position}, ${insertAfter || null}, ${true}, ${allowedRolesStr}, ${true}, ${false}, 
        ${fieldsStr}, ${'active'}, ${1}, ${now}, ${now}, ${session.user.id}
      )
    `;

    const newModule: any[] = await prisma.$queryRaw`
      SELECT * FROM module_configurations WHERE id = ${id}
    `;

    return NextResponse.json({
      message: 'Custom module created successfully',
      module: {
        ...newModule[0],
        allowedRoles: JSON.parse(newModule[0].allowedRoles || '[]'),
      },
    });
  } catch (error) {
    console.error('Error creating custom module:', error);
    return NextResponse.json({ error: 'Failed to create module' }, { status: 500 });
  }
}

// PUT: Update an existing custom module
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Tenant Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Module ID is required' }, { status: 400 });
    }

    // Verify module belongs to tenant
    const existingModules: any[] = await prisma.$queryRaw`
      SELECT * FROM module_configurations
      WHERE id = ${id} AND tenantId = ${session.user.tenantId}
    `;

    if (existingModules.length === 0) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Build update query dynamically
    const now = new Date().toISOString();
    let updateParts: string[] = [];
    let updateValues: any[] = [];
    
    if (updates.displayName) {
      updateParts.push('displayName = ?');
      updateValues.push(updates.displayName);
    }
    if (updates.icon) {
      updateParts.push('icon = ?');
      updateValues.push(updates.icon);
    }
    if (updates.description !== undefined) {
      updateParts.push('description = ?');
      updateValues.push(updates.description);
    }
    if (updates.workflowCategory) {
      updateParts.push('workflowCategory = ?');
      updateValues.push(updates.workflowCategory);
      updateParts.push('workflowName = ?');
      updateValues.push(updates.workflowCategory);
    }
    if (updates.showInNav !== undefined) {
      updateParts.push('showInNav = ?');
      updateValues.push(updates.showInNav);
    }
    if (updates.allowedRoles) {
      updateParts.push('allowedRoles = ?');
      updateValues.push(JSON.stringify(updates.allowedRoles));
    }
    if (updates.fields) {
      updateParts.push('fields = ?');
      updateValues.push(typeof updates.fields === 'string' ? updates.fields : JSON.stringify(updates.fields));
    }

    // Handle position change if insertAfter is specified
    if (updates.insertAfter !== undefined) {
      const afterModules: any[] = await prisma.$queryRaw`
        SELECT * FROM module_configurations
        WHERE tenantId = ${session.user.tenantId}
        AND moduleName = ${updates.insertAfter}
        AND status = 'active'
        ORDER BY version DESC
        LIMIT 1
      `;

      if (afterModules.length > 0) {
        updateParts.push('position = ?');
        updateValues.push(afterModules[0].position + 1);
        updateParts.push('insertAfter = ?');
        updateValues.push(updates.insertAfter);
      }
    }

    updateParts.push('updatedAt = ?');
    updateValues.push(now);
    updateParts.push('updatedBy = ?');
    updateValues.push(session.user.id);
    updateValues.push(id);

    if (updateParts.length > 0) {
      const query = `UPDATE module_configurations SET ${updateParts.join(', ')} WHERE id = ?`;
      await prisma.$executeRawUnsafe(query, ...updateValues);
    }

    const updatedModules: any[] = await prisma.$queryRaw`
      SELECT * FROM module_configurations WHERE id = ${id}
    `;

    return NextResponse.json({
      message: 'Module updated successfully',
      module: {
        ...updatedModules[0],
        allowedRoles: JSON.parse(updatedModules[0].allowedRoles || '[]'),
      },
    });
  } catch (error) {
    console.error('Error updating custom module:', error);
    return NextResponse.json({ error: 'Failed to update module' }, { status: 500 });
  }
}

// DELETE: Delete a custom module (soft delete - set status to archived)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Tenant Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Module ID is required' }, { status: 400 });
    }

    // Verify module belongs to tenant and is custom
    const existingModules: any[] = await prisma.$queryRaw`
      SELECT * FROM module_configurations
      WHERE id = ${id}
      AND tenantId = ${session.user.tenantId}
      AND isCustomModule = 1
    `;

    if (existingModules.length === 0) {
      return NextResponse.json({ error: 'Custom module not found' }, { status: 404 });
    }

    // Soft delete - archive the module
    const now = new Date().toISOString();
    await prisma.$executeRaw`
      UPDATE module_configurations
      SET status = 'archived', showInNav = 0, updatedAt = ${now}, updatedBy = ${session.user.id}
      WHERE id = ${id}
    `;

    return NextResponse.json({ message: 'Module deleted successfully' });
  } catch (error) {
    console.error('Error deleting custom module:', error);
    return NextResponse.json({ error: 'Failed to delete module' }, { status: 500 });
  }
}
