# Current Tenant Admin Workflow Documentation

## Overview
The tenant admin is responsible for configuring and managing their organization's workspace, including users, modules, fields, and workflows.

---

## Authentication & Access

### Role: `admin` (Tenant Admin)
- **Access Level**: Tenant-level configuration and management
- **Cannot Access**: Business modules (Leads, Clients, Quotations, Orders, Invoices, Payments)
- **Cannot Access**: Platform admin functions (tenant management)

### Login Credentials (Test Environment)
- **Email**: `admin@adiee-corp.easy2work.com`
- **Password**: `3fe738c04b5c48c3`
- **Tenant**: Adiee Corporation (slug: `adiee-corp`)

---

## Navigation Structure

### Tenant Admin Sidebar Menu
1. **Dashboard** (`/tenant-admin`)
2. **Users** (`/tenant-admin/users`)
3. **Module Builder** (`/tenant-admin/modules`)
4. **Fields** (`/tenant-admin/field-builder`)
5. **Workflows** (`/tenant-admin/workflow-builder`)

### Additional Options
- **Change Password** (accessible via user menu)
- **Profile Settings** (in user menu)
- **Logout**

---

## Core Features & Pages

### 1. Dashboard (`/tenant-admin`)
**Purpose**: Landing page for tenant admin

**Features**:
- Welcomes the admin by name
- Displays tenant/organization name
- Shows account status (Active)
- Clean, minimal design directing to sidebar navigation

**No Actions**: This is an informational page only

---

### 2. User Management (`/tenant-admin/users`)
**Purpose**: Create and manage business users (manager, owner, staff)

**Features**:
- **View Users**: Table showing all users with email, role, and status
- **Create User**: 
  - Name, Email, Role (manager/owner/staff), Status (active/inactive)
  - Auto-generates password on creation
  - Displays generated credentials in modal (must be saved by admin)
- **Edit User**: Update name, email, role, status
- **Toggle Status**: Activate/deactivate users

**API Endpoints**:
- `GET /api/tenant/users` - Fetch all users for tenant
- `POST /api/tenant/users` - Create new user
- `PUT /api/tenant/users/:id` - Update user
- `PATCH /api/tenant/users/:id/status` - Toggle user status

**User Roles Available**:
- `manager`: Full business access + analytics
- `owner`: Full business access + analytics  
- `staff`: Core workflow access (no analytics, limited purchase)

**Auto-Generated Password**: System creates random password on user creation

---

### 3. Module Builder (`/tenant-admin/modules`)
**Purpose**: Create and manage custom business modules

**Features**:
- **View Modules**: Table showing all modules (core + custom)
  - Module Name, Display Name, Icon, Category, Status
  - Shows "Core Module" vs "Custom Module" badges
  
- **Create Custom Module**:
  - Module Name (technical identifier)
  - Display Name (user-facing label)
  - Icon (from predefined list: FiGrid, FiFileText, FiUsers, etc.)
  - Description
  - Purpose
  - Category (Sales, Purchase, Inventory, Finance, HR, Custom)
  - Insert After (positioning in navigation)
  - Allowed Roles (manager, owner, staff)
  - Show in Navigation (checkbox)

- **Edit Module**: Modify custom module properties
- **Delete Module**: Remove custom modules (core modules cannot be deleted)

**API Endpoints**:
- `GET /api/tenant-admin/custom-modules` - Fetch all modules
- `POST /api/tenant-admin/custom-modules` - Create custom module
- `PUT /api/tenant-admin/custom-modules` - Update custom module
- `DELETE /api/tenant-admin/custom-modules` - Delete custom module

**Core Modules** (Cannot be modified/deleted):
- Leads, Clients, Quotations, Orders, Invoices, Payments
- Vendors, Rate Catalogs, Purchase Requests, Purchase Orders, Goods Receipts, Vendor Bills

**Custom Module Storage**: 
- Metadata stored in `ModuleConfiguration` table
- Data stored in `DynamicRecord` table (generic JSON storage)

---

### 4. Field Builder (`/tenant-admin/field-builder`)
**Purpose**: Design and configure fields for modules

**Features**:
- **Module Selection**: Choose module to configure
- **Three-Panel Layout**:
  1. **Field Library** (Left): Drag-and-drop field types
  2. **Form Canvas** (Center): Visual field arrangement
  3. **Property Panel** (Right): Configure selected field

**Field Types Available**:
- text, textarea, number, currency
- date, datetime, email, phone, url
- dropdown, multiselect, checkbox, radio
- file, formula, lookup (reference), table (line items)

**Field Configuration**:
- Label, Placeholder, Help Text
- Required, Read-only, Hidden
- Default Value
- Validation Rules
- Field-specific config (max length, options, lookup settings, etc.)

**Actions**:
- **Add Field**: Drag from library to canvas
- **Reorder Fields**: Drag to rearrange
- **Edit Field**: Click to select and modify properties
- **Delete Field**: Remove from canvas
- **Save Configuration**: Update module schema
- **Preview**: See how form looks to end users

**API Endpoints**:
- `GET /api/modules?tenantId=xxx&moduleName=xxx` - Fetch module config
- `PUT /api/tenant-admin/module-config` - Save field configuration

**Important**: Field changes update module version and schema

---

### 5. Workflow Builder (`/tenant-admin/workflow-builder`)
**Purpose**: Create automated workflows with triggers, conditions, and actions

**Features**:
- **Visual Workflow Designer**: Drag-and-drop node-based interface (React Flow)
- **Node Types**:
  1. **Trigger Node**: When workflow starts (onCreate, onUpdate, onDelete, onStatusChange, onFieldChange)
  2. **Condition Node**: If/else logic for branching
  3. **Action Node**: What to do (send email, update field, create record, send webhook, etc.)

- **Workflow Management**:
  - Create new workflow
  - Select target module
  - Name and describe workflow
  - Activate/deactivate workflows
  - Test workflows with sample data

**Workflow Actions**:
- Send Email
- Send Notification
- Update Field
- Create Record
- Call Webhook
- Assign Task
- Update Status

**API Endpoints**:
- `GET /api/workflows` - Fetch workflows
- `POST /api/workflows` - Create workflow
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow
- `POST /api/workflows/test` - Test workflow

**Workflow Execution**: 
- Triggered automatically based on events
- Stored in `WorkflowExecution` table for audit

---

## Business Logic & Constraints

### Module Types
1. **Core Modules**: Pre-defined, use typed database tables
   - Leads → `leads` table
   - Clients → `clients` table
   - Quotations → `quotations` table
   - Orders → `orders` table
   - Invoices → `invoices` table
   - Payments → `payments` table

2. **Custom Modules**: User-defined, use generic storage
   - Metadata → `ModuleConfiguration` table
   - Data → `DynamicRecord` table (JSON storage)

### Role-Based Access
- **Tenant Admin** (`admin`):
  - ✅ User management
  - ✅ Module configuration
  - ✅ Field builder
  - ✅ Workflow builder
  - ❌ Business modules (Leads, Clients, etc.)
  - ❌ Platform admin functions

- **Manager/Owner**:
  - ✅ All business modules
  - ✅ Analytics/Finance dashboard
  - ❌ Configuration tools

- **Staff**:
  - ✅ Core business modules
  - ❌ Analytics/Finance dashboard
  - ❌ Configuration tools

### Middleware Protection
- Route: `/tenant-admin/*` - Only accessible by role `admin`
- Route: `/modules/*` - Blocked for `platform_admin` and `admin`
- Route: `/dashboard` - Redirects based on role:
  - `platform_admin` → `/platform-admin/tenants`
  - `admin` → `/tenant-admin`
  - `manager/owner/staff` → `/modules/Leads`

---

## API Structure

### Tenant Admin APIs
**Base Path**: `/api/tenant-admin/`

1. **Custom Modules API** (`/api/tenant-admin/custom-modules`)
   - GET: Fetch all modules (core + custom)
   - POST: Create custom module with validation
   - PUT: Update custom module (requires moduleId)
   - DELETE: Delete custom module (requires moduleId)

2. **Module Config API** (`/api/tenant-admin/module-config`)
   - PUT: Update module field configuration and versioning

### Tenant APIs
**Base Path**: `/api/tenant/`

1. **Users API** (`/api/tenant/users`)
   - GET: List all users in tenant
   - POST: Create user with auto-generated password
   - PUT: Update user details
   - PATCH: Toggle user status

2. **Info API** (`/api/tenant/info`)
   - GET: Fetch tenant information (name, settings, branding)

### Workflow APIs
**Base Path**: `/api/workflows/`

1. **Workflows CRUD** (`/api/workflows`)
   - GET: List workflows for tenant
   - POST: Create new workflow
   - PUT: Update workflow
   - DELETE: Delete workflow

2. **Test API** (`/api/workflows/test`)
   - POST: Test workflow with sample data

### Module APIs (Used by tenant admin)
**Base Path**: `/api/modules/`

1. **Module Config** (`/api/modules`)
   - GET: Fetch specific module configuration
   - Params: `tenantId`, `moduleName`

---

## Database Schema (Relevant Tables)

### User Management
```prisma
model User {
  id            String
  tenantId      String?
  email         String @unique
  name          String
  password      String?
  role          String  // platform_admin, admin, manager, owner, staff
  status        String  // active, inactive
  branchId      String?
  permissions   String? // JSON
}
```

### Module Configuration
```prisma
model ModuleConfiguration {
  id            String
  tenantId      String
  moduleName    String
  displayName   String
  icon          String?
  description   String?
  fields        String  // JSON: Field definitions
  layouts       String? // JSON: UI layouts
  validations   String? // JSON: Validation rules
  status        String  // draft, review, active, archived
  version       Int
}
```

### Dynamic Records (Custom Modules)
```prisma
model DynamicRecord {
  id            String
  tenantId      String
  moduleId      String
  data          String  // JSON: All field data
  status        String
  createdBy     String?
  updatedBy     String?
}
```

### Workflows
```prisma
model Workflow {
  id            String
  tenantId      String
  name          String
  moduleName    String
  trigger       String  // JSON: Trigger definition
  conditions    String? // JSON: Conditions
  actions       String  // JSON: Actions array
  isActive      Boolean
  priority      Int
}
```

---

## Typical Workflow Scenarios

### Scenario 1: Setting Up New Tenant
1. **Platform Admin** creates tenant → auto-generates tenant admin credentials
2. **Tenant Admin** logs in for first time
3. Tenant Admin creates business users (manager, staff)
4. Tenant Admin configures fields for core modules (Leads, Clients, etc.)
5. (Optional) Tenant Admin creates custom modules
6. (Optional) Tenant Admin sets up workflows for automation
7. Business users (manager/staff) can now use the system

### Scenario 2: Adding Custom Module
1. Tenant Admin goes to Module Builder
2. Clicks "Create Module"
3. Fills in: Name, Display Name, Icon, Category, Allowed Roles
4. Saves module (creates entry in `ModuleConfiguration`)
5. Goes to Field Builder
6. Selects the new module
7. Drags fields from library to canvas
8. Configures each field's properties
9. Saves field configuration
10. Module appears in business user's sidebar
11. Business users can create records in new module

### Scenario 3: Creating Automation
1. Tenant Admin goes to Workflow Builder
2. Selects module (e.g., "Leads")
3. Names workflow (e.g., "Notify on New Lead")
4. Adds Trigger Node: "onCreate"
5. Adds Condition Node: "If lead value > 10000"
6. Adds Action Node: "Send Email to Manager"
7. Saves and activates workflow
8. When staff creates high-value lead → Manager gets email automatically

---

## Key Differences from Business User Workflow

| Feature | Tenant Admin | Manager/Owner | Staff |
|---------|-------------|---------------|-------|
| Module Access | ❌ No business modules | ✅ All modules | ✅ Core modules |
| Create Modules | ✅ Yes | ❌ No | ❌ No |
| Configure Fields | ✅ Yes | ❌ No | ❌ No |
| Create Workflows | ✅ Yes | ❌ No | ❌ No |
| Manage Users | ✅ Yes | ❌ No | ❌ No |
| View Analytics | ❌ No | ✅ Yes | ❌ No |
| Landing Page | `/tenant-admin` | `/modules/Leads` | `/modules/Leads` |

---

## Current Implementation Status

### ✅ Completed
- Basic tenant admin authentication and routing
- User management (CRUD operations)
- Module builder (create custom modules)
- Field builder (configure module fields)
- Workflow builder (visual workflow designer)
- Role-based access control
- Sidebar navigation for tenant admin

### ⚠️ Limitations
- No parent-child module hierarchy yet (planned)
- No approval queue for module changes
- No versioning UI for field changes
- No module templates/marketplace
- No bulk user import
- No workflow templates
- Limited workflow testing interface

### 🚧 Planned Enhancements
- Parent-child module structure (Sales → Leads, Clients, etc.)
- Module approval workflow
- Field versioning with rollback
- Workflow template library
- Advanced permission management (field-level)
- Module export/import
- Custom dashboard builder

---

## Security & Permissions

### Authentication
- NextAuth with JWT tokens
- Role stored in JWT: `session.user.role`
- Tenant ID stored in JWT: `session.user.tenantId`

### Authorization Checks
- Middleware: `/tenant-admin/*` requires role = `admin`
- API routes: Check tenant context and role
- Database: All queries filtered by `tenantId`

### Data Isolation
- All tenant data isolated by `tenantId`
- Users cannot access other tenant's data
- Platform admin can view all tenants

---

## Error Handling

### Common Error Scenarios
1. **Unauthorized Access**: Redirect to `/unauthorized`
2. **Invalid Module Name**: Show toast error "Module name already exists"
3. **Missing Required Fields**: Form validation prevents submission
4. **API Errors**: Display toast with error message
5. **Session Expired**: Redirect to `/auth/signin`

---

## Testing Credentials Summary

```
Platform Admin:
  Email: platform@easy2work.com
  Password: Platform@123
  Access: All tenants, system configuration

Tenant Admin (Adiee Corp):
  Email: admin@adiee-corp.easy2work.com
  Password: 3fe738c04b5c48c3
  Access: Tenant configuration, user management, module/field/workflow builders

Manager (Adiee Corp):
  Email: kiruba@gmail.com
  Password: rjfl8kaa4h9n7qbe
  Access: All business modules, analytics

Staff (Adiee Corp):
  Email: staff@adiee-corp.easy2work.com
  Password: staff123
  Access: Core business modules only
```

---

## Next Steps for Tenant Admin

After reviewing this workflow with ChatGPT, you may want to:

1. **Verify** the workflow logic matches your requirements
2. **Identify** any missing features or incorrect behavior
3. **Plan** the parent-child module hierarchy implementation
4. **Design** the approval queue for module changes
5. **Discuss** field-level permissions and versioning strategy

---

*Generated: 15 November 2025*
*Version: Current Implementation*
