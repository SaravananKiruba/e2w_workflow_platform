import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedAnalyticsModule() {
  console.log('🌱 Seeding Analytics module configuration...')

  const demoTenant = await prisma.tenant.findUnique({
    where: { slug: 'demo' },
  })

  if (!demoTenant) {
    console.log('❌ Demo tenant not found')
    return
  }

  const analyticsConfig = {
    fields: [
      {
        name: 'metricName',
        label: 'Metric Name',
        dataType: 'text',
        uiType: 'textbox',
        isRequired: true,
        config: { maxLength: 100 },
        placeholder: 'e.g., Total Revenue, Pending Orders',
      },
      {
        name: 'metricType',
        label: 'Metric Type',
        dataType: 'dropdown',
        uiType: 'dropdown',
        isRequired: true,
        config: {
          options: ['Revenue', 'Count', 'Percentage', 'Average', 'Sum', 'Trend', 'Custom'],
        },
      },
      {
        name: 'dataSource',
        label: 'Data Source',
        dataType: 'dropdown',
        uiType: 'dropdown',
        isRequired: true,
        config: {
          options: ['Orders', 'Invoices', 'Payments', 'Quotations', 'Custom'],
        },
      },
      {
        name: 'value',
        label: 'Current Value',
        dataType: 'currency',
        uiType: 'currency',
        isRequired: true,
        config: { currency: 'INR', decimals: 2 },
        readOnly: true,
      },
      {
        name: 'previousValue',
        label: 'Previous Period Value',
        dataType: 'currency',
        uiType: 'currency',
        isRequired: false,
        config: { currency: 'INR', decimals: 2 },
        readOnly: true,
      },
      {
        name: 'percentageChange',
        label: 'Change %',
        dataType: 'number',
        uiType: 'number',
        isRequired: false,
        readOnly: true,
      },
      {
        name: 'period',
        label: 'Period',
        dataType: 'dropdown',
        uiType: 'dropdown',
        isRequired: true,
        config: {
          options: ['Today', 'This Week', 'This Month', 'This Quarter', 'This Year', 'Last 30 Days', 'Last 90 Days'],
        },
      },
      {
        name: 'startDate',
        label: 'Period Start Date',
        dataType: 'date',
        uiType: 'date',
        isRequired: true,
      },
      {
        name: 'endDate',
        label: 'Period End Date',
        dataType: 'date',
        uiType: 'date',
        isRequired: true,
      },
      {
        name: 'filters',
        label: 'Applied Filters',
        dataType: 'json',
        uiType: 'textbox',
        isRequired: false,
        config: { maxLength: 1000 },
        placeholder: 'JSON filters applied to metric calculation',
        readOnly: true,
      },
      {
        name: 'lastUpdated',
        label: 'Last Updated',
        dataType: 'datetime',
        uiType: 'datetime',
        isRequired: true,
        readOnly: true,
      },
    ],
  }

  await prisma.moduleConfiguration.upsert({
    where: {
      tenantId_moduleName_version: {
        tenantId: demoTenant.id,
        moduleName: 'Analytics',
        version: 1,
      },
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      moduleName: 'Analytics',
      displayName: 'Analytics',
      icon: '📊',
      description: 'Dashboard metrics and KPI tracking',
      fields: JSON.stringify(analyticsConfig.fields),
      status: 'active',
      version: 1,
    },
  })

  console.log('✅ Analytics module seeded')
}

seedAnalyticsModule()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
