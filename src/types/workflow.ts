export interface WorkflowTrigger {
  type: 'onCreate' | 'onUpdate' | 'onDelete' | 'onStatusChange' | 'onFieldChange' | 'scheduled';
  field?: string; // For onFieldChange
  schedule?: string; // For scheduled triggers (cron expression)
}

export interface WorkflowCondition {
  operator: 'AND' | 'OR';
  rules: WorkflowRule[];
}

export interface WorkflowRule {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'in' | 'notIn';
  value: any;
}

export interface WorkflowAction {
  type: 'sendEmail' | 'updateRecord' | 'createRecord' | 'webhook' | 'notification';
  config: Record<string, any>;
}

export interface Workflow {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  moduleName: string;
  trigger: WorkflowTrigger;
  conditions?: WorkflowCondition;
  actions: WorkflowAction[];
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  recordId: string;
  status: 'success' | 'failed' | 'running';
  input?: any;
  output?: any;
  error?: string;
  executedAt: Date;
  completedAt?: Date;
}
