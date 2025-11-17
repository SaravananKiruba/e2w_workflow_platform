import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const moduleName = searchParams.get('moduleName');
  const tenantId = searchParams.get('tenantId');

  // If moduleName is provided, fetch specific module config
  if (moduleName && tenantId) {
    if (session.user.tenantId !== tenantId) {
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
    const userRole = session.user.role || 'staff';
    
    // Get all active modules for this tenant
    // Order: Sales, Purchase, then Custom (Custom comes last)
    const modules: any[] = await prisma.$queryRaw`
      SELECT * FROM module_configurations
      WHERE tenantId = ${session.user.tenantId}
      AND status = 'active'
      ORDER BY 
        CASE workflowCategory
          WHEN 'Sales' THEN 1
          WHEN 'Purchase' THEN 2
          WHEN 'Custom' THEN 3
          ELSE 4
        END,
        position ASC
    `;

    // Filter by role permissions (except for admins who see everything)
    const filteredModules = userRole === 'admin'
      ? modules
      : modules.filter(module => {
          if (!module.showInNav) return false;
          if (!module.allowedRoles) return true;
          
          try {
            const allowedRoles = JSON.parse(module.allowedRoles);
            // Map user role to permission format
            const roleMap: Record<string, string> = {
              'manager': 'manager',
              'owner': 'owner',
              'staff': 'staff',
            };
            return allowedRoles.includes(roleMap[userRole] || 'staff');
          } catch {
            return true;
          }
        });

    const parsedModules = filteredModules.map(module => ({
      id: module.id,
      moduleName: module.moduleName,
      displayName: module.displayName,
      icon: module.icon,
      description: module.description,
      workflowCategory: module.workflowCategory,
      workflowName: module.workflowName,
      position: module.position,
      showInNav: Boolean(module.showInNav),
      allowedRoles: module.allowedRoles ? JSON.parse(module.allowedRoles) : [],
      isCustomModule: Boolean(module.isCustomModule),
      fields: module.fields ? JSON.parse(module.fields) : [],
      status: module.status,
      version: module.version,
    }));

    // Group by workflow category
    const groupedByWorkflow = parsedModules.reduce((acc, module) => {
      const workflow = module.workflowCategory || 'Other';
      if (!acc[workflow]) acc[workflow] = [];
      acc[workflow].push(module);
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({ 
      modules: parsedModules,
      groupedByWorkflow,
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
