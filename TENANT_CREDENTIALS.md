# Easy2Work - Tenant Credentials Summary
**Generated:** November 18, 2025

---

## 📋 EXISTING TENANTS

### 1️⃣ Baleen Media
- **Tenant ID:** (Check database for ID)
- **Slug:** `baleen-media`
- **Domain:** `baleen-media.easy2work.com`
- **Status:** ✅ Active
- **Subscription:** 🚀 Enterprise
- **Created:** November 18, 2025, 12:04:23 PM IST

#### Admin User:
- **Email:** `admin@baleen-media.easy2work.com`
- **Password:** ⚠️ Password was shown only once during creation (hashed in database)
- **Status:** Active

---

### 2️⃣ Grace Media
- **Tenant ID:** (Check database for ID)
- **Slug:** `grace-media`
- **Domain:** `grace-media.easy2work.com`
- **Status:** ✅ Active
- **Subscription:** 🚀 Enterprise
- **Created:** November 18, 2025, 12:05:41 PM IST

#### Admin User:
- **Email:** `admin@grace-media.easy2work.com`
- **Password:** ⚠️ Password was shown only once during creation (hashed in database)
- **Status:** Active

---

## 🔑 HOW TO RESET TENANT ADMIN PASSWORDS

Since passwords are hashed and cannot be retrieved, use the Platform Admin panel to reset them:

### Method 1: Via Platform Admin UI
1. Go to: `http://localhost:3000/platform-admin/tenants`
2. Find the tenant in the table
3. Click the 🔑 "Reset Password" button in the Actions column
4. Enter a new password (minimum 6 characters)
5. Click "Reset Password"
6. Copy the displayed credentials and share with the tenant admin

### Method 2: Via API
```bash
# Reset password for Baleen Media
POST /api/admin/tenants/{tenantId}/reset-admin-password
Content-Type: application/json

{
  "password": "newPassword123"
}
```

Response will include:
- email
- password (plaintext, for one-time sharing)
- success message

---

## 🔐 PLATFORM ADMIN ACCESS

To manage tenants, you need platform admin credentials. If you don't have them:

1. Check your `.env` file for initial platform admin user
2. Or use the existing platform admin account you're logged in with

---

## 📝 NOTES

1. **Security Best Practice:** Passwords are only shown once during tenant creation or password reset
2. **All passwords are hashed** using bcrypt with 10 rounds
3. **Tenant admins can change their password** after first login via their profile settings
4. **Platform admins** can:
   - Create new tenants
   - Reset tenant admin passwords
   - View all tenant information
   - Activate/Deactivate tenants
   - Manage subscription tiers

---

## 🚀 NEXT STEPS

1. **If you need credentials now:** Use the Platform Admin panel to reset passwords
2. **For new tenants:** The credentials will be displayed immediately after creation
3. **Document credentials securely:** Use a password manager or secure documentation system

---

## 📞 SUPPORT

If you need to:
- View tenant details: Run `node scripts/show-tenants.js`
- Access Platform Admin UI: `http://localhost:3000/platform-admin/tenants`
- Check database directly: `npx prisma studio`

---

*This document is for platform administrator reference only. Keep it secure.*
