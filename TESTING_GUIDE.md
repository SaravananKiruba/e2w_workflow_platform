# 🧪 Quick Testing Guide - Config Sync & Platform Admin

**Purpose**: Verify that all critical fixes are working correctly  
**Duration**: 15-20 minutes  
**Date**: November 7, 2025

---

## Test 1: Platform Admin Access (5 minutes)

### Test 1.1: Platform Admin Login
1. **Logout** if currently logged in
2. **Login** with platform admin credentials:
   - Email: `platform@easy2work.com`
   - Password: `Platform@123`
3. ✅ **Verify**: Login successful

### Test 1.2: Platform Admin Navigation
1. Check navigation menu
2. ✅ **Verify**: "Platform Admin" menu section appears
3. Click "Platform Dashboard"
4. ✅ **Verify**: Navigates to `/platform-admin/dashboard`
5. ✅ **Verify**: Dashboard shows statistics:
   - Total Tenants
   - Total Users
   - Pending Approvals
   - Active Modules

### Test 1.3: Platform Admin Pages
1. Click "Manage Tenants" button or navigate to `/platform-admin/tenants`
2. ✅ **Verify**: Tenants management page loads
3. Navigate to `/platform-admin/approval-queue`
4. ✅ **Verify**: Approval queue page loads
5. Navigate to `/platform-admin/settings`
6. ✅ **Verify**: Settings page loads

### Test 1.4: Access Control
1. **Logout** from platform admin
2. **Login** as regular user:
   - Email: `demo@easy2work.com`
   - Password: `demo@123`
3. Try to access `/platform-admin/dashboard` directly
4. ✅ **Verify**: Redirected to `/unauthorized` page
5. ✅ **Verify**: 403 error message displayed
6. ✅ **Verify**: "Go to Dashboard" button works

**Expected Results**: Platform admin can access all platform-admin routes, regular users cannot.

---

## Test 2: Config Sync - Manual Reload (10 minutes)

### Prerequisites
- Login as admin user (`demo@easy2work.com` / `demo@123`)
- Open browser Developer Tools (F12)
- Switch to Console tab

### Test 2.1: Add New Field
1. Navigate to `/admin/field-builder`
2. Select module: **Leads**
3. Click "Add Field" button
4. Fill in field details:
   - **Name**: `testField`
   - **Label**: `Test Field`
   - **Type**: `Text`
   - **Required**: No
5. Click "Save"
6. ✅ **Verify**: Field added successfully

### Test 2.2: Check Debug Logs
1. Navigate to `/modules/Leads`
2. Check browser console
3. ✅ **Verify**: See `[CONFIG SYNC]` logs:
   ```
   [CONFIG SYNC] Loading config for: Leads
   [CONFIG SYNC] Tenant ID: [tenant-id]
   [CONFIG SYNC] Fetching from: [url]
   [CONFIG SYNC] Response status: 200
   [CONFIG SYNC] Loaded config: {...}
   [CONFIG SYNC] Number of fields: X
   [CONFIG SYNC] Field names: name, email, phone, ..., testField
   ```
4. ✅ **Verify**: `testField` appears in field names list

### Test 2.3: Verify Field in Form
1. On `/modules/Leads` page
2. Look for "🔄 Reload Config" button in header
3. Click "🔄 Reload Config" button
4. ✅ **Verify**: Toast notification appears: "Configuration Reloaded"
5. Click "➕ New Leads" button
6. ✅ **Verify**: Modal opens with form
7. Scroll through form fields
8. ✅ **Verify**: "Test Field" appears in the form

### Test 2.4: Edit Field
1. Go back to `/admin/field-builder`
2. Select module: **Leads**
3. Find "Test Field" and click edit
4. Change label to: `Test Field Updated`
5. Click "Save"
6. Go to `/modules/Leads`
7. Click "🔄 Reload Config" button
8. Click "➕ New Leads" button
9. ✅ **Verify**: Field label shows "Test Field Updated"

### Test 2.5: Delete Field
1. Go to `/admin/field-builder`
2. Select module: **Leads**
3. Find "Test Field Updated" and click delete
4. Confirm deletion
5. Go to `/modules/Leads`
6. Click "🔄 Reload Config" button
7. Check console logs - note new field count
8. Click "➕ New Leads" button
9. ✅ **Verify**: "Test Field Updated" is removed from form

**Expected Results**: Config changes appear immediately after clicking "Reload Config" button.

---

## Test 3: CRUD Operations - Leads Module (5 minutes)

### Test 3.1: Create Lead
1. Navigate to `/modules/Leads`
2. Click "➕ New Leads" button
3. Fill in required fields:
   - **Name**: `Test Lead`
   - **Email**: `testlead@example.com`
   - **Phone**: `9876543210`
   - **Status**: `New`
4. Click "Submit"
5. ✅ **Verify**: Success toast appears
6. ✅ **Verify**: New lead appears in table

### Test 3.2: View Lead
1. Find the "Test Lead" record
2. Click "👁️" (View) button
3. ✅ **Verify**: Modal opens showing lead details
4. ✅ **Verify**: All fields displayed correctly

### Test 3.3: Edit Lead
1. Click "✏️" (Edit) button on "Test Lead"
2. Update **Status** to: `Qualified`
3. Update **Phone** to: `9876543211`
4. Click "Submit"
5. ✅ **Verify**: Success toast appears
6. ✅ **Verify**: Changes reflected in table

### Test 3.4: Convert Lead to Client
1. Click "↩️" (Convert) button on "Test Lead"
2. Wait for conversion process
3. ✅ **Verify**: Success toast: "Lead converted to Client"
4. ✅ **Verify**: Lead status changes to "Converted"
5. Navigate to `/modules/Clients`
6. ✅ **Verify**: New client "Test Lead" appears

### Test 3.5: Delete Lead
1. Go back to `/modules/Leads`
2. Click "🗑️" (Delete) button on "Test Lead"
3. Confirm deletion
4. ✅ **Verify**: Success toast appears
5. ✅ **Verify**: Lead removed from table

**Expected Results**: All CRUD operations work smoothly without errors.

---

## Test 4: Regression Test - Quick Sanity Check (5 minutes)

### Test 4.1: Dashboard Access
1. Navigate to `/dashboard`
2. ✅ **Verify**: Dashboard loads with KPIs
3. ✅ **Verify**: Finance dashboard shows data

### Test 4.2: Workflow Builder
1. Navigate to `/admin/workflow-builder`
2. ✅ **Verify**: Workflow builder page loads
3. ✅ **Verify**: Visual workflow canvas appears

### Test 4.3: Module Navigation
1. Navigate to `/modules/Clients`
2. ✅ **Verify**: Client list loads
3. Navigate to `/modules/Quotations`
4. ✅ **Verify**: Quotation list loads
5. Navigate to `/modules/Invoices`
6. ✅ **Verify**: Invoice list loads

**Expected Results**: All major pages load without errors.

---

## 🎯 Test Results Summary

Fill this out after completing all tests:

| Test | Status | Issues Found |
|------|--------|--------------|
| Test 1.1: Platform Admin Login | ⬜ Pass / ⬜ Fail | |
| Test 1.2: Platform Admin Navigation | ⬜ Pass / ⬜ Fail | |
| Test 1.3: Platform Admin Pages | ⬜ Pass / ⬜ Fail | |
| Test 1.4: Access Control | ⬜ Pass / ⬜ Fail | |
| Test 2.1: Add New Field | ⬜ Pass / ⬜ Fail | |
| Test 2.2: Check Debug Logs | ⬜ Pass / ⬜ Fail | |
| Test 2.3: Verify Field in Form | ⬜ Pass / ⬜ Fail | |
| Test 2.4: Edit Field | ⬜ Pass / ⬜ Fail | |
| Test 2.5: Delete Field | ⬜ Pass / ⬜ Fail | |
| Test 3.1: Create Lead | ⬜ Pass / ⬜ Fail | |
| Test 3.2: View Lead | ⬜ Pass / ⬜ Fail | |
| Test 3.3: Edit Lead | ⬜ Pass / ⬜ Fail | |
| Test 3.4: Convert Lead | ⬜ Pass / ⬜ Fail | |
| Test 3.5: Delete Lead | ⬜ Pass / ⬜ Fail | |
| Test 4: Regression Check | ⬜ Pass / ⬜ Fail | |

**Overall Test Result**: ⬜ Pass / ⬜ Fail  
**Issues Count**: 0  
**Critical Issues**: 0

---

## 🐛 Issue Reporting Template

If you find any issues, document them here:

### Issue #1
**Test**: [Test number and name]  
**Severity**: Critical / High / Medium / Low  
**Description**: [What went wrong]  
**Steps to Reproduce**:
1. 
2. 
3. 

**Expected**: [What should happen]  
**Actual**: [What actually happened]  
**Screenshots**: [If applicable]  
**Console Errors**: [Copy from browser console]

---

## ✅ Next Steps After Testing

### If All Tests Pass ✅
1. Mark Task #11 as COMPLETE
2. Proceed to Day 4 tasks (CRUD testing for all modules)
3. Update `SPRINT_PROGRESS_REPORT.md`

### If Tests Fail ❌
1. Document all issues using template above
2. Prioritize critical issues
3. Fix issues before proceeding
4. Re-run failed tests

---

## 📞 Need Help?

**Console not showing logs?**
- Refresh page with cache cleared (Ctrl+Shift+R / Cmd+Shift+R)
- Check if console filter is set to "All levels"

**Platform admin login not working?**
- Verify seed script ran: Check if user exists in database
- Run: `npx prisma db seed`

**Config not reloading?**
- Check Network tab - verify API call to `/api/modules?...`
- Check response contains updated fields
- Clear browser cache completely

**Still stuck?**
- Review `SPRINT_PROGRESS_REPORT.md` for technical details
- Check `[CONFIG SYNC]` logs in console for clues
- Verify middleware is active (check for `x-tenant-id` header in Network tab)

---

**Testing Checklist**:
- [ ] All 15 test cases executed
- [ ] Results documented in summary table
- [ ] Issues reported (if any)
- [ ] Next steps identified
- [ ] Progress report updated

**Happy Testing!** 🧪✨
