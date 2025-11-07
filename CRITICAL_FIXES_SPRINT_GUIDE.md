# Critical Fixes Sprint - Quick Start Guide
**Duration**: 5 Days (Nov 7-12, 2025)  
**Status**: Ready to Execute

---

## 🎯 Sprint Goal

Fix 3 critical blockers before building new features:
1. **Platform Admin Layer** - Separate SaaS Provider from Tenant Admin
2. **Config Sync Bug** - Make field changes appear immediately
3. **CRUD Operations** - Validate all module operations work

---

## 📋 Day-by-Day Action Plan

### **DAY 1: Platform Admin Role (6 hours)**

#### Step 1: Update Prisma Schema (30 min)
```bash
# Edit: prisma/schema.prisma
# Change the User model role field:

model User {
  # ...
  role String @default("staff") // platform_admin, admin, manager, staff
  # ...
}

# Run migration:
npx prisma migrate dev --name add_platform_admin_role
npx prisma generate
```

#### Step 2: Update Seed Data (30 min)
```typescript
// Edit: prisma/seed.ts
// Add platform admin user:

const platformAdmin = await prisma.user.create({
  data: {
    email: 'platform@easy2work.com',
    password: await bcrypt.hash('Platform@123', 10),
    name: 'Platform Administrator',
    role: 'platform_admin',
    tenantId: tenants[0].id, // Link to any tenant for now
    status: 'active',
  }
});

console.log('✅ Created Platform Admin:', platformAdmin.email);
```

Run seed:
```bash
npx prisma db seed
```

#### Step 3: Update Middleware (1 hour)
```typescript
// Edit: src/middleware.ts
// Add route guard for /platform-admin/*

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  
  // ... existing code ...
  
  // Platform Admin route guard
  if (request.nextUrl.pathname.startsWith('/platform-admin')) {
    if (!token || token.role !== 'platform_admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }
  
  // ... rest of code ...
}

// Update config:
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
```

#### Step 4: Create Unauthorized Page (30 min)
```bash
# Create: src/app/unauthorized/page.tsx
```

```typescript
'use client';

import { Box, Container, Heading, Text, Button } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
  const router = useRouter();
  
  return (
    <Container centerContent py={20}>
      <Box textAlign="center">
        <Heading size="2xl" mb={4}>403</Heading>
        <Heading size="lg" mb={4}>Access Denied</Heading>
        <Text mb={6}>You don't have permission to access this page.</Text>
        <Button colorScheme="blue" onClick={() => router.push('/dashboard')}>
          Go to Dashboard
        </Button>
      </Box>
    </Container>
  );
}
```

#### Step 5: Update NextAuth (1 hour)
```typescript
// Edit: src/app/api/auth/[...nextauth]/route.ts
// No changes needed - role is already passed through JWT
// But verify the callbacks section includes role:

callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.id = user.id;
      token.tenantId = user.tenantId;
      token.role = user.role; // ✅ Ensure this line exists
      token.branchId = user.branchId;
    }
    return token;
  },
  // ...
}
```

---

### **DAY 2: Platform Admin Routes (4 hours)**

#### Step 1: Create Dashboard (1.5 hours)
```bash
# Create: src/app/platform-admin/dashboard/page.tsx
```

```typescript
'use client';

import { Box, Container, Heading, Grid, Stat, StatLabel, StatNumber, StatHelpText } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';

export default function PlatformAdminDashboard() {
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    pendingApprovals: 0,
  });

  useEffect(() => {
    // TODO: Fetch stats from API
  }, []);

  return (
    <AppLayout>
      <Container maxW="7xl" py={8}>
        <Heading mb={6}>Platform Admin Dashboard</Heading>
        
        <Grid templateColumns="repeat(4, 1fr)" gap={6}>
          <Stat>
            <StatLabel>Total Tenants</StatLabel>
            <StatNumber>{stats.totalTenants}</StatNumber>
            <StatHelpText>All organizations</StatHelpText>
          </Stat>
          
          <Stat>
            <StatLabel>Active Tenants</StatLabel>
            <StatNumber>{stats.activeTenants}</StatNumber>
            <StatHelpText>Currently active</StatHelpText>
          </Stat>
          
          <Stat>
            <StatLabel>Total Users</StatLabel>
            <StatNumber>{stats.totalUsers}</StatNumber>
            <StatHelpText>Across all tenants</StatHelpText>
          </Stat>
          
          <Stat>
            <StatLabel>Pending Approvals</StatLabel>
            <StatNumber>{stats.pendingApprovals}</StatNumber>
            <StatHelpText>Config changes</StatHelpText>
          </Stat>
        </Grid>
      </Container>
    </AppLayout>
  );
}
```

#### Step 2: Move Existing Pages (1.5 hours)
```bash
# Move tenants page:
mv src/app/admin/tenants src/app/platform-admin/tenants

# Move approval queue:
mv src/app/admin/approval-queue src/app/platform-admin/approval-queue

# Move saas-provider to settings:
mv src/app/admin/saas-provider src/app/platform-admin/settings
```

Update imports in moved files to use `AppLayout`.

#### Step 3: Update Navigation (1 hour)
```typescript
// Edit: src/components/layout/AppLayout.tsx
// Already has platform_admin navigation defined - just verify routes match
// No changes needed if routes are correct
```

#### Step 4: Test (30 min)
1. Login as platform admin (`platform@easy2work.com`)
2. Verify navigation shows Platform Admin menu
3. Access `/platform-admin/dashboard`
4. Access `/platform-admin/tenants`
5. Access `/platform-admin/approval-queue`
6. Try accessing as regular user - should get 403

---

### **DAY 3: Config Sync Bug (3 hours)**

#### Step 1: Debug (1 hour)
Add logging to track config loading:

```typescript
// Edit: src/app/modules/[moduleName]/page.tsx

const loadModuleConfig = async () => {
  console.log('[CONFIG] Loading config for:', moduleName);
  try {
    const response = await fetch(
      `/api/modules?tenantId=${tenantId}&moduleName=${moduleName}`
    );
    console.log('[CONFIG] Response status:', response.status);
    
    const config = await response.json();
    console.log('[CONFIG] Loaded config:', config);
    console.log('[CONFIG] Fields:', config.fields);
    
    setModuleConfig(config);
  } catch (error) {
    console.error('[CONFIG] Error:', error);
    // ...
  }
};
```

Test:
1. Add a new field in Field Builder
2. Save the field
3. Go to module page
4. Open browser console
5. Check if config includes new field

#### Step 2: Implement Fix (1 hour)
**Option A: Add Reload Button** (Quick Fix)

```typescript
// Edit: src/app/modules/[moduleName]/page.tsx

// Add to component:
<HStack justify="space-between" mb={4}>
  <Heading size="lg">{moduleConfig?.displayName || moduleName}</Heading>
  <HStack>
    <Button
      leftIcon={<FiRefresh />}
      onClick={() => {
        setLoading(true);
        loadModuleConfig().finally(() => setLoading(false));
      }}
      size="sm"
      variant="outline"
    >
      Reload Configuration
    </Button>
    <Button onClick={handleCreateNew}>Create New</Button>
  </HStack>
</HStack>
```

**Option B: Cache Invalidation** (Better Fix)

```typescript
// Edit: src/app/api/admin/fields/route.ts

export async function PUT(req: NextRequest) {
  // ... existing code ...
  
  // After saving config:
  const updatedConfig = await prisma.moduleConfiguration.create({
    // ...
  });
  
  // Revalidate the module page
  revalidatePath(`/modules/${moduleName}`);
  
  return NextResponse.json(updatedConfig);
}
```

#### Step 3: Test (1 hour)
1. Add a new field in Field Builder
2. Save the field
3. Click "Reload Configuration" (or wait for auto-refresh)
4. Verify field appears in form
5. Test creating a record with new field
6. Verify data is saved correctly

---

### **DAY 4: CRUD Testing (4 hours)**

#### Test Script (Copy & Paste for each module)
```
MODULE: Leads
-----------------
□ Create new lead with all fields
□ Edit existing lead
□ Delete lead
□ View lead details
□ Search leads
□ Convert lead to client
□ Verify client record created

MODULE: Clients
-----------------
□ Create new client
□ Edit existing client
□ Delete client
□ View client details
□ Search clients

MODULE: Quotations
-----------------
□ Create new quotation (linked to client)
□ Edit quotation
□ Delete quotation
□ View quotation details
□ Verify GST calculation (IGST vs CGST+SGST)
□ Export quotation as PDF
□ Convert quotation to order
□ Verify order created with correct data

MODULE: Orders
-----------------
□ Create new order (or convert from quotation)
□ Edit order
□ Delete order
□ View order details
□ Verify GST preserved from quotation
□ Convert order to invoice
□ Verify invoice created

MODULE: Invoices
-----------------
□ Create new invoice (or convert from order)
□ Edit invoice
□ Delete invoice
□ View invoice details
□ Verify GST calculation correct
□ Export invoice as PDF
□ Verify PDF has legal tax invoice format

MODULE: Payments
-----------------
□ Create new payment (linked to invoice)
□ Verify invoice status updated to "Paid"
□ Edit payment
□ Delete payment
□ View payment details
```

Document any failures in a spreadsheet or text file.

---

### **DAY 5: Fixes & Polish (4 hours)**

#### Fix Issues Found (2 hours)
Based on Day 4 testing, fix any broken operations.

Common fixes needed:
- Validation errors in DynamicForm
- Error handling in API endpoints
- Loading states in UI
- Data type mismatches

#### Add Breadcrumbs (1 hour)
```typescript
// Create: src/components/layout/Breadcrumb.tsx

'use client';

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@chakra-ui/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function BreadcrumbNav() {
  const pathname = usePathname();
  const paths = pathname.split('/').filter(Boolean);
  
  return (
    <Breadcrumb mb={4}>
      <BreadcrumbItem>
        <BreadcrumbLink as={Link} href="/dashboard">
          Home
        </BreadcrumbLink>
      </BreadcrumbItem>
      
      {paths.map((path, index) => {
        const href = '/' + paths.slice(0, index + 1).join('/');
        const isLast = index === paths.length - 1;
        
        return (
          <BreadcrumbItem key={path} isCurrentPage={isLast}>
            <BreadcrumbLink as={Link} href={href}>
              {path.charAt(0).toUpperCase() + path.slice(1)}
            </BreadcrumbLink>
          </BreadcrumbItem>
        );
      })}
    </Breadcrumb>
  );
}
```

Add to AppLayout or individual pages.

#### Documentation (1 hour)
Update README.md with:
- Setup instructions
- How to login (credentials for each role)
- How to test each feature
- Known issues

---

## ✅ Sprint Completion Checklist

At the end of Day 5, verify:

### Platform Admin
- [ ] Can login as platform admin
- [ ] Can see platform admin dashboard
- [ ] Can view all tenants
- [ ] Can approve config changes
- [ ] Cannot access tenant-specific pages

### Config Sync
- [ ] Add field in Field Builder
- [ ] Field appears immediately in module form (after reload)
- [ ] Can create record with new field
- [ ] Data saves correctly

### CRUD Operations
- [ ] All 6 modules: Create, Edit, Delete working
- [ ] All conversions working (Lead→Client, Quote→Order, Order→Invoice)
- [ ] All PDFs exporting correctly
- [ ] GST calculation correct
- [ ] Auto-numbering working

### UX Polish
- [ ] Breadcrumbs showing on all pages
- [ ] Navigation clearly shows user role
- [ ] Error messages are helpful
- [ ] Loading states prevent double-submission

---

## 🚨 If You Get Stuck

### Config Sync Still Not Working?
1. Clear browser cache (Ctrl+Shift+Delete)
2. Check Network tab in DevTools - is API being called?
3. Check API response - does it include new field?
4. Check React state - is setModuleConfig being called?
5. Add React Query for auto-refresh (see PLATFORM_ANALYSIS.md)

### Platform Admin Routes 404?
1. Verify files are in correct location (`src/app/platform-admin/`)
2. Check middleware config matcher pattern
3. Restart Next.js dev server (`npm run dev`)
4. Check browser console for errors

### CRUD Operations Failing?
1. Check API endpoint exists (`src/app/api/modules/[moduleName]/records/`)
2. Check browser Network tab for API errors
3. Check server logs for errors
4. Verify DynamicRecordService is being called
5. Check database - is data being saved?

---

## 📞 Need Help?

1. Read detailed analysis in `PLATFORM_ANALYSIS.md`
2. Check architecture overview in `ARCHITECTURE_OVERVIEW.md`
3. Review existing implementation in codebase
4. Ask specific questions about blockers

---

## 🎉 Success!

After completing this sprint, you'll have:
- ✅ Clear governance model (Platform Admin vs Tenant Admin)
- ✅ Working config sync (fields appear immediately)
- ✅ Validated CRUD operations (all modules working)
- ✅ Production-ready core functionality

**Next**: User acceptance testing → Phase 2 features → Production!
