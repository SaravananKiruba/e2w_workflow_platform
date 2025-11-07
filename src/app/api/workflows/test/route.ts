import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant-context';
import { prisma } from '@/lib/prisma';
import { WorkflowEngine } from '@/lib/workflow/workflow-engine';

export async function POST(req: NextRequest) {
  const context = await getTenantContext();
  
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { workflowId, testData } = await req.json();

    if (!workflowId || !testData) {
      return NextResponse.json(
        { error: 'workflowId and testData are required' },
        { status: 400 }
      );
    }

    // Fetch workflow
    const workflow = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        tenantId: context.tenantId,
      },
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Parse workflow configuration
    const trigger = typeof workflow.trigger === 'string'
      ? JSON.parse(workflow.trigger)
      : workflow.trigger;

    const conditions = workflow.conditions
      ? typeof workflow.conditions === 'string'
        ? JSON.parse(workflow.conditions)
        : workflow.conditions
      : undefined;

    const actions = typeof workflow.actions === 'string'
      ? JSON.parse(workflow.actions)
      : workflow.actions;

    // Simulate trigger matching (in real scenario, this would be based on actual event)
    const triggerMatched = true;
    const triggerDetails = `Trigger type: ${trigger.type}${
      trigger.field ? ` on field: ${trigger.field}` : ''
    }`;

    // Evaluate conditions
    let conditionsResult = true;
    let conditionsDetails = 'No conditions defined';

    if (conditions) {
      conditionsResult = WorkflowEngine.evaluateConditions(conditions, testData);
      conditionsDetails = `Evaluated ${conditions.rules.length} rule(s) with ${conditions.operator} logic: ${
        conditionsResult ? 'All conditions passed' : 'Conditions failed'
      }`;
    }

    // Execute actions only if trigger matched and conditions passed
    let actionsResult: any[] = [];
    
    if (triggerMatched && conditionsResult) {
      actionsResult = await WorkflowEngine.executeActions(actions, {
        recordId: 'test-record-id',
        recordData: testData,
        moduleName: workflow.moduleName,
        tenantId: context.tenantId,
      });
    }

    // Format response
    const testResult = {
      success: triggerMatched && conditionsResult && actionsResult.every((a) => !a.error),
      message: triggerMatched && conditionsResult
        ? 'Workflow executed successfully'
        : 'Workflow did not execute',
      triggerMatched,
      triggerDetails,
      conditionsResult,
      conditionsDetails,
      actions: actionsResult.map((result, idx) => ({
        type: actions[idx].type,
        success: !result.error,
        result: result.error ? undefined : result,
        error: result.error,
      })),
      executedAt: new Date().toISOString(),
    };

    // Log test execution
    await prisma.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        recordId: 'test-record-id',
        status: testResult.success ? 'success' : 'failed',
        input: JSON.stringify(testData),
        output: JSON.stringify(testResult),
        error: testResult.success ? null : 'Test execution',
        completedAt: new Date(),
      },
    });

    return NextResponse.json(testResult);
  } catch (error: any) {
    console.error('Error testing workflow:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: 'Test execution failed',
      },
      { status: 500 }
    );
  }
}
