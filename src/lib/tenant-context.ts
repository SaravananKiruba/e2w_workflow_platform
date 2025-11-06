import { headers } from 'next/headers';

export interface TenantContext {
  tenantId: string;
  userId: string;
  userRole: string;
  branchId?: string;
}

export async function getTenantContext(): Promise<TenantContext | null> {
  const headersList = headers();
  const tenantId = headersList.get('x-tenant-id');
  const userId = headersList.get('x-user-id');
  const userRole = headersList.get('x-user-role');
  const branchId = headersList.get('x-branch-id');

  if (!tenantId || !userId || !userRole) {
    return null;
  }

  return {
    tenantId,
    userId,
    userRole,
    branchId: branchId || undefined,
  };
}

export function validateTenantAccess(context: TenantContext | null, requiredTenantId: string): boolean {
  if (!context) return false;
  return context.tenantId === requiredTenantId;
}

export function hasRole(context: TenantContext | null, roles: string[]): boolean {
  if (!context) return false;
  return roles.includes(context.userRole);
}

export function isAdmin(context: TenantContext | null): boolean {
  return hasRole(context, ['admin']);
}

export function canManage(context: TenantContext | null): boolean {
  return hasRole(context, ['admin', 'manager']);
}
