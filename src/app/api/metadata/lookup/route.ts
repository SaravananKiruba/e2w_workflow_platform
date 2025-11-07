import { NextRequest, NextResponse } from 'next/server';
import { LookupService } from '@/lib/metadata/lookup-service';
import { getTenantContext } from '@/lib/tenant-context';

/**
 * GET /api/metadata/lookup
 * Fetch lookup field options for cascading dropdowns
 * 
 * Query params:
 * - tenantId: Tenant identifier
 * - targetModule: Module to fetch records from
 * - searchTerm: Optional search term for filtering
 * - displayField: Field to display in dropdown
 * - searchFields: Comma-separated fields to search in
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get('tenantId');
    const targetModule = searchParams.get('targetModule');
    const searchTerm = searchParams.get('searchTerm');
    const displayField = searchParams.get('displayField');
    const searchFieldsParam = searchParams.get('searchFields');
    
    const searchFields = searchFieldsParam?.split(',') || ['name'];

    console.log('[Lookup API] Request:', { tenantId, targetModule, displayField, searchFields });

    // Validate inputs
    if (!tenantId || !targetModule) {
      return NextResponse.json(
        { error: 'Missing required parameters: tenantId, targetModule' },
        { status: 400 }
      );
    }

    // Fetch lookup options
    const options = searchTerm
      ? await LookupService.searchLookupOptions(
          tenantId,
          targetModule,
          searchTerm,
          displayField || 'name',
          searchFields
        )
      : await LookupService.getLookupOptions(
          tenantId,
          targetModule,
          undefined,
          displayField || 'name',
          searchFields
        );

    console.log('[Lookup API] Returning', options.length, 'options');
    return NextResponse.json(options);
  } catch (error) {
    console.error('Error fetching lookup options:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch lookup options' },
      { status: 500 }
    );
  }
}
