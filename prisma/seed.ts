import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create metadata library entries
  const fieldTypes = [
    { category: 'field_types', name: 'text', label: 'Text', description: 'Single line text input', config: JSON.stringify({ maxLength: 255 }) },
    { category: 'field_types', name: 'textarea', label: 'Text Area', description: 'Multi-line text input', config: JSON.stringify({ maxLength: 5000 }) },
    { category: 'field_types', name: 'number', label: 'Number', description: 'Numeric input', config: JSON.stringify({ min: null, max: null }) },
    { category: 'field_types', name: 'currency', label: 'Currency', description: 'Currency amount', config: JSON.stringify({ currency: 'INR', decimals: 2 }) },
    { category: 'field_types', name: 'date', label: 'Date', description: 'Date picker', config: JSON.stringify({}) },
    { category: 'field_types', name: 'datetime', label: 'Date Time', description: 'Date and time picker', config: JSON.stringify({}) },
    { category: 'field_types', name: 'email', label: 'Email', description: 'Email address', config: JSON.stringify({}) },
    { category: 'field_types', name: 'phone', label: 'Phone', description: 'Phone number', config: JSON.stringify({}) },
    { category: 'field_types', name: 'url', label: 'URL', description: 'Website URL', config: JSON.stringify({}) },
    { category: 'field_types', name: 'dropdown', label: 'Dropdown', description: 'Select from list', config: JSON.stringify({ options: [] }) },
    { category: 'field_types', name: 'multiselect', label: 'Multi Select', description: 'Select multiple from list', config: JSON.stringify({ options: [] }) },
    { category: 'field_types', name: 'checkbox', label: 'Checkbox', description: 'True/false value', config: JSON.stringify({}) },
    { category: 'field_types', name: 'radio', label: 'Radio Button', description: 'Select one option', config: JSON.stringify({ options: [] }) },
    { category: 'field_types', name: 'file', label: 'File Upload', description: 'File attachment', config: JSON.stringify({ maxSize: 10485760, accept: '*' }) },
    { category: 'field_types', name: 'formula', label: 'Formula', description: 'Calculated field', config: JSON.stringify({ expression: '' }) },
    { category: 'field_types', name: 'lookup', label: 'Lookup/Reference', description: 'Link to records in another module', config: JSON.stringify({ targetModule: '', displayField: '', searchFields: [] }) },
    { category: 'field_types', name: 'table', label: 'Table/Line Items', description: 'Nested table with multiple rows', config: JSON.stringify({ columns: [], allowAdd: true, allowDelete: true, allowEdit: true }) },
  ]

  const uiComponents = [
    { category: 'ui_components', name: 'textbox', label: 'Text Box', description: 'Standard text input', config: JSON.stringify({}) },
    { category: 'ui_components', name: 'badge', label: 'Badge', description: 'Colored badge display', config: JSON.stringify({}) },
    { category: 'ui_components', name: 'table', label: 'Table', description: 'Data table view', config: JSON.stringify({}) },
    { category: 'ui_components', name: 'chart', label: 'Chart', description: 'Graphical visualization', config: JSON.stringify({ chartType: 'bar' }) },
    { category: 'ui_components', name: 'card', label: 'Card', description: 'Card container', config: JSON.stringify({}) },
  ]

  const validationTypes = [
    { category: 'validation_types', name: 'required', label: 'Required', description: 'Field must have value', config: JSON.stringify({ message: 'This field is required' }) },
    { category: 'validation_types', name: 'email', label: 'Email Format', description: 'Valid email address', config: JSON.stringify({}) },
    { category: 'validation_types', name: 'phone', label: 'Phone Format', description: 'Valid phone number', config: JSON.stringify({ pattern: '^[0-9]{10}$' }) },
    { category: 'validation_types', name: 'min_length', label: 'Min Length', description: 'Minimum character length', config: JSON.stringify({ min: 0 }) },
    { category: 'validation_types', name: 'max_length', label: 'Max Length', description: 'Maximum character length', config: JSON.stringify({ max: 255 }) },
    { category: 'validation_types', name: 'range', label: 'Number Range', description: 'Value within range', config: JSON.stringify({ min: 0, max: 100 }) },
    { category: 'validation_types', name: 'regex', label: 'Regex Pattern', description: 'Custom regex validation', config: JSON.stringify({ pattern: '' }) },
    { category: 'validation_types', name: 'unique', label: 'Unique Value', description: 'No duplicates allowed', config: JSON.stringify({}) },
  ]

  const layoutTemplates = [
    { category: 'layout_templates', name: 'single_column', label: 'Single Column', description: 'One column layout', config: JSON.stringify({}) },
    { category: 'layout_templates', name: 'two_column', label: 'Two Column', description: 'Two column layout', config: JSON.stringify({}) },
    { category: 'layout_templates', name: 'tabbed', label: 'Tabbed', description: 'Tab-based layout', config: JSON.stringify({ tabs: [] }) },
    { category: 'layout_templates', name: 'wizard', label: 'Wizard', description: 'Step-by-step wizard', config: JSON.stringify({ steps: [] }) },
  ]

  const allMetadata = [...fieldTypes, ...uiComponents, ...validationTypes, ...layoutTemplates]

  for (const item of allMetadata) {
    await prisma.metadataLibrary.upsert({
      where: { category_name: { category: item.category, name: item.name } },
      update: {},
      create: item,
    })
  }

  console.log('✅ Metadata library seeded')

  // Create demo tenant
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Company',
      slug: 'demo',
      domain: 'demo.easy2work.com',
      status: 'active',
      subscriptionTier: 'professional',
      storageUsedMB: 25.5,
      recordCount: 150,
      maxUsers: 50,
      maxStorage: 5000, // 5GB
      settings: JSON.stringify({
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        dateFormat: 'DD/MM/YYYY',
      }),
      branding: JSON.stringify({
        primaryColor: '#2196f3',
        logo: '/images/demo-logo.png',
      }),
    },
  })

  console.log('✅ Demo tenant created:', demoTenant.name)

  // Create another test tenant
  const acmeTenant = await prisma.tenant.upsert({
    where: { slug: 'acme' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme',
      domain: 'acme.easy2work.com',
      status: 'active',
      subscriptionTier: 'enterprise',
      storageUsedMB: 123.75,
      recordCount: 542,
      maxUsers: 100,
      maxStorage: 10000, // 10GB
      settings: JSON.stringify({
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        dateFormat: 'DD/MM/YYYY',
      }),
    },
  })

  console.log('✅ Acme tenant created:', acmeTenant.name)

  // Create inactive tenant for testing
  const inactiveTenant = await prisma.tenant.upsert({
    where: { slug: 'inactive-test' },
    update: {},
    create: {
      name: 'Inactive Test Company',
      slug: 'inactive-test',
      status: 'inactive',
      subscriptionTier: 'free',
      storageUsedMB: 5.2,
      recordCount: 25,
      maxUsers: 5,
      maxStorage: 500, // 500MB
    },
  })

  console.log('✅ Inactive tenant created:', inactiveTenant.name)

  // Create demo branch
  const demoBranch = await prisma.branch.upsert({
    where: { tenantId_code: { tenantId: demoTenant.id, code: 'HQ' } },
    update: {},
    create: {
      tenantId: demoTenant.id,
      name: 'Head Office',
      code: 'HQ',
      address: JSON.stringify({
        street: '123 Business Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India',
      }),
      contact: JSON.stringify({
        phone: '+91 22 1234 5678',
        email: 'hq@demo.com',
      }),
      gstNumber: '27AABCU9603R1ZM',
    },
  })

  console.log('✅ Demo branch created:', demoBranch.name)

  // Create Acme branch
  const acmeBranch = await prisma.branch.upsert({
    where: { tenantId_code: { tenantId: acmeTenant.id, code: 'HQ' } },
    update: {},
    create: {
      tenantId: acmeTenant.id,
      name: 'Acme HQ',
      code: 'HQ',
      address: JSON.stringify({
        street: '456 Tech Park',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        country: 'India',
      }),
      contact: JSON.stringify({
        phone: '+91 80 9876 5432',
        email: 'hq@acme.com',
      }),
    },
  })

  console.log('✅ Acme branch created:', acmeBranch.name)

  // ==========================================
  // CREATE USERS WITH DIFFERENT ROLES
  // ==========================================

  // 1. PLATFORM ADMIN (Super Admin for SaaS Provider)
  const platformAdminPassword = await bcrypt.hash('Platform@123', 10)
  const platformAdmin = await prisma.user.upsert({
    where: { email: 'platform@easy2work.com' },
    update: {},
    create: {
      email: 'platform@easy2work.com',
      name: 'Platform Administrator',
      password: platformAdminPassword,
      tenantId: demoTenant.id,
      branchId: demoBranch.id,
      role: 'platform_admin',
      status: 'active',
    },
  })

  console.log('✅ Platform admin created:', platformAdmin.email)

  // 2. TENANT ADMIN (Demo Company)
  const hashedPassword = await bcrypt.hash('demo@123', 10)
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@easy2work.com' },
    update: {},
    create: {
      email: 'demo@easy2work.com',
      name: 'Demo Admin',
      password: hashedPassword,
      tenantId: demoTenant.id,
      branchId: demoBranch.id,
      role: 'admin',
      status: 'active',
    },
  })

  console.log('✅ Demo admin (tenant admin) created:', demoUser.email)

  // 3. MANAGER (Demo Company)
  const managerPassword = await bcrypt.hash('Manager@123', 10)
  const manager = await prisma.user.upsert({
    where: { email: 'manager@demo.com' },
    update: {},
    create: {
      email: 'manager@demo.com',
      name: 'Sales Manager',
      password: managerPassword,
      tenantId: demoTenant.id,
      branchId: demoBranch.id,
      role: 'manager',
      status: 'active',
    },
  })

  console.log('✅ Manager created:', manager.email)

  // 4. STAFF (Demo Company)
  const staffPassword = await bcrypt.hash('Staff@123', 10)
  const staff = await prisma.user.upsert({
    where: { email: 'staff@demo.com' },
    update: {},
    create: {
      email: 'staff@demo.com',
      name: 'John Staff',
      password: staffPassword,
      tenantId: demoTenant.id,
      branchId: demoBranch.id,
      role: 'staff',
      status: 'active',
    },
  })

  console.log('✅ Staff user created:', staff.email)

  // 5. TENANT ADMIN (Acme Corporation)
  const acmeAdminPassword = await bcrypt.hash('Acme@123', 10)
  const acmeAdmin = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
      email: 'admin@acme.com',
      name: 'Acme Administrator',
      password: acmeAdminPassword,
      tenantId: acmeTenant.id,
      branchId: acmeBranch.id,
      role: 'admin',
      status: 'active',
    },
  })

  console.log('✅ Acme admin (tenant admin) created:', acmeAdmin.email)

  console.log('\n📋 User Credentials Summary:')
  console.log('================================')
  console.log('Platform Admin:')
  console.log('  Email: platform@easy2work.com')
  console.log('  Pass:  Platform@123')
  console.log('\nDemo Tenant Admin:')
  console.log('  Email: demo@easy2work.com')
  console.log('  Pass:  demo@123')
  console.log('\nDemo Manager:')
  console.log('  Email: manager@demo.com')
  console.log('  Pass:  Manager@123')
  console.log('\nDemo Staff:')
  console.log('  Email: staff@demo.com')
  console.log('  Pass:  Staff@123')
  console.log('\nAcme Admin:')
  console.log('  Email: admin@acme.com')
  console.log('  Pass:  Acme@123')
  console.log('================================\n')

  // Initialize auto-numbering sequences for demo tenant
  const autoNumberModules = [
    { moduleName: 'Quotations', prefix: 'QT', format: '{prefix}-{padded:5}' },
    { moduleName: 'Orders', prefix: 'ORD', format: '{prefix}-{padded:5}' },
    { moduleName: 'Invoices', prefix: 'INV', format: '{prefix}/{year}/{padded:3}' },
    { moduleName: 'Payments', prefix: 'TXN', format: '{prefix}-{padded:5}' },
  ];

  for (const module of autoNumberModules) {
    await prisma.autoNumberSequence.upsert({
      where: {
        tenantId_moduleName: {
          tenantId: demoTenant.id,
          moduleName: module.moduleName,
        },
      },
      update: {},
      create: {
        tenantId: demoTenant.id,
        moduleName: module.moduleName,
        prefix: module.prefix,
        format: module.format,
        nextNumber: 1,
      },
    });
  }

  console.log('✅ Auto-numbering sequences initialized for demo tenant')

  // Seed module configurations
  console.log('\n🌱 Seeding module configurations...')
  
  // Run module seeders using tsx
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  try {
    await execAsync('npx tsx prisma/seed-leads.ts');
    await execAsync('npx tsx prisma/seed-clients.ts');
    await execAsync('npx tsx prisma/seed-quotations.ts');
    await execAsync('npx tsx prisma/seed-orders.ts');
    await execAsync('npx tsx prisma/seed-invoices.ts');
    await execAsync('npx tsx prisma/seed-payments.ts');
    await execAsync('npx tsx prisma/seed-analytics.ts');
    console.log('✅ All module configurations seeded');
  } catch (error) {
    console.error('⚠️ Some module configurations failed to seed:', error);
  }

  // ==========================================
  // PURCHASE & VENDOR MANAGEMENT (DYNAMIC)
  // ==========================================
  const { seedPurchaseModules } = await import('./seed-purchase-dynamic')
  await seedPurchaseModules(demoTenant.id, demoUser.id)

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
