import { prisma } from '@/lib/prisma';
import { Workflow, WorkflowCondition, WorkflowAction } from '@/types/workflow';

export class WorkflowEngine {
  // Evaluate if conditions are met
  static evaluateConditions(
    conditions: WorkflowCondition | undefined,
    recordData: Record<string, any>
  ): boolean {
    if (!conditions) return true;

    const { operator, rules } = conditions;

    const results = rules.map(rule => {
      const fieldValue = recordData[rule.field];
      
      switch (rule.operator) {
        case 'equals':
          return fieldValue === rule.value;
        case 'notEquals':
          return fieldValue !== rule.value;
        case 'contains':
          return String(fieldValue).includes(String(rule.value));
        case 'greaterThan':
          return Number(fieldValue) > Number(rule.value);
        case 'lessThan':
          return Number(fieldValue) < Number(rule.value);
        case 'in':
          return Array.isArray(rule.value) && rule.value.includes(fieldValue);
        case 'notIn':
          return Array.isArray(rule.value) && !rule.value.includes(fieldValue);
        default:
          return false;
      }
    });

    return operator === 'AND'
      ? results.every(r => r)
      : results.some(r => r);
  }

  // Execute workflow actions
  static async executeActions(
    actions: WorkflowAction[],
    context: {
      recordId: string;
      recordData: Record<string, any>;
      moduleName: string;
      tenantId: string;
    }
  ): Promise<any[]> {
    const results = [];

    for (const action of actions) {
      try {
        switch (action.type) {
          case 'sendEmail':
            results.push(await this.sendEmail(action.config, context));
            break;
          case 'updateRecord':
            results.push(await this.updateRecord(action.config, context));
            break;
          case 'createRecord':
            results.push(await this.createRecord(action.config, context));
            break;
          case 'notification':
            results.push(await this.sendNotification(action.config, context));
            break;
          case 'webhook':
            results.push(await this.callWebhook(action.config, context));
            break;
          default:
            results.push({ error: `Unknown action type: ${action.type}` });
        }
      } catch (error: any) {
        results.push({ error: error.message });
      }
    }

    return results;
  }

  private static async sendEmail(config: any, context: any) {
    console.log('Sending email:', config);
    return { success: true, action: 'sendEmail', to: config.to };
  }

  private static async updateRecord(config: any, context: any) {
    const updates = config.fields || {};
    
    await prisma.dynamicRecord.update({
      where: { id: context.recordId },
      data: {
        data: JSON.stringify({
          ...context.recordData,
          ...updates,
        }),
      },
    });

    return { success: true, action: 'updateRecord', updates };
  }

  private static async createRecord(config: any, context: any) {
    const newRecord = await prisma.dynamicRecord.create({
      data: {
        tenantId: context.tenantId,
        moduleName: config.moduleName,
        data: JSON.stringify(config.data),
        status: 'active',
      },
    });

    return { success: true, action: 'createRecord', recordId: newRecord.id };
  }

  private static async sendNotification(config: any, context: any) {
    console.log('Sending notification:', config);
    return { success: true, action: 'notification', message: config.message };
  }

  private static async callWebhook(config: any, context: any) {
    const response = await fetch(config.url, {
      method: config.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: JSON.stringify({
        ...context.recordData,
        recordId: context.recordId,
      }),
    });

    return { success: response.ok, action: 'webhook', status: response.status };
  }

  // Execute workflow
  static async executeWorkflow(
    workflowId: string,
    recordId: string,
    recordData: Record<string, any>,
    tenantId: string,
    moduleName: string
  ) {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow || !workflow.isActive) {
      throw new Error('Workflow not found or inactive');
    }

    const conditions = workflow.conditions ? JSON.parse(workflow.conditions) : undefined;
    const actions = JSON.parse(workflow.actions);

    // Check conditions
    if (!this.evaluateConditions(conditions, recordData)) {
      return { skipped: true, reason: 'Conditions not met' };
    }

    // Execute actions
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId,
        recordId,
        status: 'running',
        input: JSON.stringify(recordData),
      },
    });

    try {
      const results = await this.executeActions(actions, {
        recordId,
        recordData,
        moduleName,
        tenantId,
      });

      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'success',
          output: JSON.stringify(results),
          completedAt: new Date(),
        },
      });

      return { success: true, results };
    } catch (error: any) {
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          error: error.message,
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  // Trigger workflows for a module event
  static async triggerWorkflows(
    tenantId: string,
    moduleName: string,
    triggerType: string,
    recordId: string,
    recordData: Record<string, any>
  ) {
    const workflows = await prisma.workflow.findMany({
      where: {
        tenantId,
        moduleName,
        isActive: true,
      },
      orderBy: { priority: 'desc' },
    });

    const results = [];

    for (const workflow of workflows) {
      const trigger = JSON.parse(workflow.trigger);
      
      if (trigger.type === triggerType) {
        try {
          const result = await this.executeWorkflow(
            workflow.id,
            recordId,
            recordData,
            tenantId,
            moduleName
          );
          results.push({ workflowId: workflow.id, ...result });
        } catch (error: any) {
          results.push({ workflowId: workflow.id, error: error.message });
        }
      }
    }

    return results;
  }
}
