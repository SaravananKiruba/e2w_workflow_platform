import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext, validateTenantAccess } from '@/lib/tenant-context';
import { ModuleConfigService } from '@/lib/metadata/module-config-service';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const context = await getTenantContext();
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const moduleName = searchParams.get('moduleName');
  const tenantId = searchParams.get('tenantId');

  // If moduleName is provided, fetch specific module config
  if (moduleName && tenantId) {
    if (!validateTenantAccess(context, tenantId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
      const moduleConfig = await prisma.moduleConfiguration.findFirst({
        where: {
          tenantId,
          moduleName,
          status: 'active',
        },
        orderBy: { version: 'desc' },
      });

      if (!moduleConfig) {
        return NextResponse.json(
          { error: `Module ${moduleName} not found or not active` },
          { status: 404 }
        );
      }

      const config = {
        moduleName: moduleConfig.moduleName,
        displayName: moduleConfig.displayName,
        icon: moduleConfig.icon,
        description: moduleConfig.description,
        fields: JSON.parse(moduleConfig.fields),
        layouts: moduleConfig.layouts ? JSON.parse(moduleConfig.layouts) : null,
        validations: moduleConfig.validations
          ? JSON.parse(moduleConfig.validations)
          : null,
        status: moduleConfig.status,
        version: moduleConfig.version,
      };

      return NextResponse.json(config);
    } catch (error) {
      console.error('Error fetching module config:', error);
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'Failed to fetch module config',
        },
        { status: 500 }
      );
    }
  }

  // Otherwise, fetch all modules for tenant
  try {
    const modules = await ModuleConfigService.getAllModules(context.tenantId);
    return NextResponse.json({ modules });
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
