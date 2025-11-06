import { prisma } from '@/lib/prisma';

/**
 * Conversion Service - Handles record conversions across the lead-to-cash pipeline
 * Lead → Client → Quotation → Order → Invoice → Payment
 */
export class ConversionService {
  /**
   * Convert Lead to Client
   * Maps Lead fields to Client fields and creates new Client record
   */
  static async convertLeadToClient(
    tenantId: string,
    leadId: string,
    leadData: Record<string, any>,
    userId: string
  ) {
    try {
      // Extract and map Lead fields to Client fields
      const clientData = {
        clientName: leadData.name || leadData.clientName,
        email: leadData.email,
        phone: leadData.phone,
        gstNumber: leadData.gst || leadData.gstNumber,
        sourceLeadId: leadId, // Track origin
        status: 'active',
      };

      // Create Client record
      const clientRecord = await prisma.dynamicRecord.create({
        data: {
          tenantId,
          moduleName: 'Clients',
          data: JSON.stringify(clientData),
          status: 'active',
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // Update Lead status to 'Converted' and link to created Client
      const updatedLeadData = {
        ...leadData,
        status: 'Converted',
        convertedToClientId: clientRecord.id,
        convertedDate: new Date().toISOString(),
      };

      await prisma.dynamicRecord.update({
        where: { id: leadId },
        data: {
          data: JSON.stringify(updatedLeadData),
          updatedBy: userId,
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'convert_lead_to_client',
          entity: 'Leads',
          entityId: leadId,
          metadata: JSON.stringify({
            leadId,
            clientId: clientRecord.id,
            clientName: clientData.clientName,
          }),
        },
      });

      return {
        success: true,
        clientId: clientRecord.id,
        clientRecord: {
          id: clientRecord.id,
          ...clientData,
          createdAt: clientRecord.createdAt,
        },
      };
    } catch (error) {
      console.error('Error converting lead to client:', error);
      throw error;
    }
  }

  /**
   * Convert Quotation to Order
   * Copies quotation items, pricing, and client to new Order record
   */
  static async convertQuotationToOrder(
    tenantId: string,
    quotationId: string,
    quotationData: Record<string, any>,
    userId: string
  ) {
    try {
      // Extract quotation details
      const orderData = {
        clientId: quotationData.clientId,
        quotationId: quotationId, // Link back to quotation
        items: quotationData.items || [], // Copy line items
        subtotal: quotationData.subtotal,
        discount: quotationData.discount || 0,
        gstPercentage: quotationData.gstPercentage || 0,
        gstAmount: quotationData.gstAmount || 0,
        total: quotationData.total || quotationData.finalTotal,
        status: 'pending',
        notes: quotationData.notes,
      };

      // Create Order record
      const orderRecord = await prisma.dynamicRecord.create({
        data: {
          tenantId,
          moduleName: 'Orders',
          data: JSON.stringify(orderData),
          status: 'active',
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // Update Quotation status to 'Converted'
      const updatedQuotationData = {
        ...quotationData,
        status: 'Converted',
        convertedToOrderId: orderRecord.id,
        convertedDate: new Date().toISOString(),
      };

      await prisma.dynamicRecord.update({
        where: { id: quotationId },
        data: {
          data: JSON.stringify(updatedQuotationData),
          updatedBy: userId,
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'convert_quotation_to_order',
          entity: 'Quotations',
          entityId: quotationId,
          metadata: JSON.stringify({
            quotationId,
            orderId: orderRecord.id,
            itemCount: (quotationData.items || []).length,
          }),
        },
      });

      return {
        success: true,
        orderId: orderRecord.id,
        orderRecord: {
          id: orderRecord.id,
          ...orderData,
          createdAt: orderRecord.createdAt,
        },
      };
    } catch (error) {
      console.error('Error converting quotation to order:', error);
      throw error;
    }
  }

  /**
   * Convert Order to Invoice
   * Copies order items, pricing, and client to new Invoice record
   */
  static async convertOrderToInvoice(
    tenantId: string,
    orderId: string,
    orderData: Record<string, any>,
    userId: string
  ) {
    try {
      // Extract order details
      const invoiceData = {
        clientId: orderData.clientId,
        orderId: orderId, // Link back to order
        items: orderData.items || [], // Copy line items
        subtotal: orderData.subtotal,
        discount: orderData.discount || 0,
        gstPercentage: orderData.gstPercentage || 0,
        gstAmount: orderData.gstAmount || 0,
        total: orderData.total,
        status: 'pending_payment',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0], // 30 days from now
        notes: orderData.notes,
      };

      // Create Invoice record
      const invoiceRecord = await prisma.dynamicRecord.create({
        data: {
          tenantId,
          moduleName: 'Invoices',
          data: JSON.stringify(invoiceData),
          status: 'active',
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // Update Order status to 'Invoiced'
      const updatedOrderData = {
        ...orderData,
        status: 'Invoiced',
        convertedToInvoiceId: invoiceRecord.id,
        convertedDate: new Date().toISOString(),
      };

      await prisma.dynamicRecord.update({
        where: { id: orderId },
        data: {
          data: JSON.stringify(updatedOrderData),
          updatedBy: userId,
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'convert_order_to_invoice',
          entity: 'Orders',
          entityId: orderId,
          metadata: JSON.stringify({
            orderId,
            invoiceId: invoiceRecord.id,
            itemCount: (orderData.items || []).length,
          }),
        },
      });

      return {
        success: true,
        invoiceId: invoiceRecord.id,
        invoiceRecord: {
          id: invoiceRecord.id,
          ...invoiceData,
          createdAt: invoiceRecord.createdAt,
        },
      };
    } catch (error) {
      console.error('Error converting order to invoice:', error);
      throw error;
    }
  }
}
