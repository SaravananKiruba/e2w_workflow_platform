import { prisma } from '@/lib/prisma';

/**
 * Auto-Numbering Service
 * 
 * Generates unique, configurable numbers for records:
 * - QT-00001, QT-00002 (Quotations)
 * - ORD-00001, ORD-00002 (Orders)
 * - INV/2025/001 (Invoices with year)
 * - TXN-00001, TXN-00002 (Transactions)
 * 
 * Thread-safe with database locking to prevent duplicates
 */
export class AutoNumberingService {
  /**
   * Initialize or get auto-numbering sequence for a module
   * Creates sequence if it doesn't exist
   */
  static async initializeSequence(
    tenantId: string,
    moduleName: string,
    prefix: string = moduleName.substring(0, 3).toUpperCase(),
    format: string = '{prefix}-{padded:5}'
  ) {
    try {
      const sequence = await prisma.autoNumberSequence.upsert({
        where: {
          tenantId_moduleName: { tenantId, moduleName },
        },
        update: {},
        create: {
          tenantId,
          moduleName,
          prefix,
          format,
          nextNumber: 1,
        },
      });

      return sequence;
    } catch (error) {
      console.error('Error initializing auto-numbering sequence:', error);
      throw error;
    }
  }

  /**
   * Generate next auto-number for a module
   * Thread-safe: uses database locking to prevent duplicates
   */
  static async generateNumber(tenantId: string, moduleName: string): Promise<string> {
    try {
      // Ensure sequence exists
      const sequence = await this.initializeSequence(tenantId, moduleName);

      // Increment and get the number (atomic operation)
      const updated = await prisma.autoNumberSequence.update({
        where: {
          tenantId_moduleName: { tenantId, moduleName },
        },
        data: {
          nextNumber: {
            increment: 1,
          },
        },
      });

      // Format the number
      return this.formatNumber(updated);
    } catch (error) {
      console.error('Error generating auto-number:', error);
      throw error;
    }
  }

  /**
   * Format the number according to template
   * Supports: {prefix}, {padded:N}, {year}, {month}, {day}
   */
  static formatNumber(sequence: {
    prefix: string;
    format: string;
    nextNumber: number;
  }): string {
    let formatted = sequence.format;

    // Replace placeholders
    formatted = formatted.replace('{prefix}', sequence.prefix);

    // Padded number (e.g., {padded:5} → 00001)
    const paddedMatch = formatted.match(/\{padded:(\d+)\}/);
    if (paddedMatch) {
      const length = parseInt(paddedMatch[1], 10);
      const padded = String(sequence.nextNumber).padStart(length, '0');
      formatted = formatted.replace(paddedMatch[0], padded);
    }

    // Date placeholders
    const now = new Date();
    formatted = formatted.replace('{year}', String(now.getFullYear()));
    formatted = formatted.replace('{month}', String(now.getMonth() + 1).padStart(2, '0'));
    formatted = formatted.replace('{day}', String(now.getDate()).padStart(2, '0'));

    return formatted;
  }

  /**
   * Get current sequence for a module
   */
  static async getSequence(tenantId: string, moduleName: string) {
    try {
      const sequence = await prisma.autoNumberSequence.findUnique({
        where: {
          tenantId_moduleName: { tenantId, moduleName },
        },
      });

      return sequence;
    } catch (error) {
      console.error('Error fetching sequence:', error);
      throw error;
    }
  }

  /**
   * Update sequence configuration
   * Allows tenant admin to change prefix/format
   */
  static async updateSequenceConfig(
    tenantId: string,
    moduleName: string,
    prefix?: string,
    format?: string
  ) {
    try {
      const data: any = {};
      if (prefix) data.prefix = prefix;
      if (format) data.format = format;

      const updated = await prisma.autoNumberSequence.update({
        where: {
          tenantId_moduleName: { tenantId, moduleName },
        },
        data,
      });

      return updated;
    } catch (error) {
      console.error('Error updating sequence config:', error);
      throw error;
    }
  }

  /**
   * Reset sequence to specific number
   * WARNING: Use with caution - can cause duplicate numbers if used incorrectly
   */
  static async resetSequence(
    tenantId: string,
    moduleName: string,
    startNumber: number = 1
  ) {
    try {
      const updated = await prisma.autoNumberSequence.update({
        where: {
          tenantId_moduleName: { tenantId, moduleName },
        },
        data: {
          nextNumber: startNumber,
        },
      });

      return updated;
    } catch (error) {
      console.error('Error resetting sequence:', error);
      throw error;
    }
  }

  /**
   * Get statistics for all sequences in a tenant
   */
  static async getTenantSequenceStats(tenantId: string) {
    try {
      const sequences = await prisma.autoNumberSequence.findMany({
        where: { tenantId },
        orderBy: { moduleName: 'asc' },
      });

      return sequences.map((seq: typeof sequences[0]) => ({
        moduleName: seq.moduleName,
        prefix: seq.prefix,
        format: seq.format,
        nextNumber: seq.nextNumber,
        preview: this.formatNumber(seq),
      }));
    } catch (error) {
      console.error('Error fetching sequence stats:', error);
      throw error;
    }
  }

  /**
   * Predefined format templates
   */
  static readonly FORMATS = {
    SIMPLE: '{prefix}-{padded:5}',
    // QT-00001, ORD-00001, INV-00001
    YEAR_BASED: '{prefix}/{year}/{padded:3}',
    // QT/2025/001, INV/2025/001
    YEAR_MONTH: '{prefix}/{year}/{month}/{padded:2}',
    // QT/2025/11/01
    YEAR_SEQUENCE: '{prefix}{year}{padded:4}',
    // QT202500001
  };

  /**
   * Default prefixes for modules
   */
  static readonly DEFAULT_PREFIXES: Record<string, string> = {
    Leads: 'LD',
    Clients: 'CL',
    Quotations: 'QT',
    Orders: 'ORD',
    Invoices: 'INV',
    Payments: 'TXN',
    Finance: 'FIN',
  };

  /**
   * Get recommended format for a module
   */
  static getRecommendedFormat(moduleName: string): string {
    // Invoices use year-based format, others use simple format
    if (moduleName === 'Invoices') {
      return this.FORMATS.YEAR_BASED;
    }
    return this.FORMATS.SIMPLE;
  }
}
