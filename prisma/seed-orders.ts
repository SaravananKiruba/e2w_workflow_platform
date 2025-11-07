import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedOrdersModule() {
  console.log('🌱 Seeding Orders module configuration...')

  const demoTenant = await prisma.tenant.findUnique({
    where: { slug: 'demo' },
  })

  if (!demoTenant) {
    console.log('❌ Demo tenant not found')
    return
  }

  const ordersConfig = {
    fields: [
      {
        name: 'orderNumber',
        label: 'Order Number',
        dataType: 'text',
        uiType: 'textbox',
        isRequired: true,
        isUnique: true,
        config: { maxLength: 50 },
        placeholder: 'ORD-001',
        readOnly: true,
        helpText: 'Auto-generated order ID',
      },
      {
        name: 'quotationId',
        label: 'Quotation Reference',
        dataType: 'text',
        uiType: 'lookup',
        isRequired: false,
        placeholder: 'Link to quotation (optional)',
        config: {
          targetModule: 'Quotations',
          displayField: 'quotationNumber',
          searchFields: ['quotationNumber', 'clientName'],
          cascadeFields: {},
        },
      },
      {
        name: 'clientId',
        label: 'Client',
        dataType: 'text',
        uiType: 'lookup',
        isRequired: true,
        placeholder: 'Select client',
        helpText: 'Link to Clients module',
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
        name: 'orderDate',
        label: 'Order Date',
        dataType: 'date',
        uiType: 'date',
        isRequired: true,
        defaultValue: 'today',
      },
      {
        name: 'deliveryDate',
        label: 'Promised Delivery Date',
        dataType: 'date',
        uiType: 'date',
        isRequired: true,
        helpText: 'Expected delivery date',
      },
      {
        name: 'items',
        label: 'Order Line Items',
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
        label: 'Subtotal',
        dataType: 'currency',
        uiType: 'currency',
        isRequired: true,
        config: { currency: 'INR', decimals: 2 },
        readOnly: true,
      },
      {
        name: 'taxAmount',
        label: 'Total Tax (GST)',
        dataType: 'currency',
        uiType: 'currency',
        isRequired: true,
        config: { currency: 'INR', decimals: 2 },
        readOnly: true,
      },
      {
        name: 'shippingCharge',
        label: 'Shipping Charge',
        dataType: 'currency',
        uiType: 'currency',
        isRequired: false,
        config: { currency: 'INR', decimals: 2 },
        defaultValue: 0,
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
        helpText: 'Subtotal + GST + Shipping - Discount',
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
        isRequired: true,
        config: { maxLength: 500 },
        placeholder: 'Delivery address (may be same as billing)',
      },
      {
        name: 'paymentTerms',
        label: 'Payment Terms',
        dataType: 'dropdown',
        uiType: 'dropdown',
        isRequired: true,
        config: {
          options: ['Immediate', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Custom'],
        },
        defaultValue: 'Net 30',
      },
      {
        name: 'status',
        label: 'Order Status',
        dataType: 'dropdown',
        uiType: 'dropdown',
        isRequired: true,
        config: {
          options: ['Draft', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        },
        defaultValue: 'Draft',
      },
      {
        name: 'shippingStatus',
        label: 'Shipping Status',
        dataType: 'dropdown',
        uiType: 'dropdown',
        isRequired: false,
        config: {
          options: ['Not Shipped', 'Shipped', 'In Transit', 'Delivered', 'Return Initiated', 'Returned'],
        },
        defaultValue: 'Not Shipped',
      },
      {
        name: 'trackingNumber',
        label: 'Tracking Number',
        dataType: 'text',
        uiType: 'textbox',
        isRequired: false,
        config: { maxLength: 100 },
        placeholder: 'Courier tracking number',
      },
      {
        name: 'notes',
        label: 'Order Notes',
        dataType: 'textarea',
        uiType: 'textarea',
        isRequired: false,
        config: { maxLength: 1000 },
        placeholder: 'Special instructions, notes',
      },
      {
        name: 'internalNotes',
        label: 'Internal Notes',
        dataType: 'textarea',
        uiType: 'textarea',
        isRequired: false,
        config: { maxLength: 1000 },
        placeholder: 'Internal team notes (not visible to client)',
      },
    ],
  }

  await prisma.moduleConfiguration.upsert({
    where: {
      tenantId_moduleName_version: {
        tenantId: demoTenant.id,
        moduleName: 'Orders',
        version: 1,
      },
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      moduleName: 'Orders',
      displayName: 'Orders',
      icon: '📦',
      description: 'Manage customer orders and fulfillment',
      fields: JSON.stringify(ordersConfig.fields),
      status: 'active',
      version: 1,
    },
  })

  console.log('✅ Orders module seeded')
}

seedOrdersModule()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
