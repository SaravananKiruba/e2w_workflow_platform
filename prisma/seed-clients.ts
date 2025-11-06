import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedClientsModule() {
  console.log('🌱 Seeding Clients module configuration...')

  const demoTenant = await prisma.tenant.findUnique({
    where: { slug: 'demo' },
  })

  if (!demoTenant) {
    console.log('❌ Demo tenant not found')
    return
  }

  const clientsConfig = {
    fields: [
      {
        name: 'clientName',
        label: 'Client Name',
        dataType: 'text',
        uiType: 'textbox',
        isRequired: true,
        isUnique: true,
        config: { maxLength: 255 },
        placeholder: 'Enter client name',
      },
      {
        name: 'gstin',
        label: 'GSTIN',
        dataType: 'text',
        uiType: 'textbox',
        isRequired: false,
        config: { maxLength: 15 },
        placeholder: '27AABCU9603R1ZM',
        helpText: '15-digit GST Identification Number',
      },
      {
        name: 'pan',
        label: 'PAN',
        dataType: 'text',
        uiType: 'textbox',
        isRequired: false,
        config: { maxLength: 10 },
        placeholder: 'ABCDE1234F',
        helpText: '10-character PAN number',
      },
      {
        name: 'industry',
        label: 'Industry',
        dataType: 'dropdown',
        uiType: 'dropdown',
        isRequired: false,
        config: {
          options: [
            'IT & Software',
            'Manufacturing',
            'Retail',
            'Healthcare',
            'Finance',
            'Education',
            'Real Estate',
            'Hospitality',
            'Other',
          ],
        },
      },
      {
        name: 'contactPerson',
        label: 'Contact Person',
        dataType: 'text',
        uiType: 'textbox',
        isRequired: true,
        placeholder: 'Primary contact name',
      },
      {
        name: 'email',
        label: 'Email',
        dataType: 'email',
        uiType: 'email',
        isRequired: true,
        validation: [{ type: 'email' }],
        placeholder: 'contact@company.com',
      },
      {
        name: 'phone',
        label: 'Phone',
        dataType: 'phone',
        uiType: 'phone',
        isRequired: true,
        placeholder: '+91 9876543210',
      },
      {
        name: 'alternatePhone',
        label: 'Alternate Phone',
        dataType: 'phone',
        uiType: 'phone',
        isRequired: false,
        placeholder: '+91 9876543210',
      },
      {
        name: 'billingAddress',
        label: 'Billing Address',
        dataType: 'textarea',
        uiType: 'textarea',
        isRequired: true,
        config: { maxLength: 500 },
        placeholder: 'Street, City, State, Pincode',
      },
      {
        name: 'shippingAddress',
        label: 'Shipping Address',
        dataType: 'textarea',
        uiType: 'textarea',
        isRequired: false,
        config: { maxLength: 500 },
        placeholder: 'Same as billing or different address',
      },
      {
        name: 'creditLimit',
        label: 'Credit Limit',
        dataType: 'currency',
        uiType: 'currency',
        isRequired: false,
        config: { currency: 'INR', decimals: 2 },
        placeholder: '0.00',
      },
      {
        name: 'paymentTerms',
        label: 'Payment Terms',
        dataType: 'dropdown',
        uiType: 'dropdown',
        isRequired: false,
        config: {
          options: ['Immediate', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Custom'],
        },
        defaultValue: 'Net 30',
      },
      {
        name: 'status',
        label: 'Status',
        dataType: 'dropdown',
        uiType: 'dropdown',
        isRequired: true,
        config: {
          options: ['Active', 'Inactive', 'Suspended'],
        },
        defaultValue: 'Active',
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
        moduleName: 'Clients',
        version: 1,
      },
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      moduleName: 'Clients',
      displayName: 'Clients',
      icon: '👥',
      description: 'Manage customer information and relationships',
      fields: JSON.stringify(clientsConfig.fields),
      status: 'active',
      version: 1,
    },
  })

  console.log('✅ Clients module seeded')
}

seedClientsModule()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
