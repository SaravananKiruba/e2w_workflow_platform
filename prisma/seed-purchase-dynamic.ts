import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed Purchase & Vendor Management Modules
 * These work with the existing DynamicRecord system - NO hardcoded tables!
 */
export async function seedPurchaseModules(tenantId: string, userId: string) {
  console.log('\n📦 Seeding Purchase & Vendor Management modules...');

  // 1. Create Module Configurations (defines the schema for each module)
  const modules = [
    {
      moduleName: 'Vendors',
      displayName: 'Vendors',
      icon: '🏢',
      description: 'Vendor and supplier master data management',
      fields: JSON.stringify([
        { name: 'vendorCode', label: 'Vendor Code', type: 'text', required: true, readonly: true },
        { name: 'vendorName', label: 'Vendor Name', type: 'text', required: true },
        { name: 'contactPerson', label: 'Contact Person', type: 'text' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'phone', label: 'Phone', type: 'phone' },
        { name: 'gstNumber', label: 'GST Number', type: 'text' },
        { name: 'panNumber', label: 'PAN Number', type: 'text' },
        { name: 'paymentTerms', label: 'Payment Terms', type: 'dropdown', options: ['Net 15', 'Net 30', 'Net 45', 'Net 60'] },
        { name: 'creditLimit', label: 'Credit Limit', type: 'currency' },
        { name: 'rating', label: 'Rating', type: 'number', min: 0, max: 5 },
        { name: 'category', label: 'Category', type: 'text' },
        { name: 'status', label: 'Status', type: 'dropdown', options: ['active', 'inactive', 'blocked'] },
      ]),
      status: 'active',
    },
    {
      moduleName: 'RateCatalogs',
      displayName: 'Rate Catalogs',
      icon: '💰',
      description: 'Vendor-wise item pricing and rate management',
      fields: JSON.stringify([
        { name: 'vendorId', label: 'Vendor', type: 'lookup', targetModule: 'Vendors', required: true },
        { name: 'itemCode', label: 'Item Code', type: 'text', required: true },
        { name: 'itemName', label: 'Item Name', type: 'text', required: true },
        { name: 'rate', label: 'Rate', type: 'currency', required: true },
        { name: 'uom', label: 'UOM', type: 'dropdown', options: ['PCS', 'KG', 'LTR', 'MTR', 'SQFT'] },
        { name: 'validFrom', label: 'Valid From', type: 'date', required: true },
        { name: 'validTo', label: 'Valid To', type: 'date' },
        { name: 'discount', label: 'Discount', type: 'number' },
        { name: 'discountType', label: 'Discount Type', type: 'dropdown', options: ['percentage', 'flat'] },
        { name: 'moq', label: 'Min Order Qty', type: 'number' },
        { name: 'leadTime', label: 'Lead Time (Days)', type: 'number' },
        { name: 'status', label: 'Status', type: 'dropdown', options: ['active', 'expired', 'inactive'] },
      ]),
      status: 'active',
    },
    {
      moduleName: 'PurchaseRequests',
      displayName: 'Purchase Requests',
      icon: '📝',
      description: 'Internal purchase request management',
      fields: JSON.stringify([
        { name: 'prNumber', label: 'PR Number', type: 'text', required: true, readonly: true },
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'requestDate', label: 'Request Date', type: 'date', required: true },
        { name: 'requiredBy', label: 'Required By', type: 'date', required: true },
        { name: 'department', label: 'Department', type: 'text' },
        { name: 'priority', label: 'Priority', type: 'dropdown', options: ['low', 'medium', 'high', 'urgent'] },
        { name: 'items', label: 'Items', type: 'table', columns: [
          { name: 'itemCode', label: 'Item Code', type: 'text' },
          { name: 'itemName', label: 'Item Name', type: 'text' },
          { name: 'quantity', label: 'Quantity', type: 'number' },
          { name: 'uom', label: 'UOM', type: 'text' },
          { name: 'estimatedRate', label: 'Est. Rate', type: 'number' },
        ]},
        { name: 'totalAmount', label: 'Total Amount', type: 'currency', readonly: true },
        { name: 'status', label: 'Status', type: 'dropdown', options: ['draft', 'submitted', 'approved', 'rejected', 'converted_to_po'] },
      ]),
      status: 'active',
    },
    {
      moduleName: 'PurchaseOrders',
      displayName: 'Purchase Orders',
      icon: '📄',
      description: 'Purchase order management',
      fields: JSON.stringify([
        { name: 'poNumber', label: 'PO Number', type: 'text', required: true, readonly: true },
        { name: 'vendorId', label: 'Vendor', type: 'lookup', targetModule: 'Vendors', required: true },
        { name: 'orderDate', label: 'Order Date', type: 'date', required: true },
        { name: 'deliveryDate', label: 'Delivery Date', type: 'date', required: true },
        { name: 'items', label: 'Items', type: 'table', columns: [
          { name: 'itemCode', label: 'Item Code', type: 'text' },
          { name: 'itemName', label: 'Item Name', type: 'text' },
          { name: 'quantity', label: 'Quantity', type: 'number' },
          { name: 'rate', label: 'Rate', type: 'number' },
          { name: 'amount', label: 'Amount', type: 'number' },
        ]},
        { name: 'subtotal', label: 'Subtotal', type: 'currency', readonly: true },
        { name: 'taxAmount', label: 'Tax', type: 'currency', readonly: true },
        { name: 'totalAmount', label: 'Total', type: 'currency', readonly: true },
        { name: 'status', label: 'Status', type: 'dropdown', options: ['draft', 'sent', 'acknowledged', 'partially_received', 'fully_received', 'closed'] },
      ]),
      status: 'active',
    },
    {
      moduleName: 'GoodsReceipts',
      displayName: 'Goods Receipts (GRN)',
      icon: '📦',
      description: 'Goods receipt and quality inspection',
      fields: JSON.stringify([
        { name: 'grnNumber', label: 'GRN Number', type: 'text', required: true, readonly: true },
        { name: 'poId', label: 'Purchase Order', type: 'lookup', targetModule: 'PurchaseOrders', required: true },
        { name: 'receiptDate', label: 'Receipt Date', type: 'date', required: true },
        { name: 'invoiceNumber', label: 'Vendor Invoice No', type: 'text' },
        { name: 'items', label: 'Items', type: 'table', columns: [
          { name: 'itemCode', label: 'Item Code', type: 'text' },
          { name: 'orderedQty', label: 'Ordered', type: 'number' },
          { name: 'receivedQty', label: 'Received', type: 'number' },
          { name: 'acceptedQty', label: 'Accepted', type: 'number' },
          { name: 'rejectedQty', label: 'Rejected', type: 'number' },
        ]},
        { name: 'qualityStatus', label: 'Quality Status', type: 'dropdown', options: ['pending', 'passed', 'partially_passed', 'failed'] },
        { name: 'status', label: 'Status', type: 'dropdown', options: ['draft', 'received', 'inspected', 'posted'] },
      ]),
      status: 'active',
    },
    {
      moduleName: 'VendorBills',
      displayName: 'Vendor Bills',
      icon: '🧾',
      description: 'Vendor invoice and bill management',
      fields: JSON.stringify([
        { name: 'billNumber', label: 'Bill Number', type: 'text', required: true, readonly: true },
        { name: 'vendorId', label: 'Vendor', type: 'lookup', targetModule: 'Vendors', required: true },
        { name: 'vendorInvoiceNo', label: 'Vendor Invoice No', type: 'text', required: true },
        { name: 'vendorInvoiceDate', label: 'Invoice Date', type: 'date', required: true },
        { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
        { name: 'items', label: 'Items', type: 'table', columns: [
          { name: 'itemCode', label: 'Item Code', type: 'text' },
          { name: 'quantity', label: 'Quantity', type: 'number' },
          { name: 'rate', label: 'Rate', type: 'number' },
          { name: 'amount', label: 'Amount', type: 'number' },
        ]},
        { name: 'subtotal', label: 'Subtotal', type: 'currency', readonly: true },
        { name: 'cgst', label: 'CGST', type: 'currency' },
        { name: 'sgst', label: 'SGST', type: 'currency' },
        { name: 'totalAmount', label: 'Total Amount', type: 'currency', readonly: true },
        { name: 'paidAmount', label: 'Paid Amount', type: 'currency', readonly: true },
        { name: 'balanceAmount', label: 'Balance', type: 'currency', readonly: true },
        { name: 'status', label: 'Status', type: 'dropdown', options: ['draft', 'submitted', 'validated', 'approved', 'posted', 'paid'] },
      ]),
      status: 'active',
    },
  ];

  for (const module of modules) {
    const existing = await prisma.moduleConfiguration.findFirst({
      where: {
        tenantId,
        moduleName: module.moduleName,
      },
    });

    if (!existing) {
      await prisma.moduleConfiguration.create({
        data: {
          ...module,
          tenantId,
          createdBy: userId,
        },
      });
      console.log(`✓ Created module config: ${module.displayName}`);
    } else {
      console.log(`  ℹ Module ${module.displayName} already exists`);
    }
  }

  // 2. Create Auto-Number Sequences
  const sequences = [
    { moduleName: 'Vendors', prefix: 'VEN', format: '{prefix}-{padded:5}' },
    { moduleName: 'PurchaseRequests', prefix: 'PR', format: '{prefix}-{padded:5}' },
    { moduleName: 'PurchaseOrders', prefix: 'PO', format: '{prefix}-{padded:5}' },
    { moduleName: 'GoodsReceipts', prefix: 'GRN', format: '{prefix}-{padded:5}' },
    { moduleName: 'VendorBills', prefix: 'VBILL', format: '{prefix}-{padded:5}' },
  ];

  for (const seq of sequences) {
    await prisma.autoNumberSequence.upsert({
      where: {
        tenantId_moduleName: {
          tenantId,
          moduleName: seq.moduleName,
        },
      },
      create: {
        tenantId,
        ...seq,
        nextNumber: 1,
      },
      update: {},
    });
  }
  console.log(`✓ Created ${sequences.length} auto-number sequences`);

  // 3. Create Sample Workflow (PR Auto-Approval)
  // Find existing workflow first
  const existingWorkflow = await prisma.workflow.findFirst({
    where: {
      tenantId,
      name: 'PR Auto-Approval (< ₹10,000)',
    },
  })

  const workflow = existingWorkflow || await prisma.workflow.create({
    data: {
      tenantId,
      name: 'PR Auto-Approval (< ₹10,000)',
      description: 'Auto-approve purchase requests under ₹10,000',
      moduleName: 'PurchaseRequests',
      trigger: JSON.stringify({
        event: 'onStatusChange',
        from: 'draft',
        to: 'submitted',
      }),
      conditions: JSON.stringify({
        operator: 'AND',
        rules: [
          { field: 'totalAmount', operator: 'lessThan', value: 10000 },
        ],
      }),
      actions: JSON.stringify([
        {
          type: 'updateField',
          config: { field: 'status', value: 'approved' },
        },
        {
          type: 'notification',
          config: {
            recipients: ['creator'],
            message: 'Your PR {{prNumber}} has been auto-approved',
          },
        },
      ]),
      isActive: true,
      priority: 10,
      createdBy: userId,
    },
  });
  
  if (workflow) {
    console.log(`✓ Created workflow: ${workflow.name}`);
  }

  console.log('✅ Purchase & Vendor Management modules seeded successfully!');
}
