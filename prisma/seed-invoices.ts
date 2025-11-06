import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedInvoicesModule() {
  console.log('🌱 Seeding Invoices module configuration...')

  const demoTenant = await prisma.tenant.findUnique({
    where: { slug: 'demo' },
  })

  if (!demoTenant) {
    console.log('❌ Demo tenant not found')
    return
  }

  const invoicesConfig = {
    fields: [
      {
        name: 'invoiceNumber',
        label: 'Invoice Number',
        dataType: 'text',
        uiType: 'textbox',
        isRequired: true,
        isUnique: true,
        config: { maxLength: 50 },
        placeholder: 'INV-001',
        readOnly: true,
        helpText: 'Auto-generated invoice ID',
      },
      {
        name: 'orderId',
        label: 'Order Reference',
        dataType: 'text',
        uiType: 'lookup',
        isRequired: false,
        placeholder: 'Link to Orders (optional)',
      },
      {
        name: 'quotationId',
        label: 'Quotation Reference',
        dataType: 'text',
        uiType: 'lookup',
        isRequired: false,
        placeholder: 'Link to Quotation (optional)',
      },
      {
        name: 'clientId',
        label: 'Client',
        dataType: 'text',
        uiType: 'lookup',
        isRequired: true,
        placeholder: 'Select client',
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
        name: 'clientGSTIN',
        label: 'Client GSTIN',
        dataType: 'text',
        uiType: 'textbox',
        isRequired: false,
        config: { maxLength: 15 },
        placeholder: 'Client GST number',
        readOnly: true,
      },
      {
        name: 'invoiceDate',
        label: 'Invoice Date',
        dataType: 'date',
        uiType: 'date',
        isRequired: true,
        defaultValue: 'today',
      },
      {
        name: 'dueDate',
        label: 'Due Date',
        dataType: 'date',
        uiType: 'date',
        isRequired: true,
        helpText: 'Payment due date',
      },
      {
        name: 'items',
        label: 'Invoice Line Items',
        dataType: 'json',
        uiType: 'table',
        isRequired: true,
        config: {
          columns: [
            {
              name: 'description',
              label: 'Product/Service',
              dataType: 'text',
              uiType: 'textbox',
              isRequired: true,
            },
            {
              name: 'hsn',
              label: 'HSN/SAC',
              dataType: 'text',
              uiType: 'textbox',
              isRequired: false,
              helpText: 'Harmonized System of Nomenclature',
            },
            {
              name: 'quantity',
              label: 'Qty',
              dataType: 'number',
              uiType: 'number',
              isRequired: true,
            },
            {
              name: 'unitPrice',
              label: 'Unit Price',
              dataType: 'currency',
              uiType: 'currency',
              isRequired: true,
            },
            {
              name: 'gstRate',
              label: 'GST %',
              dataType: 'number',
              uiType: 'number',
              isRequired: true,
              defaultValue: 18,
            },
            {
              name: 'amount',
              label: 'Line Amount',
              dataType: 'currency',
              uiType: 'currency',
              isRequired: true,
              readOnly: true,
            },
          ],
        },
      },
      {
        name: 'subtotal',
        label: 'Subtotal (Before Tax)',
        dataType: 'currency',
        uiType: 'currency',
        isRequired: true,
        config: { currency: 'INR', decimals: 2 },
        readOnly: true,
      },
      {
        name: 'sgstAmount',
        label: 'SGST (9%)',
        dataType: 'currency',
        uiType: 'currency',
        isRequired: false,
        config: { currency: 'INR', decimals: 2 },
        readOnly: true,
      },
      {
        name: 'cgstAmount',
        label: 'CGST (9%)',
        dataType: 'currency',
        uiType: 'currency',
        isRequired: false,
        config: { currency: 'INR', decimals: 2 },
        readOnly: true,
      },
      {
        name: 'igstAmount',
        label: 'IGST (18%)',
        dataType: 'currency',
        uiType: 'currency',
        isRequired: false,
        config: { currency: 'INR', decimals: 2 },
        readOnly: true,
      },
      {
        name: 'totalGST',
        label: 'Total GST',
        dataType: 'currency',
        uiType: 'currency',
        isRequired: true,
        config: { currency: 'INR', decimals: 2 },
        readOnly: true,
      },
      {
        name: 'discountAmount',
        label: 'Discount',
        dataType: 'currency',
        uiType: 'currency',
        isRequired: false,
        config: { currency: 'INR', decimals: 2 },
        defaultValue: 0,
      },
      {
        name: 'totalAmount',
        label: 'Grand Total',
        dataType: 'currency',
        uiType: 'currency',
        isRequired: true,
        config: { currency: 'INR', decimals: 2 },
        readOnly: true,
      },
      {
        name: 'paymentStatus',
        label: 'Payment Status',
        dataType: 'dropdown',
        uiType: 'dropdown',
        isRequired: true,
        config: {
          options: ['Pending', 'Partial', 'Paid', 'Overdue', 'Cancelled'],
        },
        defaultValue: 'Pending',
      },
      {
        name: 'amountPaid',
        label: 'Amount Paid',
        dataType: 'currency',
        uiType: 'currency',
        isRequired: false,
        config: { currency: 'INR', decimals: 2 },
        defaultValue: 0,
      },
      {
        name: 'amountDue',
        label: 'Amount Due',
        dataType: 'currency',
        uiType: 'currency',
        isRequired: true,
        config: { currency: 'INR', decimals: 2 },
        readOnly: true,
      },
      {
        name: 'paymentMethod',
        label: 'Payment Method',
        dataType: 'dropdown',
        uiType: 'dropdown',
        isRequired: false,
        config: {
          options: ['Bank Transfer', 'Cheque', 'Credit Card', 'UPI', 'Cash', 'Online'],
        },
      },
      {
        name: 'transactionReference',
        label: 'Transaction Reference',
        dataType: 'text',
        uiType: 'textbox',
        isRequired: false,
        config: { maxLength: 100 },
        placeholder: 'Transaction ID or Cheque number',
      },
      {
        name: 'billingAddress',
        label: 'Billing Address',
        dataType: 'textarea',
        uiType: 'textarea',
        isRequired: true,
        config: { maxLength: 500 },
        placeholder: 'Customer billing address',
      },
      {
        name: 'shippingAddress',
        label: 'Shipping Address',
        dataType: 'textarea',
        uiType: 'textarea',
        isRequired: false,
        config: { maxLength: 500 },
        placeholder: 'If different from billing',
      },
      {
        name: 'notes',
        label: 'Notes',
        dataType: 'textarea',
        uiType: 'textarea',
        isRequired: false,
        config: { maxLength: 1000 },
        placeholder: 'Thank you note, payment terms, etc.',
      },
      {
        name: 'internalNotes',
        label: 'Internal Notes',
        dataType: 'textarea',
        uiType: 'textarea',
        isRequired: false,
        config: { maxLength: 1000 },
        placeholder: 'Internal team notes',
      },
      {
        name: 'status',
        label: 'Invoice Status',
        dataType: 'dropdown',
        uiType: 'dropdown',
        isRequired: true,
        config: {
          options: ['Draft', 'Sent', 'Viewed', 'Paid', 'Overdue', 'Disputed', 'Cancelled'],
        },
        defaultValue: 'Draft',
      },
    ],
  }

  await prisma.moduleConfiguration.upsert({
    where: {
      tenantId_moduleName_version: {
        tenantId: demoTenant.id,
        moduleName: 'Invoices',
        version: 1,
      },
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      moduleName: 'Invoices',
      displayName: 'Invoices',
      icon: '📄',
      description: 'Create and manage invoices with GST compliance',
      fields: JSON.stringify(invoicesConfig.fields),
      status: 'active',
      version: 1,
    },
  })

  console.log('✅ Invoices module seeded')
}

seedInvoicesModule()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
