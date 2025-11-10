# Purchase & Vendor Management - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Run Database Migration
```bash
npx prisma migrate dev --name add_purchase_vendor_management
```

### Step 2: Generate Prisma Client
```bash
npx prisma generate
```

### Step 3: Seed Demo Data
```bash
npm run seed
```

This creates:
- ✅ 5 Vendors (ABC Supplies, XYZ Electronics, etc.)
- ✅ 10 Rate Catalog entries
- ✅ Auto-numbering sequences
- ✅ 5 Module configurations
- ✅ 10 Automated workflows

## 📋 Quick Test Flow

### 1. Create a Purchase Request
```bash
POST /api/modules/PurchaseRequests
{
  "title": "Office Supplies Purchase",
  "description": "Need paper and markers",
  "requestDate": "2025-11-10",
  "requiredBy": "2025-11-20",
  "department": "Admin",
  "priority": "medium",
  "items": [
    {
      "itemCode": "OFF-001",
      "itemName": "A4 Paper Ream",
      "quantity": 20,
      "uom": "REAM",
      "estimatedRate": 240
    }
  ],
  "totalAmount": 4800,
  "status": "submitted"
}
```

Response: PR-00001 created and auto-approved (< ₹10,000)

### 2. Get Vendor Suggestions
```bash
GET /api/modules/RateCatalog/suggest-vendors?itemCode=OFF-001&quantity=20
```

Response: Ranked vendors with best rates

### 3. Convert PR to PO
```bash
POST /api/conversions/pr-to-po
{
  "prId": "<pr-id>",
  "vendorId": "<vendor-id>",
  "deliveryDate": "2025-11-15",
  "paymentTerms": "Net 15"
}
```

Response: PO-00001 created, PR marked as converted

### 4. Create Goods Receipt (GRN)
```bash
POST /api/modules/GoodsReceipts/create
{
  "poId": "<po-id>",
  "receiptDate": "2025-11-14",
  "invoiceNumber": "VEN-INV-123",
  "items": [
    {
      "itemCode": "OFF-001",
      "itemName": "A4 Paper Ream",
      "orderedQty": 20,
      "receivedQty": 20,
      "acceptedQty": 20,
      "rejectedQty": 0,
      "uom": "REAM"
    }
  ],
  "qualityStatus": "passed"
}
```

Response: GRN-00001 created, PO status → fully_received

### 5. Create Vendor Bill
```bash
POST /api/modules/VendorBills
{
  "vendorId": "<vendor-id>",
  "poId": "<po-id>",
  "vendorInvoiceNo": "VEN-INV-123",
  "vendorInvoiceDate": "2025-11-14",
  "dueDate": "2025-11-29",
  "items": [
    {
      "itemCode": "OFF-001",
      "itemName": "A4 Paper Ream",
      "quantity": 20,
      "rate": 240,
      "gstRate": 12,
      "amount": 5376
    }
  ],
  "subtotal": 4800,
  "cgst": 288,
  "sgst": 288,
  "totalAmount": 5376,
  "status": "submitted"
}
```

Response: VBILL-00001 created

### 6. Post Bill to Expense
```bash
POST /api/modules/VendorBills/<bill-id>/post-expense
```

Response: Expense entry created, bill status → posted

## 🎯 Common Use Cases

### Use Case 1: Emergency Purchase (Bypass PR)
```javascript
// Create PO directly for urgent needs
POST /api/modules/PurchaseOrders
{
  "vendorId": "<vendor-id>",
  "orderDate": "2025-11-10",
  "deliveryDate": "2025-11-11",
  "items": [...],
  "status": "sent"
}
```

### Use Case 2: Partial Goods Receipt
```javascript
// Receive 50 out of 100 ordered items
POST /api/modules/GoodsReceipts/create
{
  "poId": "<po-id>",
  "items": [
    {
      "orderedQty": 100,
      "receivedQty": 50,
      "acceptedQty": 50
    }
  ]
}
// PO status → partially_received
// Can create another GRN for remaining 50
```

### Use Case 3: Quality Rejection
```javascript
// Reject items with quality issues
POST /api/modules/GoodsReceipts/create
{
  "items": [
    {
      "orderedQty": 100,
      "receivedQty": 100,
      "acceptedQty": 85,
      "rejectedQty": 15,
      "remarks": "15 items damaged"
    }
  ],
  "qualityStatus": "partially_passed",
  "hasDiscrepancy": true,
  "discrepancyNote": "Quality issues - 15 items rejected"
}
// Triggers discrepancy alert workflow
// Email sent to vendor
```

### Use Case 4: Bill with TDS
```javascript
// Create bill with TDS deduction
POST /api/modules/VendorBills
{
  "subtotal": 100000,
  "cgst": 9000,
  "sgst": 9000,
  "tds": 2000,  // 2% TDS
  "totalAmount": 118000,
  "balanceAmount": 116000  // Total - TDS
}
```

## 📊 View Analytics
```bash
GET /api/analytics/purchase?startDate=2025-01-01&endDate=2025-12-31
```

Response:
```json
{
  "summary": {
    "totalPOs": 15,
    "totalPOValue": 500000,
    "totalGRNs": 12,
    "totalBills": 10,
    "totalBillValue": 450000,
    "totalPaid": 300000,
    "pendingPayment": 150000,
    "avgDeliveryTime": 6,
    "activeVendors": 5
  },
  "topVendors": [
    {
      "vendorName": "XYZ Electronics",
      "totalOrders": 8,
      "rating": 4.8,
      "onTimeDelivery": 95
    }
  ]
}
```

## 🔔 Automated Workflows Active

1. ✅ **PR Auto-Approval** - Amounts < ₹10,000
2. ✅ **PO Email to Vendor** - When PO sent
3. ✅ **GRN Quality Alert** - On quality issues
4. ✅ **Bill 3-Way Matching** - PO-GRN-Bill validation
5. ✅ **Auto-Post to Expense** - When bill approved
6. ✅ **Payment Reminders** - 3 days before due
7. ✅ **Vendor Rating Update** - On PO completion

## 🛠️ Customization

### Add Custom Auto-Number Format
```javascript
// In auto_number_sequences table
{
  "moduleName": "PurchaseOrders",
  "prefix": "PO",
  "format": "{prefix}/{year}/{padded:4}",
  // Result: PO/2025/0001
}
```

### Add Custom Workflow
```javascript
POST /api/workflows
{
  "name": "High Value PO Approval",
  "moduleName": "PurchaseOrders",
  "trigger": {
    "event": "onCreate"
  },
  "conditions": {
    "operator": "AND",
    "rules": [
      { "field": "totalAmount", "operator": "greaterThan", "value": 100000 }
    ]
  },
  "actions": [
    {
      "type": "notification",
      "config": {
        "recipients": ["cfo", "ceo"],
        "message": "High value PO requires approval"
      }
    }
  ]
}
```

### Extend Vendor Fields
```javascript
// Update module configuration
PUT /api/modules/Vendors/config
{
  "fields": [
    ...existingFields,
    {
      "name": "certifications",
      "label": "Certifications",
      "type": "multiselect",
      "options": ["ISO 9001", "ISO 14001", "OHSAS 18001"]
    }
  ]
}
```

## 📱 Mobile/UI Access

### Access via Dynamic Routes
- `/modules/Vendors` - Vendor list and forms
- `/modules/PurchaseRequests` - PR management
- `/modules/PurchaseOrders` - PO tracking
- `/modules/GoodsReceipts` - GRN entry
- `/modules/VendorBills` - Bill processing

All use existing **DynamicForm** and **DynamicTable** components!

## 🔍 Troubleshooting

### Issue: Prisma errors after migration
```bash
# Regenerate Prisma client
npx prisma generate
```

### Issue: Auto-number not working
```bash
# Check sequences table
SELECT * FROM auto_number_sequences WHERE moduleName = 'Vendors';
# Reset if needed
UPDATE auto_number_sequences SET nextNumber = 1 WHERE moduleName = 'Vendors';
```

### Issue: Workflow not triggering
```bash
# Check workflow is active
SELECT * FROM workflows WHERE moduleName = 'PurchaseRequests' AND isActive = 1;
# Check workflow execution logs
SELECT * FROM workflow_executions ORDER BY executedAt DESC LIMIT 10;
```

## 📈 Next Steps

1. ✅ Configure email settings for vendor notifications
2. ✅ Customize approval hierarchies
3. ✅ Set up payment integration
4. ✅ Configure budget tracking
5. ✅ Enable mobile GRN scanning
6. ✅ Set up vendor portal

## 🎓 Training Resources

- Full Documentation: `/docs/PURCHASE_MODULE.md`
- API Reference: `/api/docs` (Swagger)
- Video Tutorials: Coming soon
- Support: dev@easy2work.com

---

**Time to First Transaction:** < 5 minutes  
**Zero Configuration Required:** Uses existing platform infrastructure  
**Fully Multi-Tenant:** Automatic tenant isolation
