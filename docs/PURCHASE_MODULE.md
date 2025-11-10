# Purchase & Vendor Management Module

## 🎯 Overview

Comprehensive Purchase and Vendor Management system integrated into the Easy2Work Multi-Tenant SaaS Platform. This module handles the complete procure-to-pay cycle from vendor onboarding to payment processing.

## 📋 Module Flow

```
Vendor → Rate Catalog → Purchase Request (PR) → Approval → Purchase Order (PO) 
→ Goods Receipt (GRN) → Vendor Bill → Expense Posting → Payment → Analytics
```

## 🗄️ Database Schema

### Core Models

#### 1. **Vendor**
Master data for suppliers and service providers.

**Key Fields:**
- `vendorCode` - Auto-generated unique code (VEN-00001)
- `vendorName` - Company name
- Contact information (person, email, phone)
- `gstNumber`, `panNumber` - Tax compliance
- `paymentTerms` - Net 15/30/45/60
- `creditLimit` - Maximum credit allowed
- `rating` - Performance rating (0-5 stars)
- Performance metrics: `onTimeDelivery`, `qualityScore`, `totalOrders`

**Status:** active, inactive, blocked

#### 2. **RateCatalog**
Vendor-wise pricing for items/services with validity periods.

**Key Fields:**
- `vendorId` - Link to vendor
- `itemCode`, `itemName` - Product/service identifier
- `rate`, `uom` - Unit price and measure
- `validFrom`, `validTo` - Price validity period
- `discount`, `discountType` - Percentage or flat
- `moq` - Minimum Order Quantity
- `leadTime` - Delivery time in days
- `taxConfig` - GST rate, HSN code (JSON)

**Features:**
- Auto-suggest best vendors based on price and rating
- Lead time calculation
- MOQ validation

#### 3. **PurchaseRequest (PR)**
Internal request to procure goods/services.

**Key Fields:**
- `prNumber` - Auto-generated (PR-00001)
- `title`, `description` - Request details
- `requestedBy`, `department` - Requester info
- `items` - JSON array of requested items
- `totalAmount`, `budgetCode` - Financial tracking
- `priority` - low, medium, high, urgent
- Approval tracking: `currentApprover`, `approvalLevel`, `approvedBy`

**Status Flow:**
draft → submitted → approved/rejected → converted_to_po

#### 4. **PurchaseOrder (PO)**
Formal vendor order document.

**Key Fields:**
- `poNumber` - Auto-generated (PO-00001)
- `prId` - Reference to Purchase Request
- `vendorId` - Selected vendor
- `orderDate`, `deliveryDate` - Timing
- `items` - JSON array with quantities, rates, tax
- Pricing: `subtotal`, `taxAmount`, `totalAmount`
- `paymentTerms` - Inherited from vendor
- Fulfillment: `receivedQuantity`, `pendingQuantity`

**Status Flow:**
draft → sent → acknowledged → partially_received → fully_received → closed

**Features:**
- Auto-email to vendor when sent
- Track receipt status
- Link to GRNs

#### 5. **GoodsReceipt (GRN)**
Record of received goods with quality inspection.

**Key Fields:**
- `grnNumber` - Auto-generated (GRN-00001)
- `poId` - Reference to Purchase Order
- `receiptDate` - When received
- `invoiceNumber`, `vehicleNumber` - Delivery details
- `items` - JSON: orderedQty, receivedQty, acceptedQty, rejectedQty
- Quality: `qualityStatus`, `inspectedBy`, `inspectionDate`
- `hasDiscrepancy`, `discrepancyNote` - Variance tracking
- `storageLocation` - Warehouse details (JSON)

**Status Flow:**
draft → received → inspected → posted → cancelled

**Validation:**
- Checks received quantity vs PO quantity
- Prevents over-receiving
- Flags quality issues

#### 6. **VendorBill**
Supplier invoice processing and validation.

**Key Fields:**
- `billNumber` - Internal reference (VBILL-00001)
- `vendorInvoiceNo`, `vendorInvoiceDate` - Vendor's invoice details
- `vendorId`, `poId` - References
- `grnIds` - Linked GRNs (JSON array)
- `items` - Line items with GST breakup
- Tax: `cgst`, `sgst`, `igst`, `cess`, `tds`
- Payment: `paidAmount`, `balanceAmount`
- `postedToExpense` - Posted to expense module
- `expensePostingId` - Link to expense entry

**Status Flow:**
draft → submitted → validated → approved → posted → paid

**3-Way Matching:**
- PO vs GRN vs Bill validation
- GST/TDS verification
- Discrepancy alerts

## 🔄 Workflows

### 1. PR Approval Workflow
- **Trigger:** PR status changes to 'submitted'
- **Auto-approve:** Amounts < ₹10,000
- **Manual approval:** Amounts ≥ ₹10,000
- **Notifications:** Manager, procurement team

### 2. PO Vendor Notification
- **Trigger:** PO status changes to 'sent'
- **Actions:**
  - Email PO to vendor
  - Update `sentToVendor` and `sentAt`

### 3. GRN Quality Check
- **Trigger:** GRN created
- **Actions:**
  - Notify quality team
  - Create inspection task
  - Alert on discrepancies

### 4. Vendor Bill Validation
- **Trigger:** Bill submitted
- **Actions:**
  - 3-way match (PO-GRN-Bill)
  - GST validation
  - TDS calculation
  - Notify accounts team

### 5. Bill Auto-Posting
- **Trigger:** Bill approved
- **Actions:**
  - Post to expense module
  - Create journal entry
  - Update vendor ledger

### 6. Payment Reminder
- **Trigger:** Daily schedule
- **Condition:** Payment due within 3 days
- **Actions:**
  - Notify accounts team
  - Send reminder email

### 7. Vendor Rating Update
- **Trigger:** PO fully received
- **Actions:**
  - Calculate on-time delivery %
  - Update quality score
  - Refresh vendor rating

## 🌐 API Endpoints

### Vendors
- `GET /api/modules/Vendors` - List vendors
- `POST /api/modules/Vendors` - Create vendor
- `GET /api/modules/Vendors/[vendorId]` - Get vendor details
- `PUT /api/modules/Vendors/[vendorId]` - Update vendor
- `DELETE /api/modules/Vendors/[vendorId]` - Deactivate vendor

### Rate Catalog
- `GET /api/modules/RateCatalog` - List rate catalogs
- `POST /api/modules/RateCatalog` - Add rate catalog entry
- `GET /api/modules/RateCatalog/suggest-vendors?itemCode=X&quantity=Y` - Get vendor suggestions

### Purchase Requests
- `GET /api/modules/PurchaseRequests` - List PRs
- `POST /api/modules/PurchaseRequests` - Create PR

### Purchase Orders
- `GET /api/modules/PurchaseOrders` - List POs
- `POST /api/modules/PurchaseOrders` - Create PO directly
- `POST /api/conversions/pr-to-po` - Convert PR to PO

### Goods Receipts
- `GET /api/modules/GoodsReceipts` - List GRNs
- `POST /api/modules/GoodsReceipts/create` - Create GRN (with validation)

### Vendor Bills
- `GET /api/modules/VendorBills` - List bills
- `POST /api/modules/VendorBills` - Create bill
- `POST /api/modules/VendorBills/[billId]/post-expense` - Post to expense

### Analytics
- `GET /api/analytics/purchase?startDate=X&endDate=Y` - Purchase analytics

## 🛠️ Services

### PurchaseService

#### `getSuggestedVendors(tenantId, itemCode, quantity)`
Returns ranked vendors based on:
- Rate (lowest first)
- Vendor rating (highest first)
- MOQ compliance
- Lead time
- Active rate catalog validity

#### `convertPRtoPO(tenantId, prId, vendorId, userId, additionalData)`
- Validates PR is approved
- Fetches vendor details
- Calculates amounts with tax
- Generates PO number
- Creates PO and links to PR
- Updates PR status to 'converted_to_po'

#### `validateGRN(tenantId, poId, grnItems)`
- Checks item codes against PO
- Validates quantities don't exceed PO
- Considers previous GRNs
- Returns validation results with errors/warnings

#### `createGRN(tenantId, poId, grnData, userId)`
- Validates GRN items
- Generates GRN number
- Creates GRN record
- Updates PO received quantities
- Changes PO status (partially_received/fully_received)

#### `postBillToExpense(tenantId, billId, userId)`
- Validates bill is approved
- Creates expense record in DynamicRecord
- Links bill to expense
- Updates bill status to 'posted'

#### `updateVendorRating(tenantId, vendorId)`
- Fetches completed POs
- Calculates on-time delivery %
- Calculates quality score from GRNs
- Computes weighted rating (0-5 scale)
- Updates vendor metrics

#### `getPurchaseAnalytics(tenantId, startDate, endDate)`
Returns:
- Total POs, GRNs, Bills count and value
- Pending payments
- Average delivery time
- Top vendors by orders
- Status-wise breakdowns

## 📊 Analytics & Reports

### Purchase Dashboard
- **Total PO Value** - By date range
- **Pending Payments** - Outstanding vendor bills
- **Average Delivery Time** - Vendor performance
- **Top Vendors** - By order count and rating
- **PO Status Distribution** - Draft, sent, received, etc.
- **Bill Status Distribution** - Pending, approved, paid

### Vendor Performance
- **On-Time Delivery %** - Based on PO vs GRN dates
- **Quality Score** - Based on GRN quality status
- **Overall Rating** - Weighted average (0-5 stars)
- **Total Orders** - Lifetime order count

### Spend Analysis
- Category-wise spend
- Vendor-wise spend
- Month-over-month trends
- Budget vs actual

## 🔐 Security & Tenant Isolation

- All queries filtered by `tenantId`
- Audit logs for all operations
- Role-based access control
- Field-level permissions supported

## 🚀 Getting Started

### 1. Run Migrations
```bash
npx prisma migrate dev --name add_purchase_vendor_management
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Seed Data
```bash
npm run seed
```

This will create:
- 5 sample vendors
- 10 rate catalog entries
- Auto-number sequences
- Module configurations
- 10+ workflow automations

### 4. Access Modules
Navigate to:
- `/modules/Vendors` - Vendor management
- `/modules/PurchaseRequests` - Create PRs
- `/modules/PurchaseOrders` - Manage POs
- `/modules/GoodsReceipts` - Record GRNs
- `/modules/VendorBills` - Process invoices

## 🎨 UI Components

Use existing dynamic components:
- **DynamicForm** - For vendor, PR, PO, GRN, Bill forms
- **DynamicTable** - For listing all records
- **TableField** - For line items in PR/PO/GRN/Bill
- **DynamicField** - For individual field rendering

## 📝 Integration Points

### With Existing Modules:
1. **Clients** - Link vendors to client projects
2. **Orders** - Convert sales orders to purchase requests
3. **Expenses** - Auto-post approved bills
4. **Payments** - Track vendor payments
5. **Analytics** - Unified spend reporting

### External Integrations:
- Email notifications via SMTP
- Document storage (Google Drive/S3)
- Accounting software sync
- GST validation APIs

## ⚡ Performance Optimizations

- Indexed fields: `tenantId`, `status`, `vendorId`, `poId`
- Pagination on all list endpoints
- Caching for rate catalogs
- Background jobs for rating calculations

## 🧪 Testing

### Test Scenarios:
1. Create vendor with GST details
2. Add rate catalog with validity dates
3. Create PR and get vendor suggestions
4. Approve PR and convert to PO
5. Create GRN with discrepancy
6. Submit vendor bill for 3-way matching
7. Post bill to expense
8. Verify vendor rating update

## 📚 Best Practices

1. **Always validate** before creating GRN/Bill
2. **Use workflows** for automation
3. **Maintain rate catalogs** for accurate suggestions
4. **Regular vendor rating** updates
5. **Monitor pending payments** dashboard
6. **Audit trail** for compliance

## 🔄 Future Enhancements

- [ ] Vendor portal for PO acknowledgment
- [ ] RFQ (Request for Quotation) module
- [ ] Contract management
- [ ] Vendor scorecards
- [ ] Purchase budget tracking
- [ ] Multi-currency support
- [ ] Advanced analytics with ML predictions
- [ ] Mobile app for GRN scanning
- [ ] Integration with inventory management

## 📞 Support

For issues or questions, refer to:
- Main platform documentation
- API endpoint tests in `/tests` directory
- Workflow examples in database seeds

---

**Module Version:** 1.0.0  
**Last Updated:** November 10, 2025  
**Maintained By:** Easy2Work Development Team
