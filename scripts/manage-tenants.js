const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function showTenantsWithDetails() {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        users: {
          where: { role: 'admin' },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
            createdAt: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║           EASY2WORK - TENANT MANAGEMENT                      ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    
    if (tenants.length === 0) {
      console.log('❌ No tenants found in the database.\n');
      return [];
    }

    console.log(`📊 Total Tenants: ${tenants.length}\n`);
    
    tenants.forEach((tenant, index) => {
      console.log(`\n┌─────────────────────────────────────────────────────────────┐`);
      console.log(`│ [${index + 1}] ${tenant.name.toUpperCase()}`);
      console.log(`└─────────────────────────────────────────────────────────────┘`);
      console.log(`   🆔 Tenant ID:    ${tenant.id}`);
      console.log(`   🔗 Slug:         ${tenant.slug}`);
      console.log(`   🌐 Domain:       ${tenant.domain || 'N/A'}`);
      console.log(`   📊 Status:       ${tenant.status === 'active' ? '✅' : '❌'} ${tenant.status.toUpperCase()}`);
      console.log(`   💎 Tier:         ${tenant.subscriptionTier.toUpperCase()}`);
      console.log(`   📅 Created:      ${new Date(tenant.createdAt).toLocaleString()}`);
      console.log(`   👥 Max Users:    ${tenant.maxUsers}`);
      console.log(`   💾 Storage:      ${tenant.storageUsedMB.toFixed(2)} MB / ${tenant.maxStorage} MB`);
      console.log(`   📁 Records:      ${tenant.recordCount}`);
      
      if (tenant.users.length > 0) {
        console.log(`\n   🔐 ADMIN USERS:`);
        tenant.users.forEach(user => {
          console.log(`      ├─ Email:  ${user.email}`);
          console.log(`      ├─ Name:   ${user.name}`);
          console.log(`      ├─ Status: ${user.status === 'active' ? '✅' : '❌'} ${user.status}`);
          console.log(`      └─ Note:   Password is hashed (use reset option)`);
        });
      } else {
        console.log(`\n   ⚠️  No admin users found for this tenant!`);
      }
    });
    
    console.log(`\n${'─'.repeat(65)}\n`);
    return tenants;
  } catch (error) {
    console.error('❌ Error fetching tenants:', error);
    return [];
  }
}

async function resetTenantAdminPassword() {
  const tenants = await showTenantsWithDetails();
  
  if (tenants.length === 0) {
    rl.close();
    await prisma.$disconnect();
    return;
  }

  console.log('\n🔑 PASSWORD RESET OPTIONS:');
  console.log('   Enter tenant number (1-' + tenants.length + ') to reset admin password');
  console.log('   Or press Enter to exit\n');

  const choice = await question('Your choice: ');
  
  if (!choice || choice.trim() === '') {
    console.log('\n👋 Exiting...\n');
    rl.close();
    await prisma.$disconnect();
    return;
  }

  const tenantIndex = parseInt(choice) - 1;
  
  if (isNaN(tenantIndex) || tenantIndex < 0 || tenantIndex >= tenants.length) {
    console.log('\n❌ Invalid choice!\n');
    rl.close();
    await prisma.$disconnect();
    return;
  }

  const selectedTenant = tenants[tenantIndex];
  
  if (!selectedTenant.users || selectedTenant.users.length === 0) {
    console.log('\n❌ No admin user found for this tenant!\n');
    rl.close();
    await prisma.$disconnect();
    return;
  }

  const adminUser = selectedTenant.users[0];
  
  console.log(`\n📝 Resetting password for: ${adminUser.email}`);
  const newPassword = await question('Enter new password (min 6 characters): ');
  
  if (!newPassword || newPassword.length < 6) {
    console.log('\n❌ Password must be at least 6 characters!\n');
    rl.close();
    await prisma.$disconnect();
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { password: hashedPassword },
    });

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║          ✅ PASSWORD RESET SUCCESSFUL!                       ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    console.log('📋 NEW CREDENTIALS:');
    console.log(`   Email:    ${adminUser.email}`);
    console.log(`   Password: ${newPassword}`);
    console.log('\n⚠️  IMPORTANT: Share these credentials securely with the tenant admin.');
    console.log('   They can change the password after logging in.\n');

  } catch (error) {
    console.error('\n❌ Error resetting password:', error);
  }

  rl.close();
  await prisma.$disconnect();
}

// Main execution
(async () => {
  const args = process.argv.slice(2);
  
  if (args.includes('--reset') || args.includes('-r')) {
    await resetTenantAdminPassword();
  } else {
    await showTenantsWithDetails();
    rl.close();
    await prisma.$disconnect();
  }
})();
