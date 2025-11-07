/**
 * Invoice PDF Document Template
 * 
 * Professional invoice template compliant with Indian GST requirements:
 * - Company and client GSTIN details
 * - Tax invoice numbering
 * - Line items with HSN/SAC codes (if applicable)
 * - GST breakdown (CGST+SGST or IGST)
 * - Payment terms and bank details
 * - Legal compliance footer
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { InvoicePDFData, TenantSettings } from '@/lib/services/pdf-generation-service';

// Define styles for the invoice PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #dc2626',
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#991b1b',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc2626',
    marginTop: 15,
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 15,
  },
  section: {
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  column: {
    flex: 1,
  },
  label: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 3,
  },
  value: {
    fontSize: 10,
    color: '#1e293b',
    fontWeight: 'bold',
  },
  statusBadge: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: 5,
    borderRadius: 3,
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
  },
  statusBadgePaid: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  table: {
    marginTop: 15,
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#fee2e2',
    padding: 8,
    fontWeight: 'bold',
    borderBottom: '2 solid #dc2626',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #e2e8f0',
  },
  tableCol1: { width: '50%' },
  tableCol2: { width: '15%', textAlign: 'right' },
  tableCol3: { width: '15%', textAlign: 'right' },
  tableCol4: { width: '20%', textAlign: 'right' },
  totalsSection: {
    marginLeft: 'auto',
    width: '45%',
    marginTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  totalLabel: {
    fontSize: 9,
    color: '#475569',
  },
  totalValue: {
    fontSize: 10,
    color: '#1e293b',
    fontWeight: 'bold',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#fee2e2',
    marginTop: 5,
    borderTop: '2 solid #dc2626',
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  gstBreakdown: {
    backgroundColor: '#fef3c7',
    padding: 10,
    marginTop: 10,
    borderRadius: 4,
  },
  gstTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#92400e',
  },
  gstRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  gstLabel: {
    fontSize: 9,
    color: '#78350f',
  },
  gstValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#78350f',
  },
  bankDetails: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#eff6ff',
    borderLeft: '3 solid #2563eb',
  },
  bankTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1e40af',
  },
  bankInfo: {
    fontSize: 9,
    color: '#1e40af',
    marginBottom: 2,
  },
  notes: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderLeft: '3 solid #dc2626',
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1e293b',
  },
  notesText: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.4,
  },
  declaration: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#fef9c3',
    border: '1 solid #eab308',
  },
  declarationText: {
    fontSize: 8,
    color: '#713f12',
    lineHeight: 1.3,
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    borderTop: '1 solid #e2e8f0',
    paddingTop: 10,
  },
  signature: {
    marginTop: 30,
    marginBottom: 10,
    textAlign: 'right',
    paddingRight: 30,
  },
  signatureLine: {
    borderTop: '1 solid #cbd5e1',
    width: 200,
    marginLeft: 'auto',
    marginTop: 40,
    paddingTop: 5,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#64748b',
    textAlign: 'center',
  },
});

interface InvoiceDocumentProps {
  invoice: InvoicePDFData;
  tenant: TenantSettings;
}

export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ invoice, tenant }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const isPaid = invoice.paymentStatus === 'Paid' || invoice.paymentStatus === 'paid';
  const isOverdue = !isPaid && new Date(invoice.dueDate) < new Date();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header - Company Info */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{tenant.companyName || 'Easy2Work'}</Text>
          {tenant.companyAddress && (
            <Text style={styles.companyDetails}>{tenant.companyAddress}</Text>
          )}
          <View style={{ flexDirection: 'row', gap: 15 }}>
            {tenant.companyPhone && (
              <Text style={styles.companyDetails}>Phone: {tenant.companyPhone}</Text>
            )}
            {tenant.companyEmail && (
              <Text style={styles.companyDetails}>Email: {tenant.companyEmail}</Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 15 }}>
            {tenant.companyGSTIN && (
              <Text style={styles.companyDetails}>GSTIN: {tenant.companyGSTIN}</Text>
            )}
            {tenant.companyPAN && (
              <Text style={styles.companyDetails}>PAN: {tenant.companyPAN}</Text>
            )}
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>TAX INVOICE</Text>
        <Text style={styles.subtitle}>
          (Original for Recipient)
        </Text>

        {/* Invoice & Client Details */}
        <View style={styles.row}>
          <View style={styles.column}>
            <View style={styles.section}>
              <Text style={styles.label}>Invoice Number</Text>
              <Text style={styles.value}>{invoice.invoiceNumber}</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>Invoice Date</Text>
              <Text style={styles.value}>{formatDate(invoice.invoiceDate)}</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>Due Date</Text>
              <Text style={styles.value}>{formatDate(invoice.dueDate)}</Text>
            </View>
            {invoice.orderNumber && (
              <View style={styles.section}>
                <Text style={styles.label}>Order Reference</Text>
                <Text style={styles.value}>{invoice.orderNumber}</Text>
              </View>
            )}
            {invoice.paymentStatus && (
              <View style={isPaid ? [styles.statusBadge, styles.statusBadgePaid] : styles.statusBadge}>
                <Text>
                  Status: {invoice.paymentStatus.toUpperCase()}
                  {isOverdue && ' (OVERDUE)'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.column}>
            <View style={styles.section}>
              <Text style={styles.label}>Bill To</Text>
              <Text style={styles.value}>{invoice.clientName}</Text>
              {invoice.clientAddress && (
                <Text style={styles.notesText}>{invoice.clientAddress}</Text>
              )}
              {invoice.clientEmail && (
                <Text style={styles.companyDetails}>{invoice.clientEmail}</Text>
              )}
              {invoice.clientPhone && (
                <Text style={styles.companyDetails}>{invoice.clientPhone}</Text>
              )}
              {invoice.clientGSTIN && (
                <Text style={styles.companyDetails}>GSTIN: {invoice.clientGSTIN}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableCol1}>Description</Text>
            <Text style={styles.tableCol2}>Qty</Text>
            <Text style={styles.tableCol3}>Unit Price</Text>
            <Text style={styles.tableCol4}>Amount</Text>
          </View>

          {invoice.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCol1}>{item.description}</Text>
              <Text style={styles.tableCol2}>{item.quantity}</Text>
              <Text style={styles.tableCol3}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={styles.tableCol4}>{formatCurrency(item.amount)}</Text>
            </View>
          ))}
        </View>

        {/* Totals Section */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>

          {invoice.discountAmount && invoice.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={styles.totalValue}>- {formatCurrency(invoice.discountAmount)}</Text>
            </View>
          )}

          {/* GST Breakdown */}
          {invoice.gstType === 'CGST+SGST' ? (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>CGST ({invoice.cgstPercentage}%)</Text>
                <Text style={styles.totalValue}>{formatCurrency(invoice.cgstAmount || 0)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>SGST ({invoice.sgstPercentage}%)</Text>
                <Text style={styles.totalValue}>{formatCurrency(invoice.sgstAmount || 0)}</Text>
              </View>
            </>
          ) : (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>IGST ({invoice.igstPercentage}%)</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.igstAmount || 0)}</Text>
            </View>
          )}

          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total Amount</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(invoice.totalAmount)}</Text>
          </View>
        </View>

        {/* GST Info Box */}
        {invoice.gstType && (
          <View style={styles.gstBreakdown}>
            <Text style={styles.gstTitle}>Tax Information</Text>
            <View style={styles.gstRow}>
              <Text style={styles.gstLabel}>Tax Type:</Text>
              <Text style={styles.gstValue}>{invoice.gstType}</Text>
            </View>
            <View style={styles.gstRow}>
              <Text style={styles.gstLabel}>Total GST Amount:</Text>
              <Text style={styles.gstValue}>{formatCurrency(invoice.totalGSTAmount)}</Text>
            </View>
            <View style={styles.gstRow}>
              <Text style={styles.gstLabel}>Taxable Amount:</Text>
              <Text style={styles.gstValue}>{formatCurrency(invoice.subtotal - (invoice.discountAmount || 0))}</Text>
            </View>
          </View>
        )}

        {/* Bank Details */}
        {(tenant.bankName || invoice.bankName) && (
          <View style={styles.bankDetails}>
            <Text style={styles.bankTitle}>Bank Details for Payment</Text>
            {(tenant.bankName || invoice.bankName) && (
              <Text style={styles.bankInfo}>Bank Name: {tenant.bankName || invoice.bankName}</Text>
            )}
            {(tenant.accountNumber || invoice.accountNumber) && (
              <Text style={styles.bankInfo}>Account Number: {tenant.accountNumber || invoice.accountNumber}</Text>
            )}
            {(tenant.ifscCode || invoice.ifscCode) && (
              <Text style={styles.bankInfo}>IFSC Code: {tenant.ifscCode || invoice.ifscCode}</Text>
            )}
            {(tenant.branchName || invoice.branchName) && (
              <Text style={styles.bankInfo}>Branch: {tenant.branchName || invoice.branchName}</Text>
            )}
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Terms and Conditions */}
        {invoice.termsAndConditions && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Terms & Conditions</Text>
            <Text style={styles.notesText}>{invoice.termsAndConditions}</Text>
          </View>
        )}

        {/* Declaration */}
        <View style={styles.declaration}>
          <Text style={styles.declarationText}>
            Declaration: We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. This is a computer-generated invoice and is valid without signature as per Section 31 of GST Act.
          </Text>
        </View>

        {/* Signature */}
        <View style={styles.signature}>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureLabel}>Authorized Signatory</Text>
            <Text style={styles.signatureLabel}>{tenant.companyName}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            This is a system-generated tax invoice compliant with Indian GST regulations.
          </Text>
          <Text>
            Generated on: {formatDate(new Date().toISOString())}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
