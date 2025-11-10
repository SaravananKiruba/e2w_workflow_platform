-- Migration: Add Purchase & Vendor Management
-- Date: November 10, 2025
-- Description: Complete procure-to-pay cycle with vendor management

-- This migration will be generated automatically by Prisma
-- Run: npx prisma migrate dev --name add_purchase_vendor_management

-- Expected Tables to be Created:
-- 1. vendors
-- 2. rate_catalogs
-- 3. purchase_requests
-- 4. purchase_orders
-- 5. goods_receipts
-- 6. vendor_bills

-- Expected Indexes:
-- - vendors: (tenantId, status), (tenantId, vendorName)
-- - rate_catalogs: (tenantId, itemCode), (vendorId, validFrom, validTo)
-- - purchase_requests: (tenantId, status), (tenantId, requestedBy)
-- - purchase_orders: (tenantId, status), (tenantId, vendorId), (prId)
-- - goods_receipts: (tenantId, poId), (tenantId, status)
-- - vendor_bills: (tenantId, status), (tenantId, vendorId)

-- Expected Relationships:
-- - Vendor → RateCatalog (1:N)
-- - Vendor → PurchaseOrder (1:N)
-- - Vendor → GoodsReceipt (1:N)
-- - Vendor → VendorBill (1:N)
-- - PurchaseRequest → PurchaseOrder (1:N)
-- - PurchaseOrder → GoodsReceipt (1:N)
-- - PurchaseOrder → VendorBill (1:N)
-- - GoodsReceipt → VendorBill (N:1)

-- Post-Migration Steps:
-- 1. Run: npx prisma generate
-- 2. Run: npm run seed (to populate sample data)
-- 3. Verify: SELECT COUNT(*) FROM vendors; (should return 5)
-- 4. Verify: SELECT COUNT(*) FROM rate_catalogs; (should return 10)
-- 5. Verify: SELECT COUNT(*) FROM workflows WHERE moduleName LIKE 'Purchase%'; (should return 10+)

-- Rollback (if needed):
-- npx prisma migrate resolve --rolled-back add_purchase_vendor_management

-- Notes:
-- - All tables include tenantId for multi-tenant isolation
-- - Audit fields (createdBy, updatedBy, createdAt, updatedAt) included
-- - Status fields use string enums for flexibility
-- - JSON fields used for complex data (items, address, taxConfig)
-- - Auto-number sequences configured in seed data
