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
    const existing = await this.getRecord(tenantId, moduleName, recordId);
    
    const updated = await prisma.dynamicRecord.update({
      where: { id: recordId },
      data: {
        data: JSON.stringify(data),
        updatedBy: userId,
      },
    });

    // Audit log with changes
    if (existing) {
      const changes = AuditService.createChangeDiff(existing, data);
      await AuditService.log({
        tenantId,
        userId,
        action: 'update',
        entity: moduleName,
        entityId: recordId,
        changes,
      });
    }

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
}
