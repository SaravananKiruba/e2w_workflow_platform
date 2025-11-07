import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const context = await getTenantContext();
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { moduleName, field } = body;

    if (!moduleName || !field) {
      return NextResponse.json(
        { error: 'moduleName and field required' },
        { status: 400 }
      );
    }

    // Validate field structure
    if (!field.name || !field.label || !field.type) {
      return NextResponse.json(
        { error: 'Field must have name, label, and type' },
        { status: 400 }
      );
    }

    // Get current configuration
    const currentConfig = await prisma.moduleConfiguration.findFirst({
      where: {
        tenantId: context.tenantId,
        moduleName,
        status: 'active',
      },
      orderBy: { version: 'desc' },
    });

    if (!currentConfig) {
      return NextResponse.json(
        { error: `Module ${moduleName} not found` },
        { status: 404 }
      );
    }

    const fields = JSON.parse(currentConfig.fields);

    // Check if field already exists
    if (fields.some((f: any) => f.name === field.name)) {
      return NextResponse.json(
        { error: `Field "${field.name}" already exists` },
        { status: 400 }
      );
    }

    // Add field
    const newField = {
      name: field.name,
      label: field.label,
      type: field.type,
      required: field.required || false,
      uiType: field.uiType || field.type,
      config: field.config || {},
      order: fields.length + 1,
    };

    fields.push(newField);

    // Create new version
    const newVersion = currentConfig.version + 1;
    await prisma.moduleConfiguration.create({
      data: {
        tenantId: context.tenantId,
        moduleName,
        displayName: currentConfig.displayName,
        icon: currentConfig.icon,
        description: currentConfig.description,
        fields: JSON.stringify(fields),
        layouts: currentConfig.layouts,
        validations: currentConfig.validations,
        status: 'active',
        version: newVersion,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        userId: context.userId,
        action: 'add_field',
        entity: moduleName,
        entityId: field.name,
        metadata: JSON.stringify({ fieldType: field.type, version: newVersion }),
      },
    });

    return NextResponse.json({
      message: 'Field added successfully',
      field: newField,
      version: newVersion,
    });
  } catch (error) {
    console.error('Error adding field:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
