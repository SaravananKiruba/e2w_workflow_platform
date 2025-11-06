import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { ModuleConfigService } from '@/lib/metadata/module-config-service';

export async function GET(
  req: NextRequest,
  { params }: { params: { moduleName: string } }
) {
  const context = await getTenantContext();
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const config = await ModuleConfigService.getModuleConfig(
      context.tenantId,
      params.moduleName
    );

    if (!config) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error fetching module config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { moduleName: string } }
) {
  const context = await getTenantContext();
  if (!context || context.userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const config = await ModuleConfigService.saveModuleConfig(
      context.tenantId,
      {
        ...body,
        moduleName: params.moduleName,
      },
      context.userId
    );

    return NextResponse.json({ config });
  } catch (error: any) {
    console.error('Error saving module config:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
