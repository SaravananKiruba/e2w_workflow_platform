import { NextRequest, NextResponse } from 'next/server';
import { MetadataService } from '@/lib/metadata/metadata-service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  try {
    if (category) {
      const items = await MetadataService.getLibraryByCategory(category);
      return NextResponse.json({ items });
    }

    // Return all categories
    const [fieldTypes, uiComponents, validationTypes, layoutTemplates] = await Promise.all([
      MetadataService.getFieldTypes(),
      MetadataService.getUIComponents(),
      MetadataService.getValidationTypes(),
      MetadataService.getLayoutTemplates(),
    ]);

    return NextResponse.json({
      fieldTypes,
      uiComponents,
      validationTypes,
      layoutTemplates,
    });
  } catch (error) {
    console.error('Error fetching metadata library:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
