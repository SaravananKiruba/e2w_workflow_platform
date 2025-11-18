const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function showTenants() {
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
      }
    });

    console.log('\n=== EXISTING TENANTS ===\n');
    
    if (tenants.length === 0) {
      console.log('No tenants found in the database.');
    } else {
      tenants.forEach((tenant, index) => {
        console.log(`\n[${index + 1}] Tenant: ${tenant.name}`);
        console.log(`    Slug: ${tenant.slug}`);
        console.log(`    Domain: ${tenant.domain || 'N/A'}`);
        console.log(`    Status: ${tenant.status}`);
        console.log(`    Subscription: ${tenant.subscriptionTier}`);
        console.log(`    Created: ${tenant.createdAt}`);
        
        if (tenant.users.length > 0) {
          console.log(`\n    Admin Users:`);
          tenant.users.forEach(user => {
            console.log(`      - Email: ${user.email}`);
            console.log(`        Name: ${user.name}`);
            console.log(`        Status: ${user.status}`);
            console.log(`        Note: Password is hashed (use password reset to set a new one)`);
          });
        } else {
          console.log(`    No admin users found for this tenant.`);
        }
        console.log('\n    ' + '-'.repeat(60));
      });
      
      console.log(`\n\nTotal Tenants: ${tenants.length}\n`);
      console.log('NOTE: Passwords are hashed and cannot be displayed.');
      console.log('Use the platform admin panel to reset passwords if needed.\n');
    }
  } catch (error) {
    console.error('Error fetching tenants:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showTenants();
