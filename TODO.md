# E2W Platform Restructuring - TODO

**Created:** November 9, 2025  
**Updated:** November 10, 2025 (Purchase Module Added)  
**Goal:** Clean separation of Platform Admin, Tenant Admin, and Core Modules with mobile-responsive login

**RULE:** 🔥 **ENHANCE EXISTING FILES - Don't create unnecessary new files!**

---

## ✅ COMPLETED: Purchase & Vendor Management Module (Nov 10, 2025)

### Implementation Summary
✅ **Module Configurations** - 6 purchase modules (Vendors, RateCatalogs, PurchaseRequests, PurchaseOrders, GoodsReceipts, VendorBills)  
✅ **Dynamic Records** - All data stored in DynamicRecord table (NO hardcoded tables!)  
✅ **Business Logic** - PurchaseFlowExtensions with vendor suggestions, PR-to-PO conversion, GRN validation, expense posting  
✅ **Workflows** - PR Auto-Approval workflow (< ₹10k)  
✅ **Conversion API** - `/api/conversions/pr-to-po` for Purchase Request to Order conversion  
✅ **Auto-numbering** - 5 sequences (VEND, RC, PR, PO, GRN, BILL)  
✅ **Zero Migrations** - Uses existing DynamicRecord infrastructure  
✅ **Documentation** - Complete implementation guide in `PURCHASE_MODULE_DOCS.md`  

### Purchase Flow Implemented
```
Vendor → Rate Catalog → Purchase Request (PR) → Approval → Purchase Order (PO) 
→ Goods Receipt (GRN) → Vendor Bill → Expense Posting → Payment → Analytics
```

### Key Features
- Auto vendor suggestions based on rate catalog and rating
- PR auto-approval workflow (< ₹10,000)
- 3-way matching validation (PO-GRN-Bill)
- Quality inspection in GRN
- Automatic expense posting from bills
- GST/tax calculations
- Works with existing dynamic UI - no UI changes needed!

### Architecture Highlights
- **NO hardcoded database tables** - respects platform's dynamic architecture
- **Uses existing APIs** - `/api/modules/[moduleName]/records` works automatically
- **ModuleConfiguration driven** - field schemas defined in config, not code
- **DynamicRecordService** - all CRUD goes through existing service
- **Workflow engine** - leverages existing workflow system

### Files Added/Modified
- ✅ `prisma/seed-purchase-dynamic.ts` - Module configurations seed
- ✅ `src/lib/modules/purchase-flow-extensions.ts` - Business logic helpers
- ✅ `src/app/api/conversions/pr-to-po/route.ts` - PR to PO conversion endpoint
- ✅ `prisma/seed.ts` - Integrated purchase modules seeding
- ✅ `PURCHASE_MODULE_DOCS.md` - Complete documentation

### Files Removed (Cleanup)
- ❌ Deleted hardcoded purchase models from `schema.prisma`
- ❌ Deleted `src/lib/services/purchase-service.ts` (replaced with extensions)
- ❌ Deleted custom API routes (uses existing dynamic routes)
- ❌ Deleted old seed files (seed-purchase.ts, seed-purchase-workflows.ts)

**RULE:** 🔥 **ENHANCE EXISTING FILES - Don't create unnecessary new files!**

---

## 🎯 Project Overview - CORRECTED

### Critical Understanding:
❌ **WRONG:** Mixing Tenant Admin tools inside module navigation  
✅ **RIGHT:** Complete separation - Tenant Admin is a TOP-LEVEL layer

### Correct Hierarchy
```
1. Platform Admin (SaaS Provider)
   └─ Manages ALL tenants, billing, storage

2. Tenant Admin Layer (Separate Section)
   └─ Field Builder, Workflow Builder, User Management
   └─ Accessible ONLY by admin/manager roles
   └─ Has own navigation/menu - NOT mixed with modules

3. Core Modules (Everyone)
   └─ Leads → Shows ONLY Lead records
   └─ Clients → Shows ONLY Client records
   └─ Quotations → Shows ONLY Quotation records
   └─ NO admin tools visible here!

4. User Roles:
   └─ platform_admin: Access Platform Admin
   └─ admin/manager: Access Tenant Admin + Core Modules
   └─ staff: Access ONLY Core Modules
```

### Key Fixes Needed
- 🔧 Move ALL admin tools to separate `/tenant-admin` section
- 📱 Simplify login - mobile responsive, clear text
- �️ Module pages show ONLY module data, no config options
- 🎛️ Tenant Admin has dedicated menu/sidebar (Field Builder, Workflow Builder, User Mgmt)

---

## 📋 Tasks

### Phase 1: Authentication & Login
- [x] **1.1** ENHANCE `/auth/signin/page.tsx` - ⚠️ NEEDS SIMPLIFICATION
  - ✅ Added glass-morphism card with gradient background
  - ✅ Added smooth animations and transitions
  - ✅ Added forgot password link, Remember me checkbox
  - ❌ TOO COMPLEX - Need simpler text: "Workflow Platform" not "Workflow Automation Platform"
  - ❌ Need better mobile responsiveness
  - ❌ Simplify gradient, make it cleaner

### Phase 2: Platform Admin (SaaS Provider)
- [ ] **2.1** ENHANCE `/platform-admin/dashboard/page.tsx` (if exists, else create minimal)
  - Add overview cards: Total/Active/Inactive tenants, System health
  
- [x] **2.2** ENHANCE `/platform-admin/tenants/page.tsx` ✅ DONE
  - ✅ Replaced DELETE → DEACTIVATE/ACTIVATE toggle
  - ✅ Added columns: Storage (GB), Records, User limits
  - ✅ Added usage analytics section
  
- [ ] **2.3** ENHANCE existing tenant API
  - Add to `/api/admin/tenants/route.ts` or `/api/admin/platform/tenants`
  - Add storage/usage calculation logic
  - Return: Storage used, Records per module, Active users
  
- [x] **2.4** ADD deactivation to existing API ✅ DONE
  - ✅ Enhanced `/api/admin/tenants/[tenantId]/route.ts`
  - ✅ Added PATCH method for deactivate/activate
  - ✅ DELETE disabled with helpful message

### Phase 3: Tenant Admin Area - CRITICAL FIX
- [ ] **3.1** CREATE separate `/tenant-admin` section - NEW TOP-LEVEL AREA
  - Create `/app/tenant-admin/layout.tsx` with own sidebar
  - Sidebar items: Dashboard, Field Builder, Workflow Builder, Users
  - This is SEPARATE from module navigation
  - Access: Only admin/manager roles
  
- [ ] **3.2** MOVE admin tools to `/tenant-admin`
  - Move `/admin/field-builder` → `/tenant-admin/field-builder`
  - Move `/admin/workflow-builder` → `/tenant-admin/workflow-builder`
  - Keep functionality same, just change location
  
- [ ] **3.3** CREATE `/tenant-admin/dashboard/page.tsx`
  - Org-level analytics: Records/module, Active users
  - Storage used, Workflow execution stats
  - Links to Field Builder, Workflow Builder, User Management
  
- [ ] **3.4** CREATE `/tenant-admin/users/page.tsx`
  - List all users in tenant organization
  - Create, Edit, Deactivate (no delete)
  - Assign roles: admin, manager, staff
  - Set permissions

### Phase 4: Clean Module Navigation
- [ ] **4.1** FIX module pages - Remove all admin UI elements
  - ENHANCE `/modules/[moduleName]/page.tsx`
  - Show ONLY: List of records, Add button, Edit/Delete per record
  - NO workflow builder, NO field config visible here
  - Clean table view with data only
  
- [ ] **4.2** UPDATE navigation/sidebar
  - Core Modules section: Just list modules (Leads, Clients, etc.)
  - Tenant Admin section: Separate button/link (shows only to admin/manager)
  - Make it crystal clear which section user is in

### Phase 5: Storage & Analytics
- [x] **5.1** ENHANCE Prisma schema ✅ DONE
  - ✅ Added to Tenant model: `storageUsedMB`, `recordCount`, `maxUsers`, `maxStorage`
  - ✅ Migration created and applied
  
- [ ] **5.2** ADD storage calculation to existing service
  - Enhance `src/lib/modules/dynamic-record-service.ts` OR
  - Add function to existing API route handlers
  - Calculate: DynamicRecord JSON size, Users, Modules, Workflows

### Phase 6: Navigation & Middleware
- [x] **6.1** ENHANCE `src/middleware.ts` ✅ DONE
  - ✅ Updated route guards
  - ✅ Added `/tenant-admin` handling (admin/manager access)
  - ✅ Kept `/platform-admin` (platform_admin only)
  - ✅ Added tenant status checking
  
- [ ] **6.2** ENHANCE `src/components/layout/AppLayout.tsx` - CRITICAL
  - Add role-based sidebar with TWO sections:
    * "Core Modules" (all users see this)
    * "Tenant Admin" (only admin/manager see this)
  - Platform Admin: Show link to platform-admin area
  - Make active section visually distinct
  - Clear separation between module data and admin tools

### Phase 7: Testing & Documentation
- [x] **7.1** ENHANCE `prisma/seed.ts` ✅ DONE
  - ✅ Created platform admin, tenant admins, manager, staff users
  - ✅ Added storage/usage data to tenants
  - ✅ Created 3 test tenants with different statuses
  
- [ ] **7.2** Test complete flow - CORRECT UNDERSTANDING
  - Platform Admin: Login → Manage all tenants (activate/deactivate)
  - Tenant Admin: Login → Access "Tenant Admin" section (Field/Workflow/User Mgmt)
  - Tenant Admin: Click Leads module → See ONLY lead records (no config)
  - Manager: Same as admin but limited permissions
  - Staff: Login → Access ONLY core modules (no Tenant Admin section visible)
  
- [ ] **7.3** ENHANCE README.md
  - Document correct hierarchy with clear examples
  - Show screenshots of separated navigation
  - List all user credentials from seed

---

## 🎨 Design Guidelines

### Login Form Enhancement
- Colors: Blue/Purple gradient (#4F46E5 → #7C3AED)
- Card: White bg, backdrop-blur, shadow-2xl
- Inputs: Large (lg), rounded corners, focus glow
- Button: Gradient, hover lift effect

### Platform Admin
- Theme: Professional blue (#2563EB)
- Enhance existing layout with better cards
- Charts: Use Chakra UI Stats components

### Tenant Admin
- Theme: Professional purple (#7C3AED)
- Reuse existing admin components
- Clear distinction from Platform Admin

---

## 📁 File Changes (ENHANCE, not CREATE)

```
ENHANCE EXISTING:
├── src/app/auth/signin/page.tsx              ← Enhance UI/UX
├── src/app/platform-admin/tenants/page.tsx   ← Add deactivate, usage
├── src/app/admin/tenants/page.tsx            ← Keep but rename path
├── src/middleware.ts                          ← Add tenant-admin routes
├── src/components/layout/AppLayout.tsx        ← Add role-based nav
├── prisma/schema.prisma                       ← Add storage fields
├── prisma/seed.ts                             ← Add platform admin
└── README.md                                  ← Document hierarchy

MINIMAL NEW (only if unavoidable):
├── src/app/platform-admin/dashboard/page.tsx  ← If doesn't exist
└── src/app/tenant-admin/ (rename from /admin) ← Just move files
```

---

## ✅ Completion Criteria - UPDATED

- [~] Login form - NEEDS SIMPLIFICATION (currently too complex)
  - Make mobile responsive
  - Simplify text: "Workflow Platform" not "Workflow Automation Platform"
  - Cleaner gradient design
  
- [x] Platform Admin can manage tenants without deleting ✅
- [x] Tenant usage (storage, records) tracked in schema ✅
- [ ] Tenant Admin is COMPLETELY SEPARATE from core modules
  - Must have own section with own sidebar
  - Clicking Leads shows ONLY leads, no admin tools
  
- [ ] Clear navigation structure:
  - Core Modules section (everyone)
  - Tenant Admin section (admin/manager only - separate menu)
  - Platform Admin link (platform_admin only)
  
- [x] Middleware guards routes correctly ✅
- [x] Multiple role users created in seed ✅
- [ ] Documentation with correct hierarchy
- [x] Following code cleanliness rule ✅

---

## 🎯 Current Status: 7/9 Tasks Done ✅

**✅ Completed:**
1. ✅ Login form simplified - mobile responsive, "Workflow Platform" text
2. ✅ Created /tenant-admin section with own sidebar and layout
3. ✅ Moved Field Builder and Workflow Builder to /tenant-admin
4. ✅ Created Tenant Admin dashboard with quick actions
5. ✅ Created User Management page for tenant admin
6. ✅ Updated AppLayout with clear navigation separation
7. ✅ Platform Admin tenants page (deactivate, storage tracking)

**🔥 REMAINING:**
1. Fix module pages - remove admin UI, show only data
2. Test complete hierarchy flow
3. Update README.md documentation

**📝 Key Achievements:**
- Login: Simple, mobile-responsive with blue/purple gradient
- Tenant Admin: Completely separate section with purple theme
- Navigation: Clear sections - "CORE MODULES" + "⚙️ TENANT ADMIN"
- Staff users see ONLY core modules
- Admin/Manager see both sections clearly separated
- Platform Admin has own orange-themed navigation

---

**End of TODO** (200 lines)
