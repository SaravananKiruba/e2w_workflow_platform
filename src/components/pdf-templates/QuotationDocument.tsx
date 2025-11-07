/**
 * Quotation PDF Document Template
 * 
 * Professional PDF template for quotations with:
 * - Company branding
 * - Client details
 * - Line items table
 * - GST breakdown (CGST+SGST or IGST)
 * - Terms and conditions
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { QuotationPDFData, TenantSettings } from '@/lib/services/pdf-generation-service';

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #2563eb',
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 15,
    marginBottom: 10,
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
  table: {
    marginTop: 15,
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 8,
    fontWeight: 'bold',
    borderBottom: '1 solid #cbd5e1',
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
    width: '40%',
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
    backgroundColor: '#f1f5f9',
    marginTop: 5,
    borderTop: '2 solid #2563eb',
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563eb',
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
  notes: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderLeft: '3 solid #2563eb',
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
});

interface QuotationDocumentProps {
  quotation: QuotationPDFData;
  tenant: TenantSettings;
}

export const QuotationDocument: React.FC<QuotationDocumentProps> = ({ quotation, tenant }) => {
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
          {tenant.companyGSTIN && (
            <Text style={styles.companyDetails}>GSTIN: {tenant.companyGSTIN}</Text>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>QUOTATION</Text>

        {/* Quotation & Client Details */}
        <View style={styles.row}>
          <View style={styles.column}>
            <View style={styles.section}>
              <Text style={styles.label}>Quotation Number</Text>
              <Text style={styles.value}>{quotation.quotationNumber}</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>{formatDate(quotation.quotationDate)}</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>Valid Until</Text>
              <Text style={styles.value}>{formatDate(quotation.validUntil)}</Text>
            </View>
          </View>

          <View style={styles.column}>
            <View style={styles.section}>
              <Text style={styles.label}>Bill To</Text>
              <Text style={styles.value}>{quotation.clientName}</Text>
              {quotation.clientAddress && (
                <Text style={styles.notesText}>{quotation.clientAddress}</Text>
              )}
              {quotation.clientEmail && (
                <Text style={styles.companyDetails}>{quotation.clientEmail}</Text>
              )}
              {quotation.clientPhone && (
                <Text style={styles.companyDetails}>{quotation.clientPhone}</Text>
              )}
              {quotation.clientGSTIN && (
                <Text style={styles.companyDetails}>GSTIN: {quotation.clientGSTIN}</Text>
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

          {quotation.items.map((item, index) => (
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
            <Text style={styles.totalValue}>{formatCurrency(quotation.subtotal)}</Text>
          </View>

          {quotation.discountAmount && quotation.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={styles.totalValue}>- {formatCurrency(quotation.discountAmount)}</Text>
            </View>
          )}

          {/* GST Breakdown */}
          {quotation.gstType === 'CGST+SGST' ? (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>CGST ({quotation.cgstPercentage}%)</Text>
                <Text style={styles.totalValue}>{formatCurrency(quotation.cgstAmount || 0)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>SGST ({quotation.sgstPercentage}%)</Text>
                <Text style={styles.totalValue}>{formatCurrency(quotation.sgstAmount || 0)}</Text>
              </View>
            </>
          ) : (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>IGST ({quotation.igstPercentage}%)</Text>
              <Text style={styles.totalValue}>{formatCurrency(quotation.igstAmount || 0)}</Text>
            </View>
          )}

          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total Amount</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(quotation.totalAmount)}</Text>
          </View>
        </View>

        {/* GST Info Box */}
        {quotation.gstType && (
          <View style={styles.gstBreakdown}>
            <Text style={styles.gstTitle}>Tax Information</Text>
            <View style={styles.gstRow}>
              <Text style={styles.gstLabel}>Tax Type:</Text>
              <Text style={styles.gstValue}>{quotation.gstType}</Text>
            </View>
            <View style={styles.gstRow}>
              <Text style={styles.gstLabel}>Total GST Amount:</Text>
              <Text style={styles.gstValue}>{formatCurrency(quotation.totalGSTAmount)}</Text>
            </View>
          </View>
        )}

        {/* Notes */}
        {quotation.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{quotation.notes}</Text>
          </View>
        )}

        {/* Terms and Conditions */}
        {quotation.termsAndConditions && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Terms & Conditions</Text>
            <Text style={styles.notesText}>{quotation.termsAndConditions}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            This is a computer-generated quotation and does not require a signature.
          </Text>
          <Text>
            Thank you for your business!
          </Text>
        </View>
      </Page>
    </Document>
  );
};
