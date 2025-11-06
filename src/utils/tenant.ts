// Helper utilities for working with tenant data

import { Tenant, TenantSettings, TenantBranding, Branch, BranchAddress, BranchContact, User, UserPermissions } from '@/types/tenant';

// Parse JSON fields from database
export function parseTenantSettings(settings?: string | null): TenantSettings | undefined {
  if (!settings) return undefined;
  try {
    return JSON.parse(settings) as TenantSettings;
  } catch {
    return undefined;
  }
}

export function parseTenantBranding(branding?: string | null): TenantBranding | undefined {
  if (!branding) return undefined;
  try {
    return JSON.parse(branding) as TenantBranding;
  } catch {
    return undefined;
  }
}

export function parseBranchAddress(address?: string | null): BranchAddress | undefined {
  if (!address) return undefined;
  try {
    return JSON.parse(address) as BranchAddress;
  } catch {
    return undefined;
  }
}

export function parseBranchContact(contact?: string | null): BranchContact | undefined {
  if (!contact) return undefined;
  try {
    return JSON.parse(contact) as BranchContact;
  } catch {
    return undefined;
  }
}

export function parseUserPermissions(permissions?: string | null): UserPermissions | undefined {
  if (!permissions) return undefined;
  try {
    return JSON.parse(permissions) as UserPermissions;
  } catch {
    return undefined;
  }
}

// Stringify for database storage
export function stringifyTenantSettings(settings?: TenantSettings): string | undefined {
  if (!settings) return undefined;
  return JSON.stringify(settings);
}

export function stringifyTenantBranding(branding?: TenantBranding): string | undefined {
  if (!branding) return undefined;
  return JSON.stringify(branding);
}

export function stringifyBranchAddress(address?: BranchAddress): string | undefined {
  if (!address) return undefined;
  return JSON.stringify(address);
}

export function stringifyBranchContact(contact?: BranchContact): string | undefined {
  if (!contact) return undefined;
  return JSON.stringify(contact);
}

export function stringifyUserPermissions(permissions?: UserPermissions): string | undefined {
  if (!permissions) return undefined;
  return JSON.stringify(permissions);
}

// Tenant helper functions
export function getTenantDisplayName(tenant: Tenant): string {
  return tenant.name;
}

export function isTenantActive(tenant: Tenant): boolean {
  return tenant.status === 'active';
}

export function canAccessFeature(tier: string, feature: string): boolean {
  const tierLevels: Record<string, number> = {
    free: 1,
    basic: 2,
    professional: 3,
    enterprise: 4,
  };

  const featureRequirements: Record<string, number> = {
    workflows: 2,
    integrations: 3,
    advanced_analytics: 3,
    api_access: 3,
    white_label: 4,
  };

  const userTier = tierLevels[tier] || 0;
  const requiredTier = featureRequirements[feature] || 1;

  return userTier >= requiredTier;
}
