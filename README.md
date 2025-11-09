# Easy2Work - Workflow Platform

A multi-tenant SaaS workflow automation platform for managing business operations from leads to payments.

## 🏗️ Architecture Overview

### 4-Tier User Hierarchy

```
Platform Admin (Super Admin)
    ↓
Tenant Admin (Organization Admin)
    ↓
Management (Managers)
    ↓
Direct Users (Staff)
```

### Role-Based Access Control

| Role | Access |
|------|--------|
| **Platform Admin** | Platform-level tenant management, system configuration, all tenants overview |
| **Admin** | Core modules + Tenant admin tools (field builder, workflow builder, user management) |
| **Manager** | Core modules + Tenant admin tools (same as Admin) |
| **Staff** | Core modules only (Leads, Clients, Quotations, Orders, Invoices, Payments) |

## 📁 Project Structure

### Key Directories

```
src/
├── app/
│   ├── auth/                    # Authentication (login/signup)
│   ├── dashboard/               # Main dashboard (all users)
│   ├── modules/                 # Core business modules (all users)
│   │   └── [moduleName]/        # Dynamic module pages (Leads, Clients, etc.)
│   ├── tenant-admin/            # 🔥 Tenant Admin Section (admin/manager only)
│   │   ├── layout.tsx           # Purple-themed sidebar
│   │   ├── page.tsx             # Admin dashboard
│   │   ├── field-builder/       # Define custom fields
│   │   ├── workflow-builder/    # Create workflows
│   │   └── users/               # User management
│   └── platform-admin/          # Platform Admin Section (platform_admin only)
│       ├── tenants/             # Tenant management with storage tracking
│       └── settings/
├── components/
│   ├── forms/                   # Dynamic form components
│   ├── layout/                  # AppLayout with role-based navigation
│   └── tables/                  # Dynamic table components
├── lib/
│   ├── metadata/                # Module configuration service
│   ├── modules/                 # Dynamic record service
│   ├── workflow/                # Workflow engine
│   └── services/                # Business logic services
└── types/                       # TypeScript type definitions
```

## 🎨 Navigation Structure

### Core Modules Section (All Users)
Visible to all authenticated users (admin, manager, staff):
- 🏠 Dashboard
- 📋 Leads
- 👤 Clients
- 📄 Quotations
- 📦 Orders
- 🧾 Invoices
- 💰 Payments
- 📊 Analytics

### ⚙️ Tenant Admin Section (Admin/Manager Only)
Only visible to users with `admin` or `manager` role:
- 🏠 Admin Dashboard
- 🔧 Field Builder
- 🔀 Workflow Builder
- 👥 User Management

### Platform Admin Section (Platform Admin Only)
Only visible to users with `platform_admin` role:
- 🏢 Tenant Management
- ⚙️ Platform Settings

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- SQLite (included)

### Installation

```bash
# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

## 👤 Test Users

After running the seed script, you can login with:

### Platform Admin
- **Email**: platform@easy2work.com
- **Password**: Platform@123
- **Access**: Full platform management, tenant overview

### Tenant Admin (Demo Org)
- **Email**: demo@easy2work.com
- **Password**: demo@123
- **Tenant**: Demo Organization
- **Access**: Core modules + Tenant admin tools

### Manager (Demo Org)
- **Email**: manager@demo.com
- **Password**: Manager@123
- **Tenant**: Demo Organization
- **Access**: Core modules + Tenant admin tools

### Staff (Demo Org)
- **Email**: staff@demo.com
- **Password**: Staff@123
- **Tenant**: Demo Organization
- **Access**: Core modules only (no admin tools)

### Tenant Admin (Acme Corp)
- **Email**: admin@acme.com
- **Password**: Acme@123
- **Tenant**: Acme Corporation
- **Access**: Core modules + Tenant admin tools

## 🔐 Authentication & Authorization

### Middleware Protection
Routes are protected by `src/middleware.ts`:
- `/platform-admin/*` - Requires `platform_admin` role
- `/tenant-admin/*` - Requires `admin` or `manager` role
- `/modules/*` - Requires any authenticated user
- `/dashboard` - Requires any authenticated user

### Tenant Isolation
- All users (except platform_admin) belong to a specific tenant
- Data is automatically filtered by tenant ID in API routes
- Users cannot access data from other tenants

## 📊 Features

### Multi-Tenant Architecture
- Complete tenant isolation
- Tenant-specific storage tracking
- User limits per tenant
- Deactivate/activate tenants (no deletion)

### Dynamic Module System
- Configurable field definitions
- Custom validation rules
- Flexible field types (text, number, date, lookup, table, etc.)
- Dynamic form rendering
- Dynamic table rendering

### Workflow Automation
- Visual workflow builder
- Conditional logic
- Automated conversions (Lead → Client, Quotation → Order, Order → Invoice)
- Email notifications
- Field updates

### Business Intelligence
- Finance dashboard with KPIs
- Revenue tracking
- Overdue invoice alerts
- Top clients analytics
- Payment status distribution

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Prisma ORM + SQLite
- **Authentication**: NextAuth.js
- **UI Components**: Chakra UI
- **Charts**: Recharts
- **PDF Generation**: React-PDF

## 📝 Database Schema

### Key Models
- **Tenant**: Multi-tenant organization
  - Storage tracking (storageUsedMB, maxStorage)
  - Record count tracking
  - User limits (maxUsers)
  - Status (active/inactive)
- **User**: Platform and tenant users
  - Roles (platform_admin, admin, manager, staff)
  - Tenant association
- **ModuleConfig**: Dynamic module definitions
- **FieldDefinition**: Custom field schemas
- **WorkflowDefinition**: Workflow automation rules

## 🔄 Common Operations

### Adding a New User (Tenant Admin)
1. Navigate to `/tenant-admin/users`
2. Click "Add User"
3. Fill in user details and assign role
4. User receives credentials via email (future)

### Creating Custom Fields (Tenant Admin)
1. Navigate to `/tenant-admin/field-builder`
2. Select module (Leads, Clients, etc.)
3. Add field with type, validation rules
4. Save - fields appear immediately in forms

### Managing Tenants (Platform Admin)
1. Navigate to `/platform-admin/tenants`
2. View tenant list with storage usage
3. Activate/deactivate tenants
4. Edit tenant settings (user limits, storage limits)

## 🐛 Troubleshooting

### TypeScript Errors in seed.ts
If you see errors about `storageUsedMB` not existing:
```bash
npx prisma generate
# Reload VS Code TypeScript server: Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### Cannot Access Tenant Admin
- Verify your role is `admin` or `manager`
- Check middleware.ts for route protection
- Logout and login again to refresh session

### Module Not Showing Data
- Verify module configuration exists in database
- Check tenant ID in session
- Clear browser cache and reload

## 📚 API Documentation

### Module API
- `GET /api/modules?tenantId={id}&moduleName={name}` - Get module config
- `GET /api/modules/{moduleName}/records` - List records
- `POST /api/modules/{moduleName}/records` - Create record
- `PUT /api/modules/{moduleName}/records/{id}` - Update record
- `DELETE /api/modules/{moduleName}/records/{id}` - Delete record

### Tenant Admin API
- `GET /api/admin/tenants` - List all tenants (platform_admin)
- `PATCH /api/admin/tenants/{id}` - Update tenant status
- `GET /api/user` - List tenant users
- `POST /api/user` - Create user

## 🎯 Roadmap

- [ ] Email notifications for workflows
- [ ] Advanced analytics and reporting
- [ ] Mobile app
- [ ] API webhooks
- [ ] Third-party integrations
- [ ] Role-based field visibility
- [ ] Custom dashboard widgets
- [ ] Multi-language support

## 📄 License

Proprietary - Easy2Work Platform

## 🤝 Contributing

Internal team only. Contact platform admin for access.

---

**Last Updated**: November 2025
**Version**: 1.0.0
