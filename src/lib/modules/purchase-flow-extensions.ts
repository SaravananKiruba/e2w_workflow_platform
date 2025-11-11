import { DynamicRecordService } from './dynamic-record-service';
import { prisma } from '@/lib/prisma';

/**
 * Purchase Flow Extensions for Dynamic Record Service
 * 
 * These are helper functions that work WITH the existing DynamicRecord system,
 * not separate hardcoded tables. Everything is stored in DynamicRecord!
 */
export class PurchaseFlowExtensions {
  /**
   * Get vendor suggestions based on Rate Catalog (stored in DynamicRecord)
   */
  static async getSuggestedVendors(
    tenantId: string,
    itemCode: string,
    quantity: number = 1
  ) {
    // Get all rate catalogs for this item
    const rateCatalogs = await DynamicRecordService.searchRecords(
      tenantId,
      'RateCatalogs',
      itemCode,
      ['itemCode', 'itemName']
    );

    const today = new Date();
    const suggestions = [];

    for (const catalog of rateCatalogs) {
      const data = JSON.parse(catalog.data);
      
      // Check validity
      const validFrom = new Date(data.validFrom);
      const validTo = data.validTo ? new Date(data.validTo) : null;
      
      if (validFrom > today || (validTo && validTo < today)) {
        continue; // Skip expired catalogs
      }

      // Check MOQ
      if (quantity < (data.moq || 1)) {
        continue;
      }

      // Get vendor details
      const vendor = await DynamicRecordService.getRecord(
        tenantId,
        'Vendors',
        data.vendorId
      );

      if (!vendor) continue;
      const vendorData = JSON.parse(vendor.data);

      // Calculate final rate
      let finalRate = data.rate;
      if (data.discountType === 'percentage') {
        finalRate = data.rate * (1 - (data.discount || 0) / 100);
      } else if (data.discountType === 'flat') {
        finalRate = data.rate - (data.discount || 0);
      }

      suggestions.push({
        vendorId: data.vendorId,
        vendorName: vendorData.vendorName,
        vendorCode: vendorData.vendorCode,
        rating: vendorData.rating || 0,
        rate: data.rate,
        discount: data.discount || 0,
        discountType: data.discountType || 'percentage',
        finalRate,
        moq: data.moq || 1,
        leadTime: data.leadTime || 7,
        estimatedDelivery: new Date(Date.now() + (data.leadTime || 7) * 24 * 60 * 60 * 1000),
      });
    }

    // Sort by final rate (lowest first), then by rating (highest first)
    return suggestions.sort((a, b) => {
      if (a.finalRate !== b.finalRate) {
        return a.finalRate - b.finalRate;
      }
      return b.rating - a.rating;
    });
  }

  /**
   * Convert Purchase Request to Purchase Order
   */
  static async convertPRtoPO(
    tenantId: string,
    prId: string,
    vendorId: string,
    userId: string,
    additionalData?: {
      deliveryDate?: string;
      shippingAddress?: any;
      billingAddress?: any;
      paymentTerms?: string;
    }
  ) {
    // Get PR
    const pr = await DynamicRecordService.getRecord(tenantId, 'PurchaseRequests', prId);
    if (!pr) throw new Error('Purchase Request not found');

    const prData: any = pr; // Already parsed by getRecord
    
    if (prData.status !== 'approved') {
      throw new Error('Purchase Request must be approved before conversion');
    }

    // Get Vendor
    const vendor = await DynamicRecordService.getRecord(tenantId, 'Vendors', vendorId);
    if (!vendor) throw new Error('Vendor not found');
    
    const vendorData: any = vendor; // Already parsed by getRecord

    // Calculate amounts
    const items = prData.items || [];
    let subtotal = 0;
    let taxAmount = 0;

    const poItems = items.map((item: any) => {
      const amount = item.quantity * item.estimatedRate;
      const tax = amount * ((item.taxRate || 0) / 100);
      subtotal += amount;
      taxAmount += tax;

      return {
        ...item,
        rate: item.estimatedRate,
        amount: amount + tax,
      };
    });

    // Create PO
    const poData = {
      prId,
      prNumber: prData.prNumber,
      vendorId,
      vendorName: vendorData.vendorName,
      orderDate: new Date().toISOString(),
      deliveryDate: additionalData?.deliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      items: poItems,
      subtotal,
      taxAmount,
      totalAmount: subtotal + taxAmount,
      pendingQuantity: items.reduce((sum: number, item: any) => sum + item.quantity, 0),
      receivedQuantity: 0,
      paymentTerms: additionalData?.paymentTerms || vendorData.paymentTerms || 'Net 30',
      shippingAddress: additionalData?.shippingAddress,
      billingAddress: additionalData?.billingAddress,
      status: 'draft',
    };

    const po = await DynamicRecordService.createRecord(
      tenantId,
      'PurchaseOrders',
      poData,
      userId
    );

    // Update PR
    prData.status = 'converted_to_po';
    prData.convertedToPO = true;
    prData.poId = po.id;

    await DynamicRecordService.updateRecord(
      tenantId,
      'PurchaseRequests',
      prId,
      prData,
      userId
    );

    return po;
  }

  /**
   * Validate GRN against PO
   */
  static async validateGRN(
    tenantId: string,
    poId: string,
    grnItems: Array<{ itemCode: string; receivedQty: number; acceptedQty: number }>
  ) {
    const po = await DynamicRecordService.getRecord(tenantId, 'PurchaseOrders', poId);
    if (!po) throw new Error('Purchase Order not found');

    const poData: any = po; // Already parsed by getRecord
    const validation: { isValid: boolean; errors: string[]; warnings: string[] } = { 
      isValid: true, 
      errors: [], 
      warnings: [] 
    };

    // Get existing GRNs
    const existingGRNs = await DynamicRecordService.searchRecords(
      tenantId,
      'GoodsReceipts',
      poId,
      ['poId']
    );

    // Calculate already received quantities
    const receivedMap = new Map<string, number>();
    for (const grn of existingGRNs) {
      const grnData: any = grn; // Already parsed
      if (grnData.status === 'cancelled') continue;

      grnData.items?.forEach((item: any) => {
        const current = receivedMap.get(item.itemCode) || 0;
        receivedMap.set(item.itemCode, current + (item.acceptedQty || 0));
      });
    }

    // Validate each item
    grnItems.forEach(grnItem => {
      const poItem = poData.items?.find((pi: any) => pi.itemCode === grnItem.itemCode);
      
      if (!poItem) {
        validation.isValid = false;
        validation.errors.push(`Item ${grnItem.itemCode} not found in PO`);
        return;
      }

      const alreadyReceived = receivedMap.get(grnItem.itemCode) || 0;
      const totalReceived = alreadyReceived + grnItem.acceptedQty;

      if (totalReceived > poItem.quantity) {
        validation.isValid = false;
        validation.errors.push(
          `Item ${grnItem.itemCode}: Total received (${totalReceived}) exceeds PO quantity (${poItem.quantity})`
        );
      }

      if (grnItem.receivedQty !== grnItem.acceptedQty) {
        validation.warnings.push(
          `Item ${grnItem.itemCode}: Received qty (${grnItem.receivedQty}) differs from accepted qty (${grnItem.acceptedQty})`
        );
      }
    });

    return validation;
  }

  /**
   * Create GRN with validation
   */
  static async createGRN(
    tenantId: string,
    poId: string,
    grnData: any,
    userId: string
  ) {
    // Validate
    const validation = await this.validateGRN(tenantId, poId, grnData.items);
    if (!validation.isValid) {
      throw new Error(`GRN validation failed: ${validation.errors.join(', ')}`);
    }

    // Get PO
    const po = await DynamicRecordService.getRecord(tenantId, 'PurchaseOrders', poId);
    if (!po) throw new Error('Purchase Order not found');
    const poData: any = po;

    // Create GRN
    const grn = await DynamicRecordService.createRecord(
      tenantId,
      'GoodsReceipts',
      {
        ...grnData,
        poId,
        poNumber: poData.poNumber,
        vendorId: poData.vendorId,
        vendorName: poData.vendorName,
        hasDiscrepancy: validation.warnings.length > 0,
        discrepancyNote: validation.warnings.join('; '),
        status: 'received',
      },
      userId
    );

    // Update PO
    const totalAccepted = grnData.items.reduce((sum: number, item: any) => sum + item.acceptedQty, 0);
    poData.receivedQuantity = (poData.receivedQuantity || 0) + totalAccepted;
    
    const totalOrdered = poData.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
    poData.pendingQuantity = totalOrdered - poData.receivedQuantity;

    if (poData.receivedQuantity >= totalOrdered) {
      poData.status = 'fully_received';
    } else if (poData.receivedQuantity > 0) {
      poData.status = 'partially_received';
    }

    await DynamicRecordService.updateRecord(tenantId, 'PurchaseOrders', poId, poData, userId);

    return { grn, validation };
  }

  /**
   * Post Vendor Bill to Expense
   */
  static async postBillToExpense(
    tenantId: string,
    billId: string,
    userId: string
  ) {
    const bill = await DynamicRecordService.getRecord(tenantId, 'VendorBills', billId);
    if (!bill) throw new Error('Vendor Bill not found');

    const billData: any = bill;

    if (billData.status !== 'approved') {
      throw new Error('Bill must be approved before posting');
    }

    if (billData.postedToExpense) {
      throw new Error('Bill already posted to expense');
    }

    // Create expense record
    const expenseData = {
      expenseType: 'vendor_bill',
      billId,
      billNumber: billData.billNumber,
      vendorId: billData.vendorId,
      vendorName: billData.vendorName,
      date: billData.vendorInvoiceDate,
      amount: billData.totalAmount,
      tdsAmount: billData.tds || 0,
      netAmount: billData.totalAmount - (billData.tds || 0),
      status: 'posted',
      paymentStatus: (billData.paidAmount || 0) >= billData.totalAmount ? 'paid' : 'pending',
    };

    const expense = await DynamicRecordService.createRecord(
      tenantId,
      'Expenses',
      expenseData,
      userId
    );

    // Update bill
    billData.postedToExpense = true;
    billData.expensePostingId = expense.id;
    billData.status = 'posted';

    await DynamicRecordService.updateRecord(tenantId, 'VendorBills', billId, billData, userId);

    return expense;
  }
}
