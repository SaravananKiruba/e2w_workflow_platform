# Testing Checklist

## 🧪 Complete Testing Guide

### Prerequisites
- [ ] Database seeded (`npx prisma db seed`)
- [ ] Dev server running (`npm run dev`)
- [ ] Browser at `http://localhost:3000`

---

## Test Suite 1: Staff User (Restricted Access)

**Login**: staff@demo.com | **Password**: Staff@123

### Dashboard Access
- [ ] Successfully logs in
- [ ] Lands on `/dashboard`
- [ ] Sees welcome message with first name

### Sidebar Navigation
- [ ] Sees "CORE MODULES" section header
- [ ] Sees all 7 modules:
  - [ ] 🏠 Dashboard
  - [ ] 📋 Leads
  - [ ] 👤 Clients
  - [ ] 📄 Quotations
  - [ ] 📦 Orders
  - [ ] 🧾 Invoices
  - [ ] 💰 Payments
- [ ] **DOES NOT** see "⚙️ TENANT ADMIN" section
- [ ] **DOES NOT** see Field Builder anywhere
- [ ] **DOES NOT** see Workflow Builder anywhere
- [ ] **DOES NOT** see User Management anywhere

### Module Page - Leads
- [ ] Click "📋 Leads" in sidebar
- [ ] Sees clean data table with columns
- [ ] Sees "➕ New" button (top right)
- [ ] **DOES NOT** see "Reload Config" button
- [ ] **DOES NOT** see Field Builder button
- [ ] **DOES NOT** see Workflow Builder button
- [ ] Can click Edit (✏️) on a lead → Modal opens
- [ ] Can click View (👁️) on a lead → Details modal opens
- [ ] Can click Delete (🗑️) on a lead → Confirmation appears

### Module Page - Clients
- [ ] Click "👤 Clients" in sidebar
- [ ] Same clean interface (data only, no admin tools)

### Direct URL Access Attempts (Should Fail)
- [ ] Navigate to `/tenant-admin` → Redirected or blocked
- [ ] Navigate to `/tenant-admin/field-builder` → Blocked
- [ ] Navigate to `/platform-admin/tenants` → Blocked

---

## Test Suite 2: Manager User (Tenant Admin Access)

**Login**: manager@demo.com | **Password**: Manager@123

### Dashboard Access
- [ ] Successfully logs in
- [ ] Lands on `/dashboard`
- [ ] Sees welcome message

### Sidebar Navigation
- [ ] Sees "CORE MODULES" section header
- [ ] Sees all 7 core modules (same as staff)
- [ ] **SEES** "⚙️ TENANT ADMIN" section header
- [ ] **SEES** 4 tenant admin items:
  - [ ] 🏠 Admin Dashboard
  - [ ] 🔧 Field Builder
  - [ ] 🔀 Workflow Builder
  - [ ] 👥 User Management

### Module Page - Leads (Clean Data View)
- [ ] Click "📋 Leads" in Core Modules
- [ ] Sees clean data table (NO admin tools)
- [ ] **DOES NOT** see Field Builder in this view
- [ ] **DOES NOT** see Workflow Builder in this view
- [ ] Can perform normal CRUD operations

### Tenant Admin Section
- [ ] Click "⚙️ TENANT ADMIN" section
- [ ] Click "🏠 Admin Dashboard"
- [ ] Sees `/tenant-admin` page with purple sidebar
- [ ] Purple sidebar (purple.700 background)
- [ ] Sees "Tenant Admin" breadcrumb
- [ ] Sees stats cards (Users, Modules, Workflows, Records)

### Field Builder Access
- [ ] In purple sidebar, click "🔧 Field Builder"
- [ ] Loads `/tenant-admin/field-builder`
- [ ] Can see module selector
- [ ] Can add/edit field definitions

### Workflow Builder Access
- [ ] In purple sidebar, click "🔀 Workflow Builder"
- [ ] Loads `/tenant-admin/workflow-builder`
- [ ] Can create workflow rules

### User Management Access
- [ ] In purple sidebar, click "👥 User Management"
- [ ] Loads `/tenant-admin/users`
- [ ] Sees user table
- [ ] Can click "Add User" button
- [ ] Modal opens with role selection (staff/manager/admin)

### Platform Admin Access (Should Fail)
- [ ] Navigate to `/platform-admin/tenants` → Blocked

---

## Test Suite 3: Tenant Admin (Same as Manager)

**Login**: demo@easy2work.com | **Password**: demo@123

### Verify Same Access as Manager
- [ ] Has Core Modules access
- [ ] Has Tenant Admin section access
- [ ] All same permissions as Manager role
- [ ] Cannot access Platform Admin

---

## Test Suite 4: Platform Admin (System Level)

**Login**: platform@easy2work.com | **Password**: Platform@123

### Landing Page
- [ ] Automatically redirects to `/platform-admin/tenants`
- [ ] Orange theme interface

### Tenant Management
- [ ] Sees table with 3 tenants:
  1. [ ] Demo Organization (Active, 25.5 MB, 150 records)
  2. [ ] Acme Corporation (Active, 123.75 MB, 542 records)
  3. [ ] Test Inactive (Inactive, 5.2 MB, 25 records)

### Tenant Actions
- [ ] Each tenant has toggle button (FiToggleLeft/FiToggleRight)
- [ ] **DOES NOT** see Delete button
- [ ] Click toggle on "Test Inactive" → Changes to Active
- [ ] Click toggle again → Changes back to Inactive

### Storage Stats
- [ ] Sees 4 stat cards at top:
  - [ ] Total Tenants
  - [ ] Active Tenants
  - [ ] Total Users
  - [ ] Total Storage Used

### Tenant Details
- [ ] Storage columns visible (storageUsedMB)
- [ ] Record count visible
- [ ] User count / Max users visible (e.g., "3 / 10")

### Tenant Admin Access (Should Fail)
- [ ] Navigate to `/tenant-admin` → Should fail (Platform Admin has no tenant)
- [ ] Platform Admin role is system-level only

---

## Test Suite 5: Multi-Tenant Isolation

### Tenant A: Demo Organization
**Login**: demo@easy2work.com

- [ ] Click "📋 Leads"
- [ ] Note record IDs and data
- [ ] Count total leads (e.g., 5 leads)

### Tenant B: Acme Corporation
**Login**: admin@acme.com | **Password**: Acme@123

- [ ] Click "📋 Leads"
- [ ] Verify DIFFERENT records than Demo Organization
- [ ] Cannot see Demo Organization's leads

### Verify Isolation
- [ ] Demo user sees Demo data only
- [ ] Acme user sees Acme data only
- [ ] No cross-tenant data leakage

---

## Test Suite 6: Tenant Status (Inactive)

### Deactivate Tenant
**Login**: platform@easy2work.com

- [ ] Go to `/platform-admin/tenants`
- [ ] Find "Acme Corporation"
- [ ] Click toggle to DEACTIVATE

### Test Inactive Tenant User
**Logout and try**: admin@acme.com

- [ ] Cannot login OR
- [ ] Login succeeds but immediately blocked
- [ ] Sees error message about inactive tenant
- [ ] Cannot access any routes

### Reactivate Tenant
**Login**: platform@easy2work.com

- [ ] Click toggle to ACTIVATE Acme Corporation
- [ ] Verify status changes to "Active"

### Test Reactivated User
**Login**: admin@acme.com

- [ ] Can now login successfully
- [ ] Can access dashboard and modules

---

## Test Suite 7: Navigation Separation

### Visual Inspection - Staff User
**Login**: staff@demo.com

- [ ] Sidebar has ONE section: "CORE MODULES"
- [ ] Blue-themed navigation items
- [ ] No purple section visible

### Visual Inspection - Admin User
**Login**: demo@easy2work.com

- [ ] Sidebar has TWO sections:
  1. [ ] "CORE MODULES" (blue theme)
  2. [ ] "⚙️ TENANT ADMIN" (purple theme)
- [ ] Clear visual separation
- [ ] Purple items only visible to admin/manager

---

## Test Suite 8: Mobile Responsiveness

### Test on Mobile Size (Chrome DevTools)
**Set viewport**: iPhone 12 Pro (390x844)

### Login Page
- [ ] Form fits screen without horizontal scroll
- [ ] "Workflow Platform" text readable
- [ ] Input fields properly sized
- [ ] Button accessible

### Dashboard
- [ ] Module cards stack vertically
- [ ] Stats cards responsive
- [ ] Sidebar becomes hamburger menu

### Module Page
- [ ] Desktop table hidden on mobile
- [ ] Mobile card view visible
- [ ] Action buttons accessible
- [ ] "New" button visible

---

## Test Suite 9: CRUD Operations

### Create Lead
**Login**: staff@demo.com

- [ ] Go to Leads
- [ ] Click "➕ New"
- [ ] Modal opens with dynamic form
- [ ] Fill in fields (e.g., Lead Name, Email, Phone)
- [ ] Click "Create"
- [ ] Lead appears in table
- [ ] Toast notification shows success

### Edit Lead
- [ ] Click Edit (✏️) on the new lead
- [ ] Modal opens with pre-filled data
- [ ] Change Lead Name
- [ ] Click "Update"
- [ ] Changes reflected in table

### View Lead
- [ ] Click View (👁️)
- [ ] Modal shows all field details
- [ ] Can click "Edit" from detail modal

### Delete Lead
- [ ] Click Delete (🗑️)
- [ ] Confirmation dialog appears
- [ ] Confirm deletion
- [ ] Lead removed from table
- [ ] Toast notification shows success

---

## Test Suite 10: Conversions

### Lead → Client Conversion
**Login**: demo@easy2work.com

- [ ] Go to Leads
- [ ] Find lead with status ≠ "Converted"
- [ ] Click conversion button (↩️)
- [ ] Conversion succeeds
- [ ] Toast shows "Lead converted to Client: [name]"
- [ ] Go to Clients module
- [ ] New client exists with same data

### Quotation → Order Conversion
- [ ] Go to Quotations
- [ ] Find quotation with status ≠ "Converted"
- [ ] Click conversion button (📋)
- [ ] Order created successfully
- [ ] Verify in Orders module

### Order → Invoice Conversion
- [ ] Go to Orders
- [ ] Find order with status ≠ "Invoiced"
- [ ] Click conversion button (🧾)
- [ ] Invoice created successfully
- [ ] Verify in Invoices module

---

## Test Suite 11: Analytics Dashboard

**Login**: demo@easy2work.com

- [ ] Click "📊 Analytics" OR navigate to `/dashboard/finance`
- [ ] Sees Finance Dashboard
- [ ] 6 KPI cards visible:
  - [ ] Total Revenue (Paid)
  - [ ] Outstanding Amount
  - [ ] Overdue Invoices
  - [ ] Pending Quotations
  - [ ] Pending Orders
  - [ ] Total Invoices
- [ ] Revenue Trend chart displays
- [ ] Payment Status Distribution pie chart displays
- [ ] Top 5 Clients bar chart displays
- [ ] Overdue Invoices table (if any exist)
- [ ] Click "Refresh" button → Data reloads

---

## Test Suite 12: User Management (Admin Only)

**Login**: demo@easy2work.com

### Access User Management
- [ ] Click "⚙️ TENANT ADMIN"
- [ ] Click "👥 User Management"
- [ ] Sees `/tenant-admin/users`

### View Existing Users
- [ ] Sees user table with:
  - [ ] Name
  - [ ] Email
  - [ ] Role
  - [ ] Status (Active/Inactive)
  - [ ] Actions (Edit, Toggle Status)

### Create New User
- [ ] Click "Add User"
- [ ] Modal opens
- [ ] Fill in:
  - [ ] Name: "Test User"
  - [ ] Email: "testuser@demo.com"
  - [ ] Password: "Test@123"
  - [ ] Role: "staff"
- [ ] Click "Create"
- [ ] User appears in table

### Edit User
- [ ] Click Edit (✏️) on "Test User"
- [ ] Change role to "manager"
- [ ] Click "Update"
- [ ] Role updated in table

### Deactivate User
- [ ] Click toggle button on "Test User"
- [ ] Status changes to "Inactive"
- [ ] Logout and try login as testuser@demo.com → Blocked

### Reactivate User
- [ ] Toggle again
- [ ] Status changes to "Active"

---

## Test Suite 13: Field Builder (Admin Only)

**Login**: demo@easy2work.com

### Access Field Builder
- [ ] Click "⚙️ TENANT ADMIN"
- [ ] Click "🔧 Field Builder"
- [ ] Sees `/tenant-admin/field-builder`

### Add Custom Field to Leads
- [ ] Select module: "Leads"
- [ ] Sees existing field list
- [ ] Click "Add Field"
- [ ] Configure:
  - [ ] Field Name: "Lead Source"
  - [ ] Label: "Lead Source"
  - [ ] Data Type: "dropdown"
  - [ ] Options: "Website, Referral, Cold Call"
  - [ ] Required: Yes
- [ ] Save field

### Verify Field Appears
- [ ] Go to "📋 Leads" (Core Modules)
- [ ] Click "➕ New"
- [ ] New field "Lead Source" visible in form
- [ ] Dropdown has 3 options
- [ ] Field is required (marked with *)

---

## 📋 Summary Checklist

### Architecture
- [ ] Complete separation: Core Modules vs Tenant Admin
- [ ] Staff users see ONLY Core Modules
- [ ] Admin/Manager users see BOTH sections
- [ ] Platform Admin has separate system-level interface

### UI/UX
- [ ] Login is simple and mobile-responsive
- [ ] "Workflow Platform" branding (not "Automation")
- [ ] Navigation has clear section headers
- [ ] Module pages show ONLY data tables
- [ ] NO admin tools in module views

### Security
- [ ] Middleware blocks unauthorized routes
- [ ] Tenant isolation verified
- [ ] Inactive tenants blocked
- [ ] Role-based access enforced

### Functionality
- [ ] CRUD operations work on all modules
- [ ] Conversions work (Lead→Client, etc.)
- [ ] User management works
- [ ] Field builder works
- [ ] Analytics dashboard loads

---

## 🐛 Issues Found

| # | Description | Severity | Status |
|---|-------------|----------|--------|
| 1 | TypeScript errors in seed.ts | Low | Non-blocking |
|   |  |  |  |

---

## ✅ Sign-Off

- [ ] All test suites passed
- [ ] No critical issues found
- [ ] Documentation complete
- [ ] Ready for production

**Tested By**: _________________
**Date**: _________________
**Version**: 1.0.0
