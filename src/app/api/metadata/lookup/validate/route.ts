import { NextRequest, NextResponse } from 'next/server';
import { LookupService } from '@/lib/metadata/lookup-service';
import { getTenantContext, validateTenantAccess } from '@/lib/tenant-context';

/**
 * POST /api/metadata/lookup/validate
 * Validate that a lookup reference exists and is valid
 * 
 * Request body:
 * {
 *   recordId: string,
 *   targetModule: string,
 *   tenantId: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const context = await getTenantContext();
    const body = await request.json();

    const { recordId, targetModule, tenantId } = body;

    // Validate access
    if (!validateTenantAccess(context, tenantId)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Validate inputs
    if (!recordId || !targetModule) {
      return NextResponse.json(
        { error: 'Missing required fields: recordId, targetModule' },
        { status: 400 }
      );
    }

    // Validate reference
    const isValid = await LookupService.validateLookupReference(
      tenantId,
      targetModule,
      recordId
    );

    return NextResponse.json({ valid: isValid });
  } catch (error) {
    console.error('Error validating lookup reference:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Validation failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/metadata/lookup/record
 * Get full details of a referenced record for cascading population
 * 
 * Query params:
 * - tenantId: Tenant identifier
 * - recordId: ID of record to fetch
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getTenantContext();
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get('tenantId');
    const recordId = searchParams.get('recordId');

    // Validate access
    if (!tenantId || !validateTenantAccess(context, tenantId)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (!recordId) {
      return NextResponse.json(
        { error: 'Missing required parameter: recordId' },
        { status: 400 }
      );
    }

    // Get record details
    const record = await LookupService.getRecordDetails(tenantId, recordId);

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error fetching record details:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch record' },
      { status: 500 }
    );
  }
}
