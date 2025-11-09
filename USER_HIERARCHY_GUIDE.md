# User Hierarchy & Access Guide

## 🎭 Role-Based Access Matrix

| Feature | Platform Admin | Tenant Admin | Manager | Staff |
|---------|---------------|--------------|---------|-------|
| **Dashboard** | ✅ | ✅ | ✅ | ✅ |
| **Core Modules** | | | | |
| → Leads | ✅ | ✅ | ✅ | ✅ |
| → Clients | ✅ | ✅ | ✅ | ✅ |
| → Quotations | ✅ | ✅ | ✅ | ✅ |
| → Orders | ✅ | ✅ | ✅ | ✅ |
| → Invoices | ✅ | ✅ | ✅ | ✅ |
| → Payments | ✅ | ✅ | ✅ | ✅ |
| → Analytics | ✅ | ✅ | ✅ | ✅ |
| **Tenant Admin Section** | | | | |
| → Field Builder | ❌ | ✅ | ✅ | ❌ |
| → Workflow Builder | ❌ | ✅ | ✅ | ❌ |
| → User Management | ❌ | ✅ | ✅ | ❌ |
| **Platform Admin** | | | | |
| → Tenant Management | ✅ | ❌ | ❌ | ❌ |
| → Platform Settings | ✅ | ❌ | ❌ | ❌ |

## 🏗️ Visual Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                     PLATFORM ADMIN                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ platform@easy2work.com                                  │ │
│  │ • Manage all tenants                                    │ │
│  │ • View storage usage across tenants                     │ │
│  │ • Activate/Deactivate tenants                           │ │
│  │ • Configure platform settings                           │ │
│  │ • NO access to tenant-specific admin tools             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     TENANT ADMIN                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ demo@easy2work.com / admin@acme.com                     │ │
│  │                                                          │ │
│  │ CORE MODULES (All Users)                                │ │
│  │ • Dashboard, Leads, Clients, Quotations, etc.          │ │
│  │ • View and manage business data                         │ │
│  │                                                          │ │
│  │ ⚙️ TENANT ADMIN (Admin/Manager Only)                   │ │
│  │ • Field Builder - Define custom fields                  │ │
│  │ • Workflow Builder - Create automations                 │ │
│  │ • User Management - Add/edit users                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     MANAGER                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ manager@demo.com                                        │ │
│  │                                                          │ │
│  │ CORE MODULES (All Users)                                │ │
│  │ • Dashboard, Leads, Clients, Quotations, etc.          │ │
│  │ • Full access to business data                          │ │
│  │                                                          │ │
│  │ ⚙️ TENANT ADMIN (Admin/Manager Only)                   │ │
│  │ • Same as Tenant Admin                                  │ │
│  │ • Can configure fields and workflows                    │ │
│  │ • Can manage users                                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     DIRECT USER (Staff)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ staff@demo.com                                          │ │
│  │                                                          │ │
│  │ CORE MODULES (All Users)                                │ │
│  │ • Dashboard, Leads, Clients, Quotations, etc.          │ │
│  │ • View and manage business data                         │ │
│  │                                                          │ │
│  │ ❌ NO ACCESS TO:                                        │ │
│  │ • Tenant Admin Section                                  │ │
│  │ • Field Builder, Workflow Builder                       │ │
│  │ • User Management                                       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🚪 Login & First Screen by Role

### Platform Admin Login
```
Login: platform@easy2work.com
Password: Platform@123
↓
First Screen: /platform-admin/tenants
Shows: List of all tenants with storage usage
```

### Tenant Admin Login
```
Login: demo@easy2work.com
Password: demo@123
↓
First Screen: /dashboard
Sidebar Shows:
  CORE MODULES
    • Dashboard
    • Leads
    • Clients
    • ...
  ⚙️ TENANT ADMIN
    • Admin Dashboard
    • Field Builder
    • Workflow Builder
    • User Management
```

### Manager Login
```
Login: manager@demo.com
Password: Manager@123
↓
First Screen: /dashboard
Sidebar Shows: Same as Tenant Admin (Core + Tenant Admin)
```

### Staff Login
```
Login: staff@demo.com
Password: Staff@123
↓
First Screen: /dashboard
Sidebar Shows:
  CORE MODULES
    • Dashboard
    • Leads
    • Clients
    • ...
  (NO Tenant Admin section visible)
```

## 🎨 Visual Indicators

### Color Coding
- **Platform Admin**: 🟠 Orange theme
- **Tenant Admin Section**: 🟣 Purple sidebar (purple.700)
- **Core Modules**: 🔵 Blue theme
- **Active State**: Highlighted background

### Icon Legend
- 🏠 Dashboard
- 📋 Leads
- 👤 Clients
- 📄 Quotations
- 📦 Orders
- 🧾 Invoices
- 💰 Payments
- 📊 Analytics
- ⚙️ Tenant Admin Section
- 🔧 Field Builder
- 🔀 Workflow Builder
- 👥 User Management
- 🏢 Tenant Management

## 📱 Navigation Examples

### Example 1: Staff User Clicks "Leads"
```
1. Login as staff@demo.com
2. Click "📋 Leads" in sidebar (under CORE MODULES)
3. See: Clean data table with leads
   - Add button (➕ New)
   - Edit button per row (✏️)
   - Delete button per row (🗑️)
   - View button per row (👁️)
4. NO admin tools visible (no Field Builder, no Workflow Builder)
```

### Example 2: Admin User Needs to Add Custom Field
```
1. Login as demo@easy2work.com
2. Click "⚙️ TENANT ADMIN" section in sidebar
3. Click "🔧 Field Builder"
4. Select module (e.g., Leads)
5. Add new field (e.g., "Lead Source")
6. Save
7. Field appears in Leads form immediately
```

### Example 3: Platform Admin Manages Tenants
```
1. Login as platform@easy2work.com
2. Automatically lands on /platform-admin/tenants
3. See table with:
   - Tenant name
   - Storage used (MB)
   - Record count
   - User count / Max users
   - Status (Active/Inactive)
   - Actions (Activate/Deactivate toggle)
4. Click toggle to activate/deactivate tenant
5. Inactive tenant users cannot login
```

## 🔐 Middleware Protection

### Route Guards
```javascript
/platform-admin/*     → Requires: role === 'platform_admin'
/tenant-admin/*       → Requires: role === 'admin' OR 'manager'
/modules/*            → Requires: Any authenticated user
/dashboard            → Requires: Any authenticated user
```

### Tenant Status Check
```javascript
If tenant.status === 'inactive':
  → Block all routes except /auth/signin
  → Show error message
  → Force logout
```

## ❓ FAQ

**Q: Can a Platform Admin access tenant-specific data?**
A: No. Platform Admin role is for system-level management only. They don't belong to any tenant.

**Q: Can a Staff user see the Field Builder?**
A: No. The "⚙️ TENANT ADMIN" section is not visible to staff users at all.

**Q: Can a Manager do everything an Admin can do?**
A: Within their tenant, yes. Both Admin and Manager have access to Tenant Admin tools.

**Q: Can a Tenant Admin delete their own tenant?**
A: No. Only Platform Admin can deactivate tenants (not delete).

**Q: What happens when clicking a module like "Leads"?**
A: You see a clean data table with Add/Edit/Delete buttons. NO admin configuration UI.

**Q: Where is the Field Builder button now?**
A: In the "⚙️ TENANT ADMIN" section (purple sidebar), accessible only to Admin/Manager.

**Q: Can users switch between tenants?**
A: No. Each user belongs to exactly one tenant (except Platform Admin who has no tenant).

---

**Last Updated**: November 9, 2025
