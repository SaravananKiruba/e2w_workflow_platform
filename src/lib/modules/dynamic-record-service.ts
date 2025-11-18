import { prisma } from '@/lib/prisma';
import { AuditService } from '@/lib/audit/audit-service';

export class DynamicRecordService {
  // Create record with module-specific enhancements (auto-numbering, duplicate check, scoring, assignment)
  static async createRecord(
    tenantId: string,
    moduleName: string,
    data: Record<string, any>,
    userId: string
  ) {
    // Get module settings for dynamic behavior
    const moduleConfig = await prisma.moduleConfiguration.findFirst({
      where: { tenantId, moduleName, status: 'active' },
      orderBy: { version: 'desc' },
    });

    const settings = moduleConfig?.moduleSettings ? JSON.parse(moduleConfig.moduleSettings) : null;
    let enhancedData = { ...data };

    // 1. Auto-numbering (if enabled)
    if (settings?.autoNumbering?.enabled) {
      const numberField = moduleName === 'Leads' ? 'leadNumber' : 
                          moduleName === 'Clients' ? 'clientNumber' :
                          moduleName === 'Quotations' ? 'quotationNumber' :
                          moduleName === 'Orders' ? 'orderNumber' : 'number';
      
      if (!enhancedData[numberField]) {
        enhancedData[numberField] = await this.generateAutoNumber(tenantId, moduleName, settings.autoNumbering);
      }
    }

    // 2. Duplicate check (if enabled)
    if (settings?.duplicateCheck?.enabled) {
      const duplicateResult = await this.checkDuplicate(tenantId, moduleName, enhancedData, settings.duplicateCheck);
      if (duplicateResult.isDuplicate && settings.duplicateCheck.action === 'block') {
        throw new Error(`Duplicate found: ${duplicateResult.message}`);
      }
    }

    // 3. Lead scoring (if enabled and module is Leads)
    if (moduleName === 'Leads' && settings?.scoring?.enabled) {
      const scoreResult = await this.calculateScore(enhancedData, settings.scoring);
      enhancedData.leadScore = scoreResult.score;
      enhancedData.priority = scoreResult.priority;
    }

    // 4. Smart assignment (if enabled and module is Leads)
    if (moduleName === 'Leads' && settings?.assignment?.enabled && !enhancedData.assignedTo) {
      enhancedData.assignedTo = await this.assignLead(tenantId, settings.assignment, enhancedData);
      enhancedData.assignedBy = userId;
      enhancedData.assignedAt = new Date().toISOString();
    }

    const record = await prisma.dynamicRecord.create({
      data: {
        tenantId,
        moduleName,
        data: JSON.stringify(enhancedData),
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
      metadata: { data: enhancedData },
    });

    // Create initial activity (for Leads)
    if (moduleName === 'Leads') {
      await this.createActivity(tenantId, record.id, {
        activityType: 'created',
        title: 'Lead Created',
        description: `Lead ${enhancedData.name || enhancedData.leadNumber} was created`,
        createdBy: userId,
      });
    }

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

  // ============================================
  // MODULE-SPECIFIC ENHANCEMENTS (Dynamic via moduleSettings)
  // ============================================

  /**
   * Generate auto-number based on moduleSettings configuration
   */
  private static async generateAutoNumber(
    tenantId: string,
    moduleName: string,
    config: any
  ): Promise<string> {
    const { prefix, startFrom, padding, format } = config;

    // Get last record to determine next number
    const lastRecord = await prisma.dynamicRecord.findFirst({
      where: { tenantId, moduleName },
      orderBy: { createdAt: 'desc' },
    });

    let nextNumber = startFrom || 1000;

    if (lastRecord) {
      const data = JSON.parse(lastRecord.data);
      const numberField = Object.keys(data).find(k => k.includes('Number') || k.includes('number'));
      if (numberField && data[numberField]) {
        const match = data[numberField].match(/(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }
    }

    const paddedNumber = nextNumber.toString().padStart(padding || 5, '0');
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');

    return (format || '{prefix}-{number}')
      .replace('{prefix}', prefix || 'REC')
      .replace('{year}', year.toString())
      .replace('{month}', month)
      .replace('{number}', paddedNumber);
  }

  /**
   * Check for duplicates based on moduleSettings configuration
   */
  private static async checkDuplicate(
    tenantId: string,
    moduleName: string,
    data: Record<string, any>,
    config: any
  ): Promise<{ isDuplicate: boolean; message?: string; duplicates?: any[] }> {
    const { checkFields, matchCriteria } = config;

    const allRecords = await this.getRecords(tenantId, moduleName);

    const duplicates = allRecords.filter(record => {
      return checkFields.some((field: string) => {
        const value1 = data[field];
        const value2 = record[field];

        if (!value1 || !value2) return false;

        if (matchCriteria === 'exact') {
          return value1 === value2;
        } else if (matchCriteria === 'partial') {
          return String(value1).toLowerCase().includes(String(value2).toLowerCase()) ||
                 String(value2).toLowerCase().includes(String(value1).toLowerCase());
        }

        return false;
      });
    });

    return {
      isDuplicate: duplicates.length > 0,
      message: duplicates.length > 0 ? `Found ${duplicates.length} potential duplicate(s)` : undefined,
      duplicates,
    };
  }

  /**
   * Calculate lead score based on moduleSettings configuration
   */
  private static async calculateScore(
    data: Record<string, any>,
    config: any
  ): Promise<{ score: number; priority: string }> {
    const { criteria, thresholds } = config;
    let totalScore = 0;

    for (const criterion of criteria) {
      const { field, weights, ranges } = criterion;
      const value = data[field];

      if (weights && value) {
        totalScore += weights[value] || 0;
      }

      if (ranges && value) {
        const numValue = parseFloat(value);
        for (const range of ranges.sort((a: any, b: any) => b.min - a.min)) {
          if (numValue >= range.min) {
            totalScore += range.score;
            break;
          }
        }
      }
    }

    let priority = 'Cold';
    if (totalScore >= (thresholds.hot || 61)) {
      priority = 'Hot';
    } else if (totalScore >= (thresholds.warm || 31)) {
      priority = 'Warm';
    }

    return { score: totalScore, priority };
  }

  /**
   * Assign lead based on assignment rules
   */
  private static async assignLead(
    tenantId: string,
    config: any,
    data: Record<string, any>
  ): Promise<string | null> {
    const { defaultRule, roundRobinUsers } = config;

    if (defaultRule === 'round_robin' && roundRobinUsers?.length > 0) {
      // Get last assignment
      const lastLead = await prisma.dynamicRecord.findFirst({
        where: { tenantId, moduleName: 'Leads' },
        orderBy: { createdAt: 'desc' },
      });

      if (lastLead) {
        const lastData = JSON.parse(lastLead.data);
        const lastAssignee = lastData.assignedTo;
        const currentIndex = roundRobinUsers.indexOf(lastAssignee);
        const nextIndex = (currentIndex + 1) % roundRobinUsers.length;
        return roundRobinUsers[nextIndex];
      }

      return roundRobinUsers[0];
    }

    return null; // Manual assignment
  }

  /**
   * Create activity log for a lead
   */
  static async createActivity(
    tenantId: string,
    leadId: string,
    activity: {
      activityType: string;
      title: string;
      description?: string;
      createdBy?: string;
      metadata?: any;
    }
  ) {
    try {
      await prisma.leadActivity.create({
        data: {
          tenantId,
          leadId,
          ...activity,
          metadata: activity.metadata ? JSON.stringify(activity.metadata) : null,
        },
      });
    } catch (error) {
      console.error('Error creating activity:', error);
    }
  }

  /**
   * Create note for a lead
   */
  static async createNote(
    tenantId: string,
    leadId: string,
    note: {
      content: string;
      isPinned?: boolean;
      mentions?: string[];
      createdBy?: string;
    }
  ) {
    const leadNote = await prisma.leadNote.create({
      data: {
        tenantId,
        leadId,
        content: note.content,
        isPinned: note.isPinned || false,
        mentions: note.mentions ? JSON.stringify(note.mentions) : null,
        createdBy: note.createdBy,
      },
    });

    // Log activity
    await this.createActivity(tenantId, leadId, {
      activityType: 'note',
      title: 'Note Added',
      description: note.content.substring(0, 100),
      createdBy: note.createdBy,
    });

    return leadNote;
  }

  /**
   * Create task for a lead
   */
  static async createTask(
    tenantId: string,
    leadId: string,
    task: {
      title: string;
      description?: string;
      taskType: string;
      dueDate: Date;
      dueTime?: string;
      priority?: string;
      assignedTo?: string;
      createdBy?: string;
    }
  ) {
    const leadTask = await prisma.leadTask.create({
      data: {
        tenantId,
        leadId,
        ...task,
        dueTime: task.dueTime || '00:00:00',
        priority: task.priority || 'medium',
        reminder: true,
      },
    });

    // Log activity
    await this.createActivity(tenantId, leadId, {
      activityType: 'task_created',
      title: 'Task Created',
      description: `Task: ${task.title}`,
      createdBy: task.createdBy,
    });

    return leadTask;
  }

  /**
   * Get records with role-based visibility filtering
   */
  static async getRecordsWithVisibility(
    tenantId: string,
    moduleName: string,
    userId: string,
    userRole: string,
    options?: any
  ) {
    // Get module settings for visibility rules
    const moduleConfig = await prisma.moduleConfiguration.findFirst({
      where: { tenantId, moduleName, status: 'active' },
      orderBy: { version: 'desc' },
    });

    const settings = moduleConfig?.moduleSettings ? JSON.parse(moduleConfig.moduleSettings) : null;
    let records = await this.getRecordsWithFilters(tenantId, moduleName, options);

    // Apply visibility rules for Leads module
    if (moduleName === 'Leads' && settings?.assignment?.enabled) {
      const visibilityRule = settings.assignment.visibilityRules?.[userRole];

      if (visibilityRule === 'assigned_only') {
        records.data = records.data.filter(record => record.assignedTo === userId);
      } else if (visibilityRule === 'team_and_own') {
        // Get team members
        const teamMembers = await prisma.user.findMany({
          where: { tenantId, role: 'staff' },
          select: { id: true },
        });
        const teamIds = teamMembers.map(m => m.id);
        records.data = records.data.filter(record => 
          record.assignedTo === userId || teamIds.includes(record.assignedTo)
        );
      }
      // 'all' - no filtering
    }

    return records;
  }

  // ============================================
  // GENERIC RECORD FEATURES (ANY MODULE)
  // ============================================

  /**
   * Create activity for any module record
   */
  static async createRecordActivity(
    tenantId: string,
    moduleName: string,
    recordId: string,
    data: {
      activityType: string;
      title: string;
      description?: string;
      metadata?: any;
      createdBy?: string;
    }
  ) {
    return await prisma.recordActivity.create({
      data: {
        tenantId,
        moduleName,
        recordId,
        activityType: data.activityType,
        title: data.title,
        description: data.description,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        createdBy: data.createdBy,
      },
    });
  }

  /**
   * Get activities for any module record
   */
  static async getRecordActivities(
    tenantId: string,
    moduleName: string,
    recordId: string
  ) {
    return await prisma.recordActivity.findMany({
      where: { tenantId, moduleName, recordId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create note for any module record
   */
  static async createRecordNote(
    tenantId: string,
    moduleName: string,
    recordId: string,
    data: {
      content: string;
      isPinned?: boolean;
      mentions?: string[];
      createdBy?: string;
    }
  ) {
    return await prisma.recordNote.create({
      data: {
        tenantId,
        moduleName,
        recordId,
        content: data.content,
        isPinned: data.isPinned || false,
        mentions: data.mentions ? JSON.stringify(data.mentions) : null,
        createdBy: data.createdBy,
      },
    });
  }

  /**
   * Get notes for any module record
   */
  static async getRecordNotes(
    tenantId: string,
    moduleName: string,
    recordId: string
  ) {
    return await prisma.recordNote.findMany({
      where: { tenantId, moduleName, recordId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create task for any module record
   */
  static async createRecordTask(
    tenantId: string,
    moduleName: string,
    recordId: string,
    data: {
      title: string;
      description?: string;
      taskType?: string;
      dueDate?: Date;
      dueTime?: string;
      priority?: string;
      assignedTo?: string;
      createdBy?: string;
    }
  ) {
    return await prisma.recordTask.create({
      data: {
        tenantId,
        moduleName,
        recordId,
        title: data.title,
        description: data.description,
        taskType: data.taskType,
        dueDate: data.dueDate,
        dueTime: data.dueTime,
        priority: data.priority || 'medium',
        assignedTo: data.assignedTo,
        createdBy: data.createdBy,
        status: 'pending',
      },
    });
  }

  /**
   * Get tasks for any module record
   */
  static async getRecordTasks(
    tenantId: string,
    moduleName: string,
    recordId: string,
    filters?: { status?: string; assignedTo?: string }
  ) {
    const where: any = { tenantId, moduleName, recordId };
    if (filters?.status) where.status = filters.status;
    if (filters?.assignedTo) where.assignedTo = filters.assignedTo;

    return await prisma.recordTask.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Update task status
   */
  static async updateRecordTaskStatus(
    tenantId: string,
    taskId: string,
    status: string,
    userId: string
  ) {
    return await prisma.recordTask.update({
      where: { id: taskId },
      data: {
        status,
        completedAt: status === 'completed' ? new Date() : null,
        completedBy: status === 'completed' ? userId : null,
      },
    });
  }

  /**
   * Get all pending tasks for a user (My To-Do dashboard)
   */
  static async getMyTasks(
    tenantId: string,
    userId: string,
    options?: { includeOverdue?: boolean; limit?: number }
  ) {
    const where: any = {
      tenantId,
      assignedTo: userId,
      status: { in: ['pending', 'overdue'] },
    };

    const tasks = await prisma.recordTask.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
      take: options?.limit || 50,
    });

    // Auto-mark overdue tasks
    const now = new Date();
    for (const task of tasks) {
      if (task.dueDate && task.dueDate < now && task.status === 'pending') {
        await prisma.recordTask.update({
          where: { id: task.id },
          data: { status: 'overdue' },
        });
      }
    }

    return tasks;
  }
}
