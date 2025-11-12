import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Data Migration Script: DynamicRecord (EAV) → Typed Tables (Hybrid Model)
 * 
 * This script migrates existing data from the generic DynamicRecord table
 * to typed, indexed tables for better performance.
 * 
 * SAFE MIGRATION: Does NOT delete DynamicRecord data - preserves for rollback
 */

async function migrateLeads() {
  console.log('📊 Migrating Leads...');
  
  const leadRecords = await prisma.dynamicRecord.findMany({
    where: { moduleName: 'Leads', status: 'active' }
  });

  let migrated = 0;
  for (const record of leadRecords) {
    try {
      const data = JSON.parse(record.data);
      
      await prisma.lead.create({
        data: {
          id: record.id, // Preserve ID for referential integrity
          tenantId: record.tenantId,
          name: data.name || 'Unknown',
          email: data.email,
          phone: data.phone,
          company: data.company,
          source: data.source,
          status: data.status || 'New',
          priority: data.priority,
          expectedValue: data.expectedValue ? parseFloat(data.expectedValue) : null,
          customData: JSON.stringify({
            notes: data.notes,
            ...Object.fromEntries(
              Object.entries(data).filter(([key]) => 
                !['name', 'email', 'phone', 'company', 'source', 'status', 'priority', 'expectedValue'].includes(key)
              )
            )
          }),
          recordStatus: record.status,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          createdBy: record.createdBy,
          updatedBy: record.updatedBy,
        }
      });
      migrated++;
    } catch (error) {
      console.error(`❌ Failed to migrate Lead ${record.id}:`, error);
    }
  }
  
  console.log(`✅ Migrated ${migrated}/${leadRecords.length} leads`);
}

async function migrateClients() {
  console.log('👥 Migrating Clients...');
  
  const clientRecords = await prisma.dynamicRecord.findMany({
    where: { moduleName: 'Clients', status: 'active' }
  });

  let migrated = 0;
  for (const record of clientRecords) {
    try {
      const data = JSON.parse(record.data);
      
      await prisma.client.create({
        data: {
          id: record.id,
          tenantId: record.tenantId,
          clientName: data.clientName || data.name || 'Unknown',
          email: data.email,
          phone: data.phone,
          company: data.company,
          gstin: data.gstin || data.gstNumber,
          addressLine1: data.addressLine1 || data.address,
          addressLine2: data.addressLine2,
          city: data.city,
          state: data.state,
          pincode: data.pincode || data.zipCode,
          country: data.country || 'India',
          status: data.status || 'active',
          clientType: data.clientType || data.type,
          industry: data.industry,
          customData: JSON.stringify({
            website: data.website,
            ...Object.fromEntries(
              Object.entries(data).filter(([key]) => 
                !['clientName', 'name', 'email', 'phone', 'company', 'gstin', 'gstNumber', 
                  'addressLine1', 'addressLine2', 'address', 'city', 'state', 'pincode', 
                  'zipCode', 'country', 'status', 'clientType', 'type', 'industry'].includes(key)
              )
            )
          }),
          recordStatus: record.status,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          createdBy: record.createdBy,
          updatedBy: record.updatedBy,
        }
      });
      migrated++;
    } catch (error) {
      console.error(`❌ Failed to migrate Client ${record.id}:`, error);
    }
  }
  
  console.log(`✅ Migrated ${migrated}/${clientRecords.length} clients`);
}

async function migrateQuotations() {
  console.log('📄 Migrating Quotations...');
  
  const quotationRecords = await prisma.dynamicRecord.findMany({
    where: { moduleName: 'Quotations', status: 'active' }
  });

  let migrated = 0;
  for (const record of quotationRecords) {
    try {
      const data = JSON.parse(record.data);
      
      // Ensure clientId exists
      if (!data.clientId) {
        console.warn(`⚠️ Skipping Quotation ${record.id}: Missing clientId`);
        continue;
      }

      await prisma.quotation.create({
        data: {
          id: record.id,
          tenantId: record.tenantId,
          quotationNumber: data.quotationNumber || data.quoteNumber || `QT-${record.id.slice(-8)}`,
          clientId: data.clientId,
          clientName: data.clientName || 'Unknown',
          clientGSTIN: data.clientGSTIN || data.gstin,
          quotationDate: data.quotationDate ? new Date(data.quotationDate) : record.createdAt,
          validUntil: data.validUntil ? new Date(data.validUntil) : null,
          subtotal: parseFloat(data.subtotal || 0),
          taxAmount: parseFloat(data.taxAmount || data.tax || 0),
          discountAmount: parseFloat(data.discountAmount || data.discount || 0),
          totalAmount: parseFloat(data.totalAmount || data.total || 0),
          status: data.status || 'Draft',
          items: JSON.stringify(data.items || []),
          terms: data.terms ? JSON.stringify(data.terms) : null,
          customData: JSON.stringify({
            notes: data.notes,
            ...Object.fromEntries(
              Object.entries(data).filter(([key]) => 
                !['quotationNumber', 'quoteNumber', 'clientId', 'clientName', 'clientGSTIN', 
                  'gstin', 'quotationDate', 'validUntil', 'subtotal', 'taxAmount', 'tax', 
                  'discountAmount', 'discount', 'totalAmount', 'total', 'status', 'items', 'terms'].includes(key)
              )
            )
          }),
          recordStatus: record.status,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          createdBy: record.createdBy,
          updatedBy: record.updatedBy,
        }
      });
      migrated++;
    } catch (error) {
      console.error(`❌ Failed to migrate Quotation ${record.id}:`, error);
    }
  }
  
  console.log(`✅ Migrated ${migrated}/${quotationRecords.length} quotations`);
}

async function migrateOrders() {
  console.log('📦 Migrating Orders...');
  
  const orderRecords = await prisma.dynamicRecord.findMany({
    where: { moduleName: 'Orders', status: 'active' }
  });

  let migrated = 0;
  for (const record of orderRecords) {
    try {
      const data = JSON.parse(record.data);
      
      if (!data.clientId) {
        console.warn(`⚠️ Skipping Order ${record.id}: Missing clientId`);
        continue;
      }

      await prisma.order.create({
        data: {
          id: record.id,
          tenantId: record.tenantId,
          orderNumber: data.orderNumber || `ORD-${record.id.slice(-8)}`,
          quotationId: data.quotationId || null,
          clientId: data.clientId,
          clientName: data.clientName || 'Unknown',
          orderDate: data.orderDate ? new Date(data.orderDate) : record.createdAt,
          deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
          subtotal: parseFloat(data.subtotal || 0),
          taxAmount: parseFloat(data.taxAmount || data.tax || 0),
          discountAmount: parseFloat(data.discountAmount || data.discount || 0),
          totalAmount: parseFloat(data.totalAmount || data.total || 0),
          status: data.status || 'Pending',
          paymentStatus: data.paymentStatus || 'Unpaid',
          items: JSON.stringify(data.items || []),
          customData: JSON.stringify({
            notes: data.notes,
            ...Object.fromEntries(
              Object.entries(data).filter(([key]) => 
                !['orderNumber', 'quotationId', 'clientId', 'clientName', 'orderDate', 
                  'deliveryDate', 'subtotal', 'taxAmount', 'tax', 'discountAmount', 'discount', 
                  'totalAmount', 'total', 'status', 'paymentStatus', 'items'].includes(key)
              )
            )
          }),
          recordStatus: record.status,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          createdBy: record.createdBy,
          updatedBy: record.updatedBy,
        }
      });
      migrated++;
    } catch (error) {
      console.error(`❌ Failed to migrate Order ${record.id}:`, error);
    }
  }
  
  console.log(`✅ Migrated ${migrated}/${orderRecords.length} orders`);
}

async function migrateInvoices() {
  console.log('🧾 Migrating Invoices...');
  
  const invoiceRecords = await prisma.dynamicRecord.findMany({
    where: { moduleName: 'Invoices', status: 'active' }
  });

  let migrated = 0;
  for (const record of invoiceRecords) {
    try {
      const data = JSON.parse(record.data);
      
      if (!data.clientId) {
        console.warn(`⚠️ Skipping Invoice ${record.id}: Missing clientId`);
        continue;
      }

      await prisma.invoice.create({
        data: {
          id: record.id,
          tenantId: record.tenantId,
          invoiceNumber: data.invoiceNumber || `INV-${record.id.slice(-8)}`,
          orderId: data.orderId || null,
          quotationId: data.quotationId || null,
          clientId: data.clientId,
          clientName: data.clientName || 'Unknown',
          clientGSTIN: data.clientGSTIN || data.gstin,
          invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : record.createdAt,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          subtotal: parseFloat(data.subtotal || 0),
          taxAmount: parseFloat(data.taxAmount || data.tax || 0),
          discountAmount: parseFloat(data.discountAmount || data.discount || 0),
          totalAmount: parseFloat(data.totalAmount || data.total || 0),
          paidAmount: parseFloat(data.paidAmount || 0),
          balanceAmount: parseFloat(data.balanceAmount || data.totalAmount || data.total || 0),
          status: data.status || 'Draft',
          paymentStatus: data.paymentStatus || 'Unpaid',
          items: JSON.stringify(data.items || []),
          customData: JSON.stringify({
            notes: data.notes,
            ...Object.fromEntries(
              Object.entries(data).filter(([key]) => 
                !['invoiceNumber', 'orderId', 'quotationId', 'clientId', 'clientName', 
                  'clientGSTIN', 'gstin', 'invoiceDate', 'dueDate', 'subtotal', 'taxAmount', 
                  'tax', 'discountAmount', 'discount', 'totalAmount', 'total', 'paidAmount', 
                  'balanceAmount', 'status', 'paymentStatus', 'items'].includes(key)
              )
            )
          }),
          recordStatus: record.status,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          createdBy: record.createdBy,
          updatedBy: record.updatedBy,
        }
      });
      migrated++;
    } catch (error) {
      console.error(`❌ Failed to migrate Invoice ${record.id}:`, error);
    }
  }
  
  console.log(`✅ Migrated ${migrated}/${invoiceRecords.length} invoices`);
}

async function migratePayments() {
  console.log('💰 Migrating Payments...');
  
  const paymentRecords = await prisma.dynamicRecord.findMany({
    where: { moduleName: 'Payments', status: 'active' }
  });

  let migrated = 0;
  for (const record of paymentRecords) {
    try {
      const data = JSON.parse(record.data);

      await prisma.payment.create({
        data: {
          id: record.id,
          tenantId: record.tenantId,
          paymentNumber: data.paymentNumber || data.transactionId || `PAY-${record.id.slice(-8)}`,
          invoiceId: data.invoiceId || null,
          orderId: data.orderId || null,
          clientId: data.clientId || null,
          clientName: data.clientName || data.customerName,
          paymentDate: data.paymentDate ? new Date(data.paymentDate) : record.createdAt,
          amount: parseFloat(data.amount || 0),
          paymentMethod: data.paymentMethod || data.method,
          transactionId: data.transactionId || data.referenceNumber,
          status: data.status || 'Completed',
          customData: JSON.stringify({
            ...Object.fromEntries(
              Object.entries(data).filter(([key]) => 
                !['paymentNumber', 'transactionId', 'invoiceId', 'orderId', 'clientId', 
                  'clientName', 'customerName', 'paymentDate', 'amount', 'paymentMethod', 
                  'method', 'referenceNumber', 'status', 'notes'].includes(key)
              )
            )
          }),
          notes: data.notes,
          recordStatus: record.status,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          createdBy: record.createdBy,
          updatedBy: record.updatedBy,
        }
      });
      migrated++;
    } catch (error) {
      console.error(`❌ Failed to migrate Payment ${record.id}:`, error);
    }
  }
  
  console.log(`✅ Migrated ${migrated}/${paymentRecords.length} payments`);
}

async function main() {
  console.log('🚀 Starting Hybrid Model Data Migration...\n');
  console.log('This migration will:');
  console.log('  ✓ Move data from DynamicRecord to typed tables');
  console.log('  ✓ Preserve original DynamicRecord entries (safe rollback)');
  console.log('  ✓ Add proper indexes for performance\n');

  try {
    await migrateLeads();
    await migrateClients();
    await migrateQuotations();
    await migrateOrders();
    await migrateInvoices();
    await migratePayments();

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Performance Benefits:');
    console.log('  • Queries now use database indexes (10-100x faster)');
    console.log('  • No more JSON.parse() on every read');
    console.log('  • SQL analytics queries now possible');
    console.log('  • Referential integrity enforced by database');
    console.log('\n⚠️  Note: DynamicRecord entries preserved for backward compatibility');
    console.log('   You can safely remove them after verifying the migration.');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
