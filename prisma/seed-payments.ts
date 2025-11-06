import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedPaymentsModule() {
  console.log('🌱 Seeding Payments module configuration...')

  const demoTenant = await prisma.tenant.findUnique({
    where: { slug: 'demo' },
  })

  if (!demoTenant) {
    console.log('❌ Demo tenant not found')
    return
  }

  const paymentsConfig = {
    fields: [
      {
        name: 'transactionId',
        label: 'Transaction ID',
        dataType: 'text',
        uiType: 'textbox',
        isRequired: true,
        isUnique: true,
        config: { maxLength: 100 },
        placeholder: 'TXN-001',
        readOnly: true,
      },
      {
        name: 'invoiceId',
        label: 'Invoice',
        dataType: 'lookup',
        uiType: 'lookup',
        isRequired: true,
        placeholder: 'Select invoice',
        config: {
          targetModule: 'Invoices',
          displayField: 'invoiceNumber',
          searchFields: ['invoiceNumber', 'clientName'],
          cascadeFields: {
            invoiceNumber: 'invoiceNumber',
            total: 'invoiceAmount',
            clientId: 'clientId',
            clientName: 'clientName',
          },
        },
      },
      {
        name: 'invoiceNumber',
        label: 'Invoice Number',
        dataType: 'text',
        uiType: 'textbox',
        isRequired: true,
        config: { maxLength: 50 },
        placeholder: 'Invoice number (auto-filled)',
        readOnly: true,
      },
      {
        name: 'clientId',
        label: 'Client',
        dataType: 'lookup',
        uiType: 'lookup',
        isRequired: true,
        placeholder: 'Select client',
        config: {
          targetModule: 'Clients',
          displayField: 'clientName',
          searchFields: ['clientName', 'email', 'phone'],
          cascadeFields: {
            clientName: 'clientName',
          },
        },
      },
      {
        name: 'clientName',
        label: 'Client Name',
        dataType: 'text',
        uiType: 'textbox',
        isRequired: true,
        config: { maxLength: 255 },
        placeholder: 'Client name (auto-filled)',
        readOnly: true,
      },
      {
        name: 'transactionDate',
        label: 'Transaction Date',
        dataType: 'date',
        uiType: 'date',
        isRequired: true,
        defaultValue: 'today',
      },
      {
        name: 'transactionTime',
        label: 'Transaction Time',
        dataType: 'datetime',
        uiType: 'datetime',
        isRequired: false,
      },
      {
        name: 'paymentMethod',
        label: 'Payment Method',
        dataType: 'dropdown',
        uiType: 'dropdown',
        isRequired: true,
        config: {
          options: ['Bank Transfer', 'Cheque', 'Credit Card', 'Debit Card', 'UPI', 'NEFT', 'RTGS', 'IMPS', 'Cash', 'Online'],
        },
      },
      {
        name: 'amount',
        label: 'Payment Amount',
        dataType: 'currency',
        uiType: 'currency',
        isRequired: true,
        config: { currency: 'INR', decimals: 2 },
      },
      {
        name: 'invoiceAmount',
        label: 'Invoice Total',
        dataType: 'currency',
        uiType: 'currency',
        isRequired: true,
        config: { currency: 'INR', decimals: 2 },
        readOnly: true,
      },
      {
        name: 'status',
        label: 'Payment Status',
        dataType: 'dropdown',
        uiType: 'dropdown',
        isRequired: true,
        config: {
          options: ['Pending', 'Processing', 'Confirmed', 'Failed', 'Refunded'],
        },
        defaultValue: 'Pending',
      },
      {
        name: 'referenceNumber',
        label: 'Reference Number',
        dataType: 'text',
        uiType: 'textbox',
        isRequired: false,
        config: { maxLength: 100 },
        placeholder: 'Bank reference, Cheque number, UPI ref, etc.',
      },
      {
        name: 'bankName',
        label: 'Bank/Gateway',
        dataType: 'text',
        uiType: 'textbox',
        isRequired: false,
        config: { maxLength: 100 },
        placeholder: 'HDFC, ICICI, Stripe, PayPal, Razorpay, UPI',
      },
      {
        name: 'bankAccountNumber',
        label: 'Account Number (Last 4)',
        dataType: 'text',
        uiType: 'textbox',
        isRequired: false,
        config: { maxLength: 10 },
        placeholder: 'XXXX1234',
      },
      {
        name: 'chequeNumber',
        label: 'Cheque Number',
        dataType: 'text',
        uiType: 'textbox',
        isRequired: false,
        config: { maxLength: 20 },
        placeholder: 'For cheque payments',
      },
      {
        name: 'chequeDate',
        label: 'Cheque Date',
        dataType: 'date',
        uiType: 'date',
        isRequired: false,
      },
      {
        name: 'upiRef',
        label: 'UPI Reference',
        dataType: 'text',
        uiType: 'textbox',
        isRequired: false,
        config: { maxLength: 20 },
        placeholder: 'UPI transaction ID',
      },
      {
        name: 'gatewayResponse',
        label: 'Gateway Response',
        dataType: 'dropdown',
        uiType: 'dropdown',
        isRequired: false,
        config: {
          options: ['Success', 'Failed', 'Declined', 'Pending', 'Timeout', 'Cancelled'],
        },
      },
      {
        name: 'notes',
        label: 'Notes',
        dataType: 'textarea',
        uiType: 'textarea',
        isRequired: false,
        config: { maxLength: 1000 },
        placeholder: 'Payment notes, remarks',
      },
      {
        name: 'documentAttachment',
        label: 'Proof of Payment',
        dataType: 'file',
        uiType: 'file',
        isRequired: false,
        config: { maxSize: 5242880, accept: 'image/*,application/pdf' },
      },
    ],
  }

  await prisma.moduleConfiguration.upsert({
    where: {
      tenantId_moduleName_version: {
        tenantId: demoTenant.id,
        moduleName: 'Payments',
        version: 1,
      },
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      moduleName: 'Payments',
      displayName: 'Payments',
      icon: '💳',
      description: 'Track payments and reconcile transactions',
      fields: JSON.stringify(paymentsConfig.fields),
      status: 'active',
      version: 1,
    },
  })

  console.log('✅ Payments module seeded')
}

seedPaymentsModule()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
