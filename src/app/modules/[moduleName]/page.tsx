/**
 * Module Page - Using Unified Component
 * 
 * This page now delegates to UnifiedModulePage which handles:
 * - List view (default)
 * - Create new (?mode=new)
 * - Edit record (?mode=edit&id=xxx)
 * - Analytics sidebar
 * 
 * EPIC 2.1: Simplified Module Pages
 * EPIC 3.1: In-Module Analytics
 */

'use client';

import UnifiedModulePage from '@/components/modules/UnifiedModulePage';

export default function ModulePage() {
  return <UnifiedModulePage />;
}
