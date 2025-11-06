// Type definitions for multi-tenant models

export interface TenantSettings {
  timezone: string;
  currency: string;
  dateFormat: string;
  fiscalYearStart?: string;
  [key: string]: any;
}

export interface TenantBranding {
  primaryColor: string;
  secondaryColor?: string;
  logo?: string;
  favicon?: string;
  [key: string]: any;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  status: 'active' | 'suspended' | 'inactive';
  subscriptionTier: 'free' | 'basic' | 'professional' | 'enterprise';
  settings?: TenantSettings;
  branding?: TenantBranding;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
}

export interface BranchAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface BranchContact {
  phone: string;
  email: string;
  alternatePhone?: string;
}

export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  address?: BranchAddress;
  contact?: BranchContact;
  gstNumber?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPermissions {
  modules?: Record<string, boolean>;
  fields?: Record<string, string[]>;
  actions?: string[];
}

export interface User {
  id: string;
  tenantId: string;
  branchId?: string | null;
  email: string;
  name: string;
  password?: string | null;
  image?: string | null;
  role: 'admin' | 'manager' | 'staff';
  permissions?: UserPermissions;
  status: string;
  emailVerified?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date | null;
}
