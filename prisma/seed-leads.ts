import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedLeadsModule() {
  console.log('🌱 Seeding Leads module configuration...')

  const demoTenant = await prisma.tenant.findUnique({
    where: { slug: 'demo' },
  })

  if (!demoTenant) {
    console.log('❌ Demo tenant not found')
    return
  }

  const leadsConfig = {
    moduleName: 'Leads',
    displayName: 'Leads',
    icon: '📊',
    description: 'Manage and track potential customers',
    fields: [
      {
        name: 'name',
        label: 'Lead Name',
        dataType: 'text',
        uiType: 'textbox',
        isRequired: true,
        config: { maxLength: 255 },
        placeholder: 'Enter lead name',
      },
      {
        name: 'email',
        label: 'Email',
        dataType: 'email',
        uiType: 'email',
        isRequired: true,
        validation: [{ type: 'email' }],
        placeholder: 'lead@example.com',
      },
      {
        name: 'phone',
        label: 'Phone Number',
        dataType: 'phone',
        uiType: 'phone',
        isRequired: false,
        placeholder: '+91 9876543210',
      },
      {
        name: 'company',
        label: 'Company',
        dataType: 'text',
        uiType: 'textbox',
        isRequired: false,
        placeholder: 'Company name',
      },
      {
        name: 'source',
        label: 'Lead Source',
        dataType: 'dropdown',
        uiType: 'dropdown',
        isRequired: true,
        config: {
          options: ['Google Ads', 'Meta Ads', 'LinkedIn', 'Referral', 'Website', 'Cold Call', 'Other'],
        },
      },
      {
        name: 'status',
        label: 'Status',
        dataType: 'dropdown',
        uiType: 'dropdown',
        isRequired: true,
        config: {
          options: ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'],
        },
        defaultValue: 'New',
      },
      {
        name: 'priority',
        label: 'Priority',
        dataType: 'dropdown',
        uiType: 'dropdown',
        isRequired: false,
        config: {
          options: ['Low', 'Medium', 'High', 'Urgent'],
        },
        defaultValue: 'Medium',
      },
      {
        name: 'expectedValue',
        label: 'Expected Deal Value',
        dataType: 'currency',
        uiType: 'currency',
        isRequired: false,
        config: { currency: 'INR', decimals: 2 },
        placeholder: '0.00',
      },
      {
        name: 'notes',
        label: 'Notes',
        dataType: 'textarea',
        uiType: 'textarea',
        isRequired: false,
        config: { maxLength: 5000 },
        placeholder: 'Additional information...',
      },
    ],
  }

  await prisma.moduleConfiguration.upsert({
    where: {
      tenantId_moduleName_version: {
        tenantId: demoTenant.id,
        moduleName: 'Leads',
        version: 1,
      },
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      moduleName: 'Leads',
      displayName: 'Leads',
      icon: '📊',
      description: 'Manage and track potential customers',
      fields: JSON.stringify(leadsConfig.fields),
      status: 'active',
      version: 1,
    },
  })

  console.log('✅ Leads module seeded')
}

seedLeadsModule()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
