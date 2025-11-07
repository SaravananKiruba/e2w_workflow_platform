import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedQuotationsModule() {
  console.log('🌱 Seeding Quotations module configuration...')

  const demoTenant = await prisma.tenant.findUnique({
    where: { slug: 'demo' },
  })

  if (!demoTenant) {
    console.log('❌ Demo tenant not found')
    return
  }

  const quotationsConfig = {
    fields: [
      {
        name: 'quotationNumber',
        label: 'Quotation Number',
        dataType: 'text',
        uiType: 'textbox',
        isRequired: true,
        isUnique: true,
        config: { maxLength: 50 },
        placeholder: 'QT-001',
        readOnly: true,
        helpText: 'Auto-generated or manually entered',
      },
      {
        name: 'referenceNumber',
        label: 'Reference Number',
        dataType: 'text',
        uiType: 'textbox',
        isRequired: false,
        config: { maxLength: 50 },
        placeholder: 'Client Reference',
      },
      {
        name: 'clientId',
        label: 'Client',
        dataType: 'text',
        uiType: 'lookup',
        isRequired: true,
        placeholder: 'Select a client',
        helpText: 'Link to existing client record',
        config: {
          targetModule: 'Clients',
          displayField: 'clientName',
          searchFields: ['clientName', 'email', 'phone'],
          cascadeFields: {
            clientName: 'clientName',
            email: 'clientEmail',
            phone: 'clientPhone',
            billingAddress: 'clientAddress',
            gstin: 'clientGSTIN',
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
        name: 'clientEmail',
        label: 'Client Email',
        dataType: 'email',
        uiType: 'email',
        isRequired: true,
        validation: [{ type: 'email' }],
        placeholder: 'client@company.com',
      },
      {
        name: 'clientPhone',
        label: 'Client Phone',
        dataType: 'phone',
        uiType: 'phone',
        isRequired: false,
        placeholder: '+91 9876543210',
      },
      {
        name: 'clientAddress',
        label: 'Client Address',
        dataType: 'textarea',
        uiType: 'textarea',
        isRequired: false,
        config: { maxLength: 500 },
        placeholder: 'Billing or delivery address',
      },
      {
        name: 'quotationDate',
        label: 'Quotation Date',
        dataType: 'date',
        uiType: 'date',
        isRequired: true,
        defaultValue: 'today',
      },
      {
        name: 'validFrom',
        label: 'Valid From',
        dataType: 'date',
        uiType: 'date',
        isRequired: true,
        defaultValue: 'today',
      },
      {
        name: 'validUntil',
        label: 'Valid Until',
        dataType: 'date',
        uiType: 'date',
        isRequired: true,
        helpText: 'Quote expiry date',
      },
      {
        name: 'items',
        label: 'Line Items',
        dataType: 'json',
        uiType: 'table',
        isRequired: true,
        config: {
          columns: [
            {
              name: 'description',
              label: 'Description',
              dataType: 'text',
              uiType: 'textbox',
              isRequired: true,
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
              name: 'tax',
              label: 'Tax %',
              dataType: 'number',
              uiType: 'number',
              isRequired: false,
              defaultValue: 0,
            },
            {
              name: 'amount',
              label: 'Amount',
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
        label: 'Subtotal',
        dataType: 'currency',
        uiType: 'currency',
        isRequired: true,
        config: { currency: 'INR', decimals: 2 },
        readOnly: true,
      },
      {
        name: 'taxAmount',
        label: 'Total Tax',
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
      // GST Fields
      {
        name: 'gstPercentage',
        label: 'GST Rate (%)',
        dataType: 'dropdown',
        uiType: 'dropdown',
        isRequired: true,
        config: {
          options: ['0', '5', '12', '18', '28'],
        },
        defaultValue: '18',
        helpText: 'Select applicable GST rate',
      },
      {
        name: 'gstType',
        label: 'GST Type',
        dataType: 'text',
        uiType: 'textbox',
        isRequired: false,
        readOnly: true,
        helpText: 'IGST (Interstate) or CGST+SGST (Intrastate) - Auto-calculated',
      },
      {
        name: 'cgstPercentage',
        label: 'CGST %',
        dataType: 'number',
        uiType: 'number',
        isRequired: false,
        readOnly: true,
        config: { decimals: 2 },
      },
      {
        name: 'sgstPercentage',
        label: 'SGST %',
        dataType: 'number',
        uiType: 'number',
        isRequired: false,
        readOnly: true,
        config: { decimals: 2 },
      },
      {
        name: 'igstPercentage',
        label: 'IGST %',
        dataType: 'number',
        uiType: 'number',
        isRequired: false,
        readOnly: true,
        config: { decimals: 2 },
      },
      {
        name: 'cgstAmount',
        label: 'CGST Amount',
        dataType: 'currency',
        uiType: 'currency',
        isRequired: false,
        config: { currency: 'INR', decimals: 2 },
        readOnly: true,
      },
      {
        name: 'sgstAmount',
        label: 'SGST Amount',
        dataType: 'currency',
        uiType: 'currency',
        isRequired: false,
        config: { currency: 'INR', decimals: 2 },
        readOnly: true,
      },
      {
        name: 'igstAmount',
        label: 'IGST Amount',
        dataType: 'currency',
        uiType: 'currency',
        isRequired: false,
        config: { currency: 'INR', decimals: 2 },
        readOnly: true,
      },
      {
        name: 'totalGSTAmount',
        label: 'Total GST',
        dataType: 'currency',
        uiType: 'currency',
        isRequired: false,
        config: { currency: 'INR', decimals: 2 },
        readOnly: true,
        helpText: 'Sum of CGST+SGST or IGST',
      },
      {
        name: 'totalAmount',
        label: 'Total Amount',
        dataType: 'currency',
        uiType: 'currency',
        isRequired: true,
        config: { currency: 'INR', decimals: 2 },
        readOnly: true,
        helpText: 'Subtotal + GST - Discount',
      },
      {
        name: 'description',
        label: 'Description',
        dataType: 'textarea',
        uiType: 'textarea',
        isRequired: false,
        config: { maxLength: 1000 },
        placeholder: 'Quotation details and notes',
      },
      {
        name: 'terms',
        label: 'Terms & Conditions',
        dataType: 'textarea',
        uiType: 'textarea',
        isRequired: false,
        config: { maxLength: 2000 },
        placeholder: 'Payment terms, delivery terms, etc.',
      },
      {
        name: 'notes',
        label: 'Internal Notes',
        dataType: 'textarea',
        uiType: 'textarea',
        isRequired: false,
        config: { maxLength: 1000 },
        placeholder: 'Internal remarks (not visible to client)',
      },
      {
        name: 'status',
        label: 'Status',
        dataType: 'dropdown',
        uiType: 'dropdown',
        isRequired: true,
        config: {
          options: ['Draft', 'Pending Approval', 'Approved', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Converted to Order'],
        },
        defaultValue: 'Draft',
      },
      {
        name: 'approvalRequired',
        label: 'Requires Approval',
        dataType: 'boolean',
        uiType: 'checkbox',
        isRequired: false,
        defaultValue: true,
      },
      {
        name: 'approvedBy',
        label: 'Approved By',
        dataType: 'text',
        uiType: 'textbox',
        isRequired: false,
        readOnly: true,
      },
      {
        name: 'approvedAt',
        label: 'Approval Date',
        dataType: 'datetime',
        uiType: 'datetime',
        isRequired: false,
        readOnly: true,
      },
    ],
  }

  await prisma.moduleConfiguration.upsert({
    where: {
      tenantId_moduleName_version: {
        tenantId: demoTenant.id,
        moduleName: 'Quotations',
        version: 1,
      },
    },
    update: {
      fields: JSON.stringify(quotationsConfig.fields),
      displayName: 'Quotations',
      icon: '📋',
      description: 'Create and manage quotations for clients',
      status: 'active',
    },
    create: {
      tenantId: demoTenant.id,
      moduleName: 'Quotations',
      displayName: 'Quotations',
      icon: '📋',
      description: 'Create and manage quotations for clients',
      fields: JSON.stringify(quotationsConfig.fields),
      status: 'active',
      version: 1,
    },
  })

  console.log('✅ Quotations module seeded')
}

seedQuotationsModule()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
