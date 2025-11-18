import { PrismaClient } from '@prisma/client';

/**
 * Seeds default core business modules for a new tenant
 * These are the system modules that all tenants get by default
 */
export async function seedDefaultModules(prisma: PrismaClient, tenantId: string, createdBy: string) {
  console.log(`[SEED] Creating default modules for tenant: ${tenantId}`);

  const defaultModules = [
    // Sales Workflow Modules
    {
      moduleName: 'Leads',
      displayName: 'Leads',
      icon: 'FiUser',
      description: 'Manage potential customers and opportunities',
      workflowCategory: 'Sales',
      workflowName: 'Sales',
      position: 1,
      showInNav: true,
      allowedRoles: JSON.stringify(['manager', 'owner', 'staff']),
      isCustomModule: false,
      isCustomized: false,
      fields: JSON.stringify([
        { name: 'leadNumber', label: 'Lead ID', dataType: 'string', uiType: 'text', isRequired: false, isReadOnly: true, helpText: 'Auto-generated unique identifier', searchable: true },
        { name: 'name', label: 'Lead Name', dataType: 'string', uiType: 'text', isRequired: true, searchable: true },
        { name: 'email', label: 'Email', dataType: 'string', uiType: 'email', isRequired: false, searchable: true, validation: [{ type: 'email', message: 'Invalid email format' }] },
        { name: 'phone', label: 'Phone', dataType: 'string', uiType: 'phone', isRequired: false, searchable: true, config: { enableClickToCall: true } },
        { name: 'company', label: 'Company', dataType: 'string', uiType: 'text', isRequired: false, searchable: true },
        { name: 'source', label: 'Lead Source', dataType: 'string', uiType: 'dropdown', isRequired: false, config: { options: [
          { label: 'Website', value: 'website' },
          { label: 'Referral', value: 'referral' },
          { label: 'Social Media', value: 'social_media' },
          { label: 'Cold Call', value: 'cold_call' },
          { label: 'Event', value: 'event' },
          { label: 'Google Ads', value: 'google_ads' },
          { label: 'LinkedIn', value: 'linkedin' },
          { label: 'Other', value: 'other' }
        ]}},
        { name: 'status', label: 'Lead Status', dataType: 'string', uiType: 'dropdown', isRequired: true, defaultValue: 'New', config: { options: [
          { label: 'New', value: 'New' },
          { label: 'Follow-up', value: 'Follow-up' },
          { label: 'Contacted', value: 'Contacted' },
          { label: 'Qualified', value: 'Qualified' },
          { label: 'Proposal Sent', value: 'Proposal' },
          { label: 'Negotiation', value: 'Negotiation' },
          { label: 'Converted', value: 'Converted' },
          { label: 'Lost', value: 'Lost' },
          { label: 'Unqualified', value: 'Unqualified' },
          { label: 'Unreachable', value: 'Unreachable' }
        ]}},
        { name: 'priority', label: 'Priority', dataType: 'string', uiType: 'dropdown', isRequired: false, config: { options: [
          { label: 'Hot', value: 'Hot' },
          { label: 'Warm', value: 'Warm' },
          { label: 'Cold', value: 'Cold' }
        ]}, helpText: 'Auto-calculated based on scoring rules' },
        { name: 'leadScore', label: 'Lead Score', dataType: 'number', uiType: 'number', isRequired: false, isReadOnly: true, helpText: 'System calculated priority score' },
        { name: 'expectedValue', label: 'Estimated Value', dataType: 'number', uiType: 'currency', isRequired: false, config: { currency: 'INR', decimals: 2 } },
        { name: 'assignedTo', label: 'Assigned To', dataType: 'reference', uiType: 'lookup', isRequired: false, config: { targetModule: 'Users', displayField: 'name', searchFields: ['name', 'email'] } },
        { name: 'nextFollowUpAt', label: 'Next Follow-up', dataType: 'datetime', uiType: 'datetime', isRequired: false },
        { name: 'lastContactedAt', label: 'Last Contacted', dataType: 'datetime', uiType: 'datetime', isRequired: false, isReadOnly: true },
        { name: 'notes', label: 'Notes', dataType: 'text', uiType: 'textarea', isRequired: false },
      ]),
      // Module-specific settings configuration (tenant-admin configurable via UI)
      moduleSettings: JSON.stringify({
        autoNumbering: {
          enabled: true,
          prefix: 'LD',
          startFrom: 1000,
          padding: 5,
          format: '{prefix}-{number}' // Can use {year}, {month}, etc.
        },
        duplicateCheck: {
          enabled: true,
          checkFields: ['email', 'phone'],
          matchCriteria: 'exact', // exact, fuzzy, partial
          action: 'warn' // block, warn, merge, skip
        },
        assignment: {
          enabled: false, // Tenant can enable
          defaultRule: 'manual', // round_robin, load_based, territory, manual
          visibilityRules: {
            staff: 'assigned_only', // Only see assigned leads
            manager: 'team_and_own', // See team + own leads
            owner: 'all', // See all leads
            admin: 'all'
          }
        },
        scoring: {
          enabled: false, // Tenant can configure
          criteria: [
            { field: 'source', weights: { 'website': 20, 'referral': 30, 'google_ads': 25 } },
            { field: 'expectedValue', ranges: [{ min: 100000, score: 30 }, { min: 50000, score: 20 }, { min: 0, score: 10 }] }
          ],
          thresholds: { hot: 61, warm: 31, cold: 0 }
        },
        clickToCall: {
          enabled: false,
          provider: null, // 'twilio', 'knowlarity', 'custom'
          autoLogCalls: true
        },
        pipeline: {
          enabled: true,
          stages: ['New', 'Follow-up', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Converted', 'Lost', 'Unqualified', 'Unreachable'],
          defaultView: 'list' // list, kanban
        },
        features: {
          activities: true, // Activity timeline (calls, emails, meetings)
          notes: true, // Internal notes
          tasks: true, // Follow-up tasks with reminders
        }
      }),
      status: 'active',
      version: 1,
    },
    {
      moduleName: 'Clients',
      displayName: 'Clients',
      icon: 'FiUsers',
      description: 'Manage customer accounts and relationships',
      workflowCategory: 'Sales',
      workflowName: 'Sales',
      position: 2,
      showInNav: true,
      allowedRoles: JSON.stringify(['manager', 'owner', 'staff']),
      isCustomModule: false,
      isCustomized: false,
      fields: JSON.stringify([
        { name: 'clientNumber', label: 'Client Number', dataType: 'string', uiType: 'text', required: true, searchable: true },
        { name: 'name', label: 'Name', dataType: 'string', uiType: 'text', required: true, searchable: true },
        { name: 'email', label: 'Email', dataType: 'string', uiType: 'email', required: false, searchable: true },
        { name: 'phone', label: 'Phone', dataType: 'string', uiType: 'phone', required: false, searchable: true },
        { name: 'company', label: 'Company', dataType: 'string', uiType: 'text', required: false, searchable: true },
        { name: 'gstNumber', label: 'GST Number', dataType: 'string', uiType: 'text', required: false },
        { name: 'billingAddress', label: 'Billing Address', dataType: 'text', uiType: 'textarea', required: false },
        { name: 'shippingAddress', label: 'Shipping Address', dataType: 'text', uiType: 'textarea', required: false },
        { name: 'status', label: 'Status', dataType: 'string', uiType: 'dropdown', required: true, options: ['Active', 'Inactive'], defaultValue: 'Active' },
      ]),
      moduleSettings: JSON.stringify({
        features: {
          activities: true, // Track interactions
          notes: true, // Client notes
          tasks: false, // Tasks not needed for clients by default
        }
      }),
      status: 'active',
      version: 1,
    },
    {
      moduleName: 'Quotations',
      displayName: 'Quotations',
      icon: 'FiFileText',
      description: 'Create and manage sales quotations',
      workflowCategory: 'Sales',
      workflowName: 'Sales',
      position: 3,
      showInNav: true,
      allowedRoles: JSON.stringify(['manager', 'owner', 'staff']),
      isCustomModule: false,
      isCustomized: false,
      fields: JSON.stringify([
        { name: 'quotationNumber', label: 'Quotation Number', dataType: 'string', uiType: 'text', required: true, searchable: true },
        { name: 'client', label: 'Client', dataType: 'reference', uiType: 'lookup', required: true, lookupConfig: { targetModule: 'Clients', displayField: 'name', searchFields: ['name', 'email'] } },
        { name: 'quotationDate', label: 'Quotation Date', dataType: 'date', uiType: 'date', required: true },
        { name: 'validUntil', label: 'Valid Until', dataType: 'date', uiType: 'date', required: true },
        { name: 'items', label: 'Line Items', dataType: 'table', uiType: 'table', required: true, tableConfig: { columns: [{ name: 'description', label: 'Description', type: 'text' }, { name: 'quantity', label: 'Quantity', type: 'number' }, { name: 'rate', label: 'Rate', type: 'currency' }, { name: 'amount', label: 'Amount', type: 'currency', formula: 'quantity * rate' }] } },
        { name: 'subtotal', label: 'Subtotal', dataType: 'number', uiType: 'currency', required: true },
        { name: 'tax', label: 'Tax', dataType: 'number', uiType: 'currency', required: false },
        { name: 'total', label: 'Total', dataType: 'number', uiType: 'currency', required: true },
        { name: 'status', label: 'Status', dataType: 'string', uiType: 'dropdown', required: true, options: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'], defaultValue: 'Draft' },
      ]),
      status: 'active',
      version: 1,
    },
    {
      moduleName: 'Orders',
      displayName: 'Orders',
      icon: 'FiShoppingCart',
      description: 'Track sales orders and fulfillment',
      workflowCategory: 'Sales',
      workflowName: 'Sales',
      position: 4,
      showInNav: true,
      allowedRoles: JSON.stringify(['manager', 'owner', 'staff']),
      isCustomModule: false,
      isCustomized: false,
      fields: JSON.stringify([
        { name: 'orderNumber', label: 'Order Number', dataType: 'string', uiType: 'text', required: true, searchable: true },
        { name: 'client', label: 'Client', dataType: 'reference', uiType: 'lookup', required: true, lookupConfig: { targetModule: 'Clients', displayField: 'name', searchFields: ['name', 'email'] } },
        { name: 'orderDate', label: 'Order Date', dataType: 'date', uiType: 'date', required: true },
        { name: 'deliveryDate', label: 'Expected Delivery', dataType: 'date', uiType: 'date', required: false },
        { name: 'items', label: 'Line Items', dataType: 'table', uiType: 'table', required: true },
        { name: 'subtotal', label: 'Subtotal', dataType: 'number', uiType: 'currency', required: true },
        { name: 'tax', label: 'Tax', dataType: 'number', uiType: 'currency', required: false },
        { name: 'total', label: 'Total', dataType: 'number', uiType: 'currency', required: true },
        { name: 'status', label: 'Status', dataType: 'string', uiType: 'dropdown', required: true, options: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], defaultValue: 'Pending' },
      ]),
      status: 'active',
      version: 1,
    },
    {
      moduleName: 'Invoices',
      displayName: 'Invoices',
      icon: 'FiDollarSign',
      description: 'Create and manage sales invoices',
      workflowCategory: 'Sales',
      workflowName: 'Sales',
      position: 5,
      showInNav: true,
      allowedRoles: JSON.stringify(['manager', 'owner', 'staff']),
      isCustomModule: false,
      isCustomized: false,
      fields: JSON.stringify([
        { name: 'invoiceNumber', label: 'Invoice Number', dataType: 'string', uiType: 'text', required: true, searchable: true },
        { name: 'client', label: 'Client', dataType: 'reference', uiType: 'lookup', required: true, lookupConfig: { targetModule: 'Clients', displayField: 'name', searchFields: ['name', 'email'] } },
        { name: 'invoiceDate', label: 'Invoice Date', dataType: 'date', uiType: 'date', required: true },
        { name: 'dueDate', label: 'Due Date', dataType: 'date', uiType: 'date', required: true },
        { name: 'items', label: 'Line Items', dataType: 'table', uiType: 'table', required: true },
        { name: 'subtotal', label: 'Subtotal', dataType: 'number', uiType: 'currency', required: true },
        { name: 'tax', label: 'Tax', dataType: 'number', uiType: 'currency', required: false },
        { name: 'total', label: 'Total', dataType: 'number', uiType: 'currency', required: true },
        { name: 'status', label: 'Status', dataType: 'string', uiType: 'dropdown', required: true, options: ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'], defaultValue: 'Draft' },
      ]),
      status: 'active',
      version: 1,
    },
    {
      moduleName: 'Payments',
      displayName: 'Payments',
      icon: 'FiCreditCard',
      description: 'Record and track payments received',
      workflowCategory: 'Sales',
      workflowName: 'Sales',
      position: 6,
      showInNav: true,
      allowedRoles: JSON.stringify(['manager', 'owner', 'staff']),
      isCustomModule: false,
      isCustomized: false,
      fields: JSON.stringify([
        { name: 'paymentNumber', label: 'Payment Number', dataType: 'string', uiType: 'text', required: true, searchable: true },
        { name: 'invoice', label: 'Invoice', dataType: 'reference', uiType: 'lookup', required: true, lookupConfig: { targetModule: 'Invoices', displayField: 'invoiceNumber', searchFields: ['invoiceNumber'] } },
        { name: 'paymentDate', label: 'Payment Date', dataType: 'date', uiType: 'date', required: true },
        { name: 'amount', label: 'Amount', dataType: 'number', uiType: 'currency', required: true },
        { name: 'paymentMethod', label: 'Payment Method', dataType: 'string', uiType: 'dropdown', required: true, options: ['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Credit Card', 'Debit Card'] },
        { name: 'referenceNumber', label: 'Reference Number', dataType: 'string', uiType: 'text', required: false },
        { name: 'notes', label: 'Notes', dataType: 'text', uiType: 'textarea', required: false },
        { name: 'status', label: 'Status', dataType: 'string', uiType: 'dropdown', required: true, options: ['Pending', 'Completed', 'Failed'], defaultValue: 'Completed' },
      ]),
      status: 'active',
      version: 1,
    },
    
    // Purchase Workflow Modules
    {
      moduleName: 'Vendors',
      displayName: 'Vendors',
      icon: 'FiTruck',
      description: 'Manage suppliers and vendors',
      workflowCategory: 'Purchase',
      workflowName: 'Purchase',
      position: 1,
      showInNav: true,
      allowedRoles: JSON.stringify(['manager', 'owner', 'staff']),
      isCustomModule: false,
      isCustomized: false,
      fields: JSON.stringify([
        { name: 'vendorNumber', label: 'Vendor Number', dataType: 'string', uiType: 'text', required: true, searchable: true },
        { name: 'name', label: 'Vendor Name', dataType: 'string', uiType: 'text', required: true, searchable: true },
        { name: 'email', label: 'Email', dataType: 'string', uiType: 'email', required: false, searchable: true },
        { name: 'phone', label: 'Phone', dataType: 'string', uiType: 'phone', required: false, searchable: true },
        { name: 'company', label: 'Company', dataType: 'string', uiType: 'text', required: false, searchable: true },
        { name: 'gstNumber', label: 'GST Number', dataType: 'string', uiType: 'text', required: false },
        { name: 'address', label: 'Address', dataType: 'text', uiType: 'textarea', required: false },
        { name: 'paymentTerms', label: 'Payment Terms', dataType: 'string', uiType: 'dropdown', required: false, options: ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due on Receipt', 'Custom'] },
        { name: 'status', label: 'Status', dataType: 'string', uiType: 'dropdown', required: true, options: ['Active', 'Inactive'], defaultValue: 'Active' },
      ]),
      status: 'active',
      version: 1,
    },
    {
      moduleName: 'PurchaseRequests',
      displayName: 'Purchase Requests',
      icon: 'FiFileText',
      description: 'Create and manage purchase requests',
      workflowCategory: 'Purchase',
      workflowName: 'Purchase',
      position: 2,
      showInNav: true,
      allowedRoles: JSON.stringify(['manager', 'owner', 'staff']),
      isCustomModule: false,
      isCustomized: false,
      fields: JSON.stringify([
        { name: 'requestNumber', label: 'Request Number', dataType: 'string', uiType: 'text', required: true, searchable: true },
        { name: 'requestedBy', label: 'Requested By', dataType: 'string', uiType: 'text', required: true },
        { name: 'requestDate', label: 'Request Date', dataType: 'date', uiType: 'date', required: true },
        { name: 'requiredBy', label: 'Required By', dataType: 'date', uiType: 'date', required: false },
        { name: 'items', label: 'Items', dataType: 'table', uiType: 'table', required: true, tableConfig: { columns: [{ name: 'description', label: 'Description', type: 'text' }, { name: 'quantity', label: 'Quantity', type: 'number' }, { name: 'estimatedCost', label: 'Est. Cost', type: 'currency' }] } },
        { name: 'justification', label: 'Justification', dataType: 'text', uiType: 'textarea', required: false },
        { name: 'status', label: 'Status', dataType: 'string', uiType: 'dropdown', required: true, options: ['Draft', 'Pending Approval', 'Approved', 'Rejected', 'Converted'], defaultValue: 'Draft' },
      ]),
      status: 'active',
      version: 1,
    },
    {
      moduleName: 'PurchaseOrders',
      displayName: 'Purchase Orders',
      icon: 'FiShoppingCart',
      description: 'Create and track purchase orders',
      workflowCategory: 'Purchase',
      workflowName: 'Purchase',
      position: 3,
      showInNav: true,
      allowedRoles: JSON.stringify(['manager', 'owner', 'staff']),
      isCustomModule: false,
      isCustomized: false,
      fields: JSON.stringify([
        { name: 'poNumber', label: 'PO Number', dataType: 'string', uiType: 'text', required: true, searchable: true },
        { name: 'vendor', label: 'Vendor', dataType: 'reference', uiType: 'lookup', required: true, lookupConfig: { targetModule: 'Vendors', displayField: 'name', searchFields: ['name', 'email'] } },
        { name: 'orderDate', label: 'Order Date', dataType: 'date', uiType: 'date', required: true },
        { name: 'expectedDelivery', label: 'Expected Delivery', dataType: 'date', uiType: 'date', required: false },
        { name: 'items', label: 'Line Items', dataType: 'table', uiType: 'table', required: true, tableConfig: { columns: [{ name: 'description', label: 'Description', type: 'text' }, { name: 'quantity', label: 'Quantity', type: 'number' }, { name: 'rate', label: 'Rate', type: 'currency' }, { name: 'amount', label: 'Amount', type: 'currency', formula: 'quantity * rate' }] } },
        { name: 'subtotal', label: 'Subtotal', dataType: 'number', uiType: 'currency', required: true },
        { name: 'tax', label: 'Tax', dataType: 'number', uiType: 'currency', required: false },
        { name: 'total', label: 'Total', dataType: 'number', uiType: 'currency', required: true },
        { name: 'status', label: 'Status', dataType: 'string', uiType: 'dropdown', required: true, options: ['Draft', 'Sent', 'Confirmed', 'Partially Received', 'Received', 'Cancelled'], defaultValue: 'Draft' },
      ]),
      status: 'active',
      version: 1,
    },
    {
      moduleName: 'GoodsReceipt',
      displayName: 'Goods Receipt',
      icon: 'FiPackage',
      description: 'Record goods received from vendors',
      workflowCategory: 'Purchase',
      workflowName: 'Purchase',
      position: 4,
      showInNav: true,
      allowedRoles: JSON.stringify(['manager', 'owner', 'staff']),
      isCustomModule: false,
      isCustomized: false,
      fields: JSON.stringify([
        { name: 'receiptNumber', label: 'Receipt Number', dataType: 'string', uiType: 'text', required: true, searchable: true },
        { name: 'purchaseOrder', label: 'Purchase Order', dataType: 'reference', uiType: 'lookup', required: true, lookupConfig: { targetModule: 'PurchaseOrders', displayField: 'poNumber', searchFields: ['poNumber'] } },
        { name: 'receiptDate', label: 'Receipt Date', dataType: 'date', uiType: 'date', required: true },
        { name: 'receivedBy', label: 'Received By', dataType: 'string', uiType: 'text', required: true },
        { name: 'items', label: 'Items Received', dataType: 'table', uiType: 'table', required: true, tableConfig: { columns: [{ name: 'description', label: 'Description', type: 'text' }, { name: 'orderedQty', label: 'Ordered Qty', type: 'number' }, { name: 'receivedQty', label: 'Received Qty', type: 'number' }, { name: 'condition', label: 'Condition', type: 'text' }] } },
        { name: 'notes', label: 'Notes', dataType: 'text', uiType: 'textarea', required: false },
        { name: 'status', label: 'Status', dataType: 'string', uiType: 'dropdown', required: true, options: ['Pending', 'Completed', 'Partial'], defaultValue: 'Pending' },
      ]),
      status: 'active',
      version: 1,
    },
    {
      moduleName: 'VendorBills',
      displayName: 'Vendor Bills',
      icon: 'FiFileText',
      description: 'Manage bills from vendors',
      workflowCategory: 'Purchase',
      workflowName: 'Purchase',
      position: 5,
      showInNav: true,
      allowedRoles: JSON.stringify(['manager', 'owner', 'staff']),
      isCustomModule: false,
      isCustomized: false,
      fields: JSON.stringify([
        { name: 'billNumber', label: 'Bill Number', dataType: 'string', uiType: 'text', required: true, searchable: true },
        { name: 'vendor', label: 'Vendor', dataType: 'reference', uiType: 'lookup', required: true, lookupConfig: { targetModule: 'Vendors', displayField: 'name', searchFields: ['name', 'email'] } },
        { name: 'purchaseOrder', label: 'Purchase Order', dataType: 'reference', uiType: 'lookup', required: false, lookupConfig: { targetModule: 'PurchaseOrders', displayField: 'poNumber', searchFields: ['poNumber'] } },
        { name: 'billDate', label: 'Bill Date', dataType: 'date', uiType: 'date', required: true },
        { name: 'dueDate', label: 'Due Date', dataType: 'date', uiType: 'date', required: true },
        { name: 'items', label: 'Line Items', dataType: 'table', uiType: 'table', required: true },
        { name: 'subtotal', label: 'Subtotal', dataType: 'number', uiType: 'currency', required: true },
        { name: 'tax', label: 'Tax', dataType: 'number', uiType: 'currency', required: false },
        { name: 'total', label: 'Total', dataType: 'number', uiType: 'currency', required: true },
        { name: 'status', label: 'Status', dataType: 'string', uiType: 'dropdown', required: true, options: ['Draft', 'Pending', 'Paid', 'Overdue', 'Cancelled'], defaultValue: 'Pending' },
      ]),
      status: 'active',
      version: 1,
    },
    {
      moduleName: 'VendorPayments',
      displayName: 'Vendor Payments',
      icon: 'FiCreditCard',
      description: 'Record payments to vendors',
      workflowCategory: 'Purchase',
      workflowName: 'Purchase',
      position: 6,
      showInNav: true,
      allowedRoles: JSON.stringify(['manager', 'owner', 'staff']),
      isCustomModule: false,
      isCustomized: false,
      fields: JSON.stringify([
        { name: 'paymentNumber', label: 'Payment Number', dataType: 'string', uiType: 'text', required: true, searchable: true },
        { name: 'vendorBill', label: 'Vendor Bill', dataType: 'reference', uiType: 'lookup', required: true, lookupConfig: { targetModule: 'VendorBills', displayField: 'billNumber', searchFields: ['billNumber'] } },
        { name: 'paymentDate', label: 'Payment Date', dataType: 'date', uiType: 'date', required: true },
        { name: 'amount', label: 'Amount', dataType: 'number', uiType: 'currency', required: true },
        { name: 'paymentMethod', label: 'Payment Method', dataType: 'string', uiType: 'dropdown', required: true, options: ['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Credit Card', 'Debit Card'] },
        { name: 'referenceNumber', label: 'Reference Number', dataType: 'string', uiType: 'text', required: false },
        { name: 'notes', label: 'Notes', dataType: 'text', uiType: 'textarea', required: false },
        { name: 'status', label: 'Status', dataType: 'string', uiType: 'dropdown', required: true, options: ['Pending', 'Completed', 'Failed'], defaultValue: 'Completed' },
      ]),
      status: 'active',
      version: 1,
    },
  ];

  const createdModules = [];
  for (const moduleData of defaultModules) {
    // Remove fields that don't exist in schema
    const { workflowName, allowedRoles, isCustomized, ...validData } = moduleData;
    
    const module = await prisma.moduleConfiguration.create({
      data: {
        ...validData,
        tenantId,
        createdBy,
      },
    });
    createdModules.push(module);
    console.log(`[SEED] Created module: ${module.moduleName}`);
  }

  console.log(`[SEED] Successfully created ${createdModules.length} default modules`);
  return createdModules;
}
