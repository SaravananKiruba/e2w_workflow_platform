/**
 * PDF Generation Service
 * 
 * Generates professional PDF documents for:
 * - Quotations
 * - Invoices
 * - Reports
 * 
 * Uses @react-pdf/renderer for React-based PDF generation
 */

import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { GSTCalculationService } from './gst-calculation-service';

export interface QuotationPDFData {
  quotationNumber: string;
  quotationDate: string;
  validUntil: string;
  
  // Client details
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientGSTIN?: string;
  
  // Line items
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  
  // Pricing
  subtotal: number;
  discountAmount?: number;
  
  // GST
  gstPercentage: number;
  gstType?: string;
  cgstPercentage?: number;
  sgstPercentage?: number;
  igstPercentage?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalGSTAmount: number;
  totalAmount: number;
  
  // Additional info
  notes?: string;
  termsAndConditions?: string;
}

export interface InvoicePDFData extends QuotationPDFData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  orderNumber?: string;
  paymentStatus?: string;
  
  // Bank details
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
}

export interface TenantSettings {
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyGSTIN?: string;
  companyPAN?: string;
  companyLogo?: string;
  
  // Bank details
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
}

export class PDFGenerationService {
  /**
   * Generate Quotation PDF
   */
  static async generateQuotationPDF(
    quotationData: QuotationPDFData,
    tenantSettings: TenantSettings
  ): Promise<Buffer> {
    try {
      // Import the PDF document component dynamically
      const { QuotationDocument } = await import('@/components/pdf-templates');
      
      // Create React element - the component returns a Document
      const document = React.createElement(QuotationDocument, {
        quotation: quotationData,
        tenant: tenantSettings,
      });
      
      // Render the PDF document to buffer - cast to any to bypass type checking
      // as the component internally returns a Document element
      const pdfBuffer = await renderToBuffer(document as any);
      
      return pdfBuffer;
    } catch (error) {
      console.error('Error generating quotation PDF:', error);
      throw new Error('Failed to generate quotation PDF');
    }
  }
  
  /**
   * Generate Invoice PDF
   */
  static async generateInvoicePDF(
    invoiceData: InvoicePDFData,
    tenantSettings: TenantSettings
  ): Promise<Buffer> {
    try {
      // TODO: Create InvoiceDocument component
      // For now, throw not implemented error
      throw new Error('Invoice PDF generation not yet implemented. Please create InvoiceDocument component.');
      
      // Uncomment when InvoiceDocument is created:
      // const { InvoiceDocument } = await import('@/components/pdf-templates');
      // const document = React.createElement(InvoiceDocument, {
      //   invoice: invoiceData,
      //   tenant: tenantSettings,
      // });
      // const pdfBuffer = await renderToBuffer(document as any);
      // return pdfBuffer;
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      throw new Error('Failed to generate invoice PDF');
    }
  }
  
  /**
   * Format currency for display
   */
  static formatCurrency(amount: number): string {
    return GSTCalculationService.formatCurrency(amount);
  }
  
  /**
   * Format date for display
   */
  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  
  /**
   * Generate filename for PDF
   */
  static generateFilename(type: 'quotation' | 'invoice', number: string): string {
    const sanitizedNumber = number.replace(/[^a-zA-Z0-9-]/g, '_');
    const timestamp = new Date().getTime();
    return `${type}_${sanitizedNumber}_${timestamp}.pdf`;
  }
}
