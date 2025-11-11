import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant-context'
import { PurchaseFlowExtensions } from '@/lib/modules/purchase-flow-extensions'

/**
 * POST /api/conversions/pr-to-po
 * 
 * Convert an approved Purchase Request to a Purchase Order
 * 
 * Uses the dynamic DynamicRecord system - no hardcoded tables.
 * 
 * Body: {
 *   prId: string,            // ID of the PR to convert
 *   vendorId: string,        // Selected vendor
 *   notes?: string,          // Optional PO notes
 *   deliveryDate?: string,   // Expected delivery date
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate & get tenant context
    const context = await getTenantContext()
    if (!context) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse request body
    const body = await req.json()
    const { prId, vendorId, deliveryDate, shippingAddress, billingAddress, paymentTerms } = body

    if (!prId || !vendorId) {
      return NextResponse.json(
        { error: 'Missing required fields: prId, vendorId' },
        { status: 400 }
      )
    }

    // 3. Convert PR to PO using the dynamic helper
    const po = await PurchaseFlowExtensions.convertPRtoPO(
      context.tenantId,
      prId,
      vendorId,
      context.userId,
      {
        deliveryDate,
        shippingAddress,
        billingAddress,
        paymentTerms,
      }
    )

    // 4. Return the created PO (po.data is JSON string)
    const poData = typeof po.data === 'string' ? JSON.parse(po.data) : po.data
    
    return NextResponse.json({
      success: true,
      message: `Purchase Order ${poData.poNumber || po.id} created successfully`,
      data: po,
    })
  } catch (error: any) {
    console.error('PR to PO conversion error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to convert PR to PO' },
      { status: 500 }
    )
  }
}
