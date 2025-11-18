# Easy2Work Tenant Management Guide

## 📋 Current Tenants

You have **2 tenants** created:

### 1. Grace Media
- **Email:** `admin@grace-media.easy2work.com`
- **Domain:** `grace-media.easy2work.com`
- **Status:** ✅ Active
- **Tier:** Enterprise

### 2. Baleen Media
- **Email:** `admin@baleen-media.easy2work.com`
- **Domain:** `baleen-media.easy2work.com`
- **Status:** ✅ Active
- **Tier:** Enterprise

---

## 🔑 How to Get/Reset Passwords

Since passwords were shown only once during creation and are now hashed, here are 3 ways to reset them:

### Option 1: Using Command Line Script (Easiest)
```bash
# Interactive password reset
node scripts/manage-tenants.js --reset

# Then follow the prompts:
# 1. Choose tenant number (1 or 2)
# 2. Enter new password (min 6 characters)
# 3. Copy the displayed credentials
```

### Option 2: Using Platform Admin Web UI
1. Open: `http://localhost:3000/platform-admin/tenants`
2. Log in as platform admin
3. Find the tenant in the table
4. Click the 🔑 **"Reset Password"** button
5. Enter new password
6. Copy credentials from the modal

### Option 3: Using Prisma Studio
```bash
npx prisma studio
# Then manually update the password hash (not recommended)
```

---

## 📝 Example: Reset Password for Grace Media

```bash
node scripts/manage-tenants.js --reset
```

**Output:**
```
Your choice: 1
Enter new password: Welcome123
✅ PASSWORD RESET SUCCESSFUL!
Email:    admin@grace-media.easy2work.com
Password: Welcome123
```

---

## 🎯 Quick Actions

### View All Tenants
```bash
node scripts/show-tenants.js
# or
node scripts/manage-tenants.js
```

### Reset Tenant Password
```bash
node scripts/manage-tenants.js --reset
```

### Open Database Browser
```bash
npx prisma studio
```

### Access Platform Admin Panel
Navigate to: `http://localhost:3000/platform-admin/tenants`

---

## 🔐 Security Notes

1. ✅ All passwords are hashed using bcrypt
2. ✅ Original passwords cannot be retrieved
3. ✅ Platform admins can reset passwords anytime
4. ✅ Tenant admins can change their password after login
5. ⚠️  Always share credentials securely (never via plain email)

---

## 🚀 Next Steps

1. **Reset passwords now** using one of the methods above
2. **Share credentials securely** with tenant admins
3. **Instruct tenants** to change password after first login
4. **Document** the temporary passwords in a secure location

---

**Need help?** Run `node scripts/manage-tenants.js --help` for more options.
