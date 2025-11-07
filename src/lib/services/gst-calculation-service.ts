/**
 * GST Calculation Service
 * 
 * Handles Indian GST (Goods and Services Tax) calculations for:
 * - Quotations
 * - Orders
 * - Invoices
 * 
 * Supports:
 * - IGST (Integrated GST) - for interstate transactions
 * - CGST + SGST (Central + State GST) - for intrastate transactions
 * 
 * GST Rates in India: 0%, 5%, 12%, 18%, 28%
 */

export interface GSTCalculationInput {
  subtotal: number;              // Amount before GST
  gstPercentage: number;         // GST rate (0, 5, 12, 18, 28)
  businessGSTIN?: string;        // Business GSTIN (15 chars)
  clientGSTIN?: string;          // Client GSTIN (15 chars)
  applyGST?: boolean;           // Whether to apply GST (default: true)
}

export interface GSTCalculationResult {
  subtotal: number;              // Original amount
  gstType: 'IGST' | 'CGST+SGST' | 'NONE'; // Type of GST applied
  gstPercentage: number;         // GST rate used
  
  cgstPercentage: number;        // CGST rate (half of total for intrastate)
  sgstPercentage: number;        // SGST rate (half of total for intrastate)
  igstPercentage: number;        // IGST rate (full for interstate)
  
  cgstAmount: number;            // CGST amount
  sgstAmount: number;            // SGST amount
  igstAmount: number;            // IGST amount
  
  totalGSTAmount: number;        // Total GST (CGST+SGST or IGST)
  totalAfterGST: number;         // Final amount (subtotal + GST)
  
  businessState?: string;        // Business state code (if GSTIN provided)
  clientState?: string;          // Client state code (if GSTIN provided)
}

export class GSTCalculationService {
  
  /**
   * Validate GSTIN format
   * Format: 15 characters - 2 digits (state) + 10 chars (PAN) + 1 digit + 1 char + 1 char
   * Example: 29ABCDE1234F1Z5
   */
  static validateGSTIN(gstin: string): boolean {
    if (!gstin || gstin.length !== 15) return false;
    
    // GSTIN pattern: 2 digits + 10 alphanumeric (PAN) + 1 digit + 1 alpha + 1 alphanumeric
    const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinPattern.test(gstin.toUpperCase());
  }
  
  /**
   * Extract state code from GSTIN
   * First 2 digits represent state code (01-37)
   */
  static getStateCodeFromGSTIN(gstin: string): string | null {
    if (!this.validateGSTIN(gstin)) return null;
    return gstin.substring(0, 2);
  }
  
  /**
   * Determine GST type based on business and client location
   * - Same state → CGST + SGST
   * - Different states → IGST
   * - No GSTINs provided → default to IGST
   */
  static determineGSTType(businessGSTIN?: string, clientGSTIN?: string): 'IGST' | 'CGST+SGST' | 'NONE' {
    // If no GSTINs provided, default to IGST
    if (!businessGSTIN || !clientGSTIN) {
      return 'IGST';
    }
    
    // Validate both GSTINs
    if (!this.validateGSTIN(businessGSTIN) || !this.validateGSTIN(clientGSTIN)) {
      return 'IGST'; // Default to IGST if validation fails
    }
    
    const businessState = this.getStateCodeFromGSTIN(businessGSTIN);
    const clientState = this.getStateCodeFromGSTIN(clientGSTIN);
    
    if (!businessState || !clientState) {
      return 'IGST';
    }
    
    // Same state = Intrastate = CGST + SGST
    // Different state = Interstate = IGST
    return businessState === clientState ? 'CGST+SGST' : 'IGST';
  }
  
  /**
   * Calculate GST amounts
   */
  static calculateGST(input: GSTCalculationInput): GSTCalculationResult {
    const {
      subtotal,
      gstPercentage,
      businessGSTIN,
      clientGSTIN,
      applyGST = true,
    } = input;
    
    // Initialize result
    const result: GSTCalculationResult = {
      subtotal: subtotal || 0,
      gstType: 'NONE',
      gstPercentage: gstPercentage || 0,
      cgstPercentage: 0,
      sgstPercentage: 0,
      igstPercentage: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalGSTAmount: 0,
      totalAfterGST: subtotal || 0,
    };
    
    // If GST not applicable, return zero values
    if (!applyGST || !gstPercentage || gstPercentage === 0 || subtotal === 0) {
      return result;
    }
    
    // Determine GST type
    const gstType = this.determineGSTType(businessGSTIN, clientGSTIN);
    result.gstType = gstType;
    
    // Add state codes if available
    if (businessGSTIN) {
      result.businessState = this.getStateCodeFromGSTIN(businessGSTIN) || undefined;
    }
    if (clientGSTIN) {
      result.clientState = this.getStateCodeFromGSTIN(clientGSTIN) || undefined;
    }
    
    // Calculate GST amounts based on type
    if (gstType === 'CGST+SGST') {
      // Intrastate: Split GST equally between CGST and SGST
      result.cgstPercentage = gstPercentage / 2;
      result.sgstPercentage = gstPercentage / 2;
      result.igstPercentage = 0;
      
      result.cgstAmount = this.roundToTwoDecimals((subtotal * result.cgstPercentage) / 100);
      result.sgstAmount = this.roundToTwoDecimals((subtotal * result.sgstPercentage) / 100);
      result.igstAmount = 0;
      
      result.totalGSTAmount = result.cgstAmount + result.sgstAmount;
    } else if (gstType === 'IGST') {
      // Interstate: Full GST as IGST
      result.cgstPercentage = 0;
      result.sgstPercentage = 0;
      result.igstPercentage = gstPercentage;
      
      result.cgstAmount = 0;
      result.sgstAmount = 0;
      result.igstAmount = this.roundToTwoDecimals((subtotal * gstPercentage) / 100);
      
      result.totalGSTAmount = result.igstAmount;
    }
    
    // Calculate final total
    result.totalAfterGST = this.roundToTwoDecimals(subtotal + result.totalGSTAmount);
    
    return result;
  }
  
  /**
   * Calculate GST from line items
   */
  static calculateGSTFromLineItems(
    lineItems: Array<{ quantity: number; unitPrice: number }>,
    gstPercentage: number,
    businessGSTIN?: string,
    clientGSTIN?: string
  ): GSTCalculationResult {
    // Calculate subtotal from line items
    const subtotal = lineItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
    
    return this.calculateGST({
      subtotal,
      gstPercentage,
      businessGSTIN,
      clientGSTIN,
    });
  }
  
  /**
   * Validate GST percentage (must be 0, 5, 12, 18, or 28)
   */
  static isValidGSTPercentage(percentage: number): boolean {
    const validRates = [0, 5, 12, 18, 28];
    return validRates.includes(percentage);
  }
  
  /**
   * Get available GST rates
   */
  static getAvailableGSTRates(): Array<{ value: number; label: string }> {
    return [
      { value: 0, label: '0% GST' },
      { value: 5, label: '5% GST' },
      { value: 12, label: '12% GST' },
      { value: 18, label: '18% GST' },
      { value: 28, label: '28% GST' },
    ];
  }
  
  /**
   * Get state name from state code
   * Reference: Indian state GST codes
   */
  static getStateName(stateCode: string): string {
    const stateMap: Record<string, string> = {
      '01': 'Jammu and Kashmir',
      '02': 'Himachal Pradesh',
      '03': 'Punjab',
      '04': 'Chandigarh',
      '05': 'Uttarakhand',
      '06': 'Haryana',
      '07': 'Delhi',
      '08': 'Rajasthan',
      '09': 'Uttar Pradesh',
      '10': 'Bihar',
      '11': 'Sikkim',
      '12': 'Arunachal Pradesh',
      '13': 'Nagaland',
      '14': 'Manipur',
      '15': 'Mizoram',
      '16': 'Tripura',
      '17': 'Meghalaya',
      '18': 'Assam',
      '19': 'West Bengal',
      '20': 'Jharkhand',
      '21': 'Odisha',
      '22': 'Chhattisgarh',
      '23': 'Madhya Pradesh',
      '24': 'Gujarat',
      '25': 'Daman and Diu',
      '26': 'Dadra and Nagar Haveli',
      '27': 'Maharashtra',
      '29': 'Karnataka',
      '30': 'Goa',
      '31': 'Lakshadweep',
      '32': 'Kerala',
      '33': 'Tamil Nadu',
      '34': 'Puducherry',
      '35': 'Andaman and Nicobar Islands',
      '36': 'Telangana',
      '37': 'Andhra Pradesh',
    };
    
    return stateMap[stateCode] || 'Unknown State';
  }
  
  /**
   * Round to 2 decimal places
   */
  private static roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }
  
  /**
   * Format currency for display (Indian Rupee)
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  
  /**
   * Generate GST summary text for display
   */
  static generateGSTSummary(result: GSTCalculationResult): string {
    const lines: string[] = [];
    
    lines.push(`Subtotal: ${this.formatCurrency(result.subtotal)}`);
    
    if (result.gstType === 'CGST+SGST') {
      lines.push(`CGST (${result.cgstPercentage}%): ${this.formatCurrency(result.cgstAmount)}`);
      lines.push(`SGST (${result.sgstPercentage}%): ${this.formatCurrency(result.sgstAmount)}`);
    } else if (result.gstType === 'IGST') {
      lines.push(`IGST (${result.igstPercentage}%): ${this.formatCurrency(result.igstAmount)}`);
    }
    
    lines.push(`Total GST: ${this.formatCurrency(result.totalGSTAmount)}`);
    lines.push(`Total Amount: ${this.formatCurrency(result.totalAfterGST)}`);
    
    return lines.join('\n');
  }
}
