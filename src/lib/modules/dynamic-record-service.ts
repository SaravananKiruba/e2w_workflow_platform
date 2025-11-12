import { prisma } from '@/lib/prisma';
import { AuditService } from '@/lib/audit/audit-service';

export class DynamicRecordService {
  // Create record
  static async createRecord(
    tenantId: string,
    moduleName: string,
    data: Record<string, any>,
    userId: string
  ) {
    const record = await prisma.dynamicRecord.create({
      data: {
        tenantId,
        moduleName,
        data: JSON.stringify(data),
        status: 'active',
        createdBy: userId,
        updatedBy: userId,
      },
    });

    // Audit log
    await AuditService.log({
      tenantId,
      userId,
      action: 'create',
      entity: moduleName,
      entityId: record.id,
      metadata: { data },
    });

    return record;
  }

  // Get all records for a module
  static async getRecords(tenantId: string, moduleName: string, filters?: Record<string, any>) {
    const records = await prisma.dynamicRecord.findMany({
      where: {
        tenantId,
        moduleName,
        status: 'active',
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(record => ({
      id: record.id,
      ...JSON.parse(record.data),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));
  }

  // Get single record
  static async getRecord(tenantId: string, moduleName: string, recordId: string) {
    const record = await prisma.dynamicRecord.findFirst({
      where: {
        id: recordId,
        tenantId,
        moduleName,
        status: 'active',
      },
    });

    if (!record) return null;

    return {
      id: record.id,
      ...JSON.parse(record.data),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  // Update record
  static async updateRecord(
    tenantId: string,
    moduleName: string,
    recordId: string,
    data: Record<string, any>,
    userId: string
  ) {
    // Get existing record to merge data
    const existingRecord = await prisma.dynamicRecord.findFirst({
      where: {
        id: recordId,
        tenantId,
        moduleName,
        status: 'active',
      },
    });

    if (!existingRecord) {
      throw new Error('Record not found');
    }

    const existingData = JSON.parse(existingRecord.data);
    const mergedData = { ...existingData, ...data };
    
    const updated = await prisma.dynamicRecord.update({
      where: { id: recordId },
      data: {
        data: JSON.stringify(mergedData),
        updatedBy: userId,
      },
    });

    // Audit log with changes
    const changes = AuditService.createChangeDiff(existingData, mergedData);
    await AuditService.log({
      tenantId,
      userId,
      action: 'update',
      entity: moduleName,
      entityId: recordId,
      changes,
    });

    return updated;
  }

  // Delete record (soft delete)
  static async deleteRecord(tenantId: string, moduleName: string, recordId: string, userId?: string) {
    const deleted = await prisma.dynamicRecord.update({
      where: { id: recordId },
      data: {
        status: 'deleted',
      },
    });

    // Audit log
    if (userId) {
      await AuditService.log({
        tenantId,
        userId,
        action: 'delete',
        entity: moduleName,
        entityId: recordId,
      });
    }

    return deleted;
  }

  // Search records
  static async searchRecords(
    tenantId: string,
    moduleName: string,
    searchTerm: string,
    searchFields: string[]
  ) {
    const records = await this.getRecords(tenantId, moduleName);
    
    return records.filter(record => {
      return searchFields.some(field => {
        const value = record[field];
        if (!value) return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }

  // Week 1-2: Advanced filter processing
  static async getRecordsWithFilters(
    tenantId: string,
    moduleName: string,
    options?: {
      filters?: any[];
      search?: string;
      searchFields?: string[];
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      pageSize?: number;
    }
  ) {
    const { filters = [], search, searchFields = [], sortBy, sortOrder = 'desc', page = 1, pageSize = 50 } = options || {};

    // Get all records first
    let records = await this.getRecords(tenantId, moduleName);

    // Apply search filter
    if (search && searchFields.length > 0) {
      records = records.filter(record => {
        return searchFields.some(field => {
          const value = record[field];
          if (!value) return false;
          return String(value).toLowerCase().includes(search.toLowerCase());
        });
      });
    }

    // Apply advanced filters
    if (filters.length > 0) {
      records = records.filter(record => {
        return this.applyFilters(record, filters);
      });
    }

    // Apply sorting
    if (sortBy) {
      records.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        
        if (aVal === undefined || bVal === undefined) return 0;
        
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    // Calculate pagination
    const total = records.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const paginatedRecords = records.slice(start, start + pageSize);

    return {
      data: paginatedRecords,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  // Build filter query logic
  private static applyFilters(record: any, filters: any[]): boolean {
    return filters.every(filter => {
      const { field, operator, value, logicOperator = 'AND' } = filter;
      const recordValue = record[field];

      switch (operator) {
        case 'equals':
          return recordValue === value;
        
        case 'notEquals':
          return recordValue !== value;
        
        case 'contains':
          return recordValue && String(recordValue).toLowerCase().includes(String(value).toLowerCase());
        
        case 'notContains':
          return !recordValue || !String(recordValue).toLowerCase().includes(String(value).toLowerCase());
        
        case 'startsWith':
          return recordValue && String(recordValue).toLowerCase().startsWith(String(value).toLowerCase());
        
        case 'endsWith':
          return recordValue && String(recordValue).toLowerCase().endsWith(String(value).toLowerCase());
        
        case 'greaterThan':
          return Number(recordValue) > Number(value);
        
        case 'greaterThanOrEqual':
          return Number(recordValue) >= Number(value);
        
        case 'lessThan':
          return Number(recordValue) < Number(value);
        
        case 'lessThanOrEqual':
          return Number(recordValue) <= Number(value);
        
        case 'between':
          const [min, max] = value;
          return Number(recordValue) >= Number(min) && Number(recordValue) <= Number(max);
        
        case 'in':
          return Array.isArray(value) && value.includes(recordValue);
        
        case 'notIn':
          return Array.isArray(value) && !value.includes(recordValue);
        
        case 'isNull':
          return recordValue === null || recordValue === undefined;
        
        case 'isNotNull':
          return recordValue !== null && recordValue !== undefined;
        
        case 'isEmpty':
          return !recordValue || String(recordValue).trim() === '';
        
        case 'isNotEmpty':
          return recordValue && String(recordValue).trim() !== '';
        
        // Date filters
        case 'dateBefore':
          return new Date(recordValue) < new Date(value);
        
        case 'dateAfter':
          return new Date(recordValue) > new Date(value);
        
        case 'dateBetween':
          const [startDate, endDate] = value;
          const recordDate = new Date(recordValue);
          return recordDate >= new Date(startDate) && recordDate <= new Date(endDate);
        
        default:
          return true;
      }
    });
  }
}
