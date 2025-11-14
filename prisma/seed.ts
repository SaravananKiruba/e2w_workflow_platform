import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create metadata library entries
  const fieldTypes = [
    { category: 'field_types', name: 'text', label: 'Text', description: 'Single line text input', config: JSON.stringify({ maxLength: 255 }) },
    { category: 'field_types', name: 'textarea', label: 'Text Area', description: 'Multi-line text input', config: JSON.stringify({ maxLength: 5000 }) },
    { category: 'field_types', name: 'number', label: 'Number', description: 'Numeric input', config: JSON.stringify({ min: null, max: null }) },
    { category: 'field_types', name: 'currency', label: 'Currency', description: 'Currency amount', config: JSON.stringify({ currency: 'INR', decimals: 2 }) },
    { category: 'field_types', name: 'date', label: 'Date', description: 'Date picker', config: JSON.stringify({}) },
    { category: 'field_types', name: 'datetime', label: 'Date Time', description: 'Date and time picker', config: JSON.stringify({}) },
    { category: 'field_types', name: 'email', label: 'Email', description: 'Email address', config: JSON.stringify({}) },
    { category: 'field_types', name: 'phone', label: 'Phone', description: 'Phone number', config: JSON.stringify({}) },
    { category: 'field_types', name: 'url', label: 'URL', description: 'Website URL', config: JSON.stringify({}) },
    { category: 'field_types', name: 'dropdown', label: 'Dropdown', description: 'Select from list', config: JSON.stringify({ options: [] }) },
    { category: 'field_types', name: 'multiselect', label: 'Multi Select', description: 'Select multiple from list', config: JSON.stringify({ options: [] }) },
    { category: 'field_types', name: 'checkbox', label: 'Checkbox', description: 'True/false value', config: JSON.stringify({}) },
    { category: 'field_types', name: 'radio', label: 'Radio Button', description: 'Select one option', config: JSON.stringify({ options: [] }) },
    { category: 'field_types', name: 'file', label: 'File Upload', description: 'File attachment', config: JSON.stringify({ maxSize: 10485760, accept: '*' }) },
    { category: 'field_types', name: 'formula', label: 'Formula', description: 'Calculated field', config: JSON.stringify({ expression: '' }) },
    { category: 'field_types', name: 'lookup', label: 'Lookup/Reference', description: 'Link to records in another module', config: JSON.stringify({ targetModule: '', displayField: '', searchFields: [] }) },
    { category: 'field_types', name: 'table', label: 'Table/Line Items', description: 'Nested table with multiple rows', config: JSON.stringify({ columns: [], allowAdd: true, allowDelete: true, allowEdit: true }) },
  ]

  const uiComponents = [
    { category: 'ui_components', name: 'textbox', label: 'Text Box', description: 'Standard text input', config: JSON.stringify({}) },
    { category: 'ui_components', name: 'badge', label: 'Badge', description: 'Colored badge display', config: JSON.stringify({}) },
    { category: 'ui_components', name: 'table', label: 'Table', description: 'Data table view', config: JSON.stringify({}) },
    { category: 'ui_components', name: 'chart', label: 'Chart', description: 'Graphical visualization', config: JSON.stringify({ chartType: 'bar' }) },
    { category: 'ui_components', name: 'card', label: 'Card', description: 'Card container', config: JSON.stringify({}) },
  ]

  const validationTypes = [
    { category: 'validation_types', name: 'required', label: 'Required', description: 'Field must have value', config: JSON.stringify({ message: 'This field is required' }) },
    { category: 'validation_types', name: 'email', label: 'Email Format', description: 'Valid email address', config: JSON.stringify({}) },
    { category: 'validation_types', name: 'phone', label: 'Phone Format', description: 'Valid phone number', config: JSON.stringify({ pattern: '^[0-9]{10}$' }) },
    { category: 'validation_types', name: 'min_length', label: 'Min Length', description: 'Minimum character length', config: JSON.stringify({ min: 0 }) },
    { category: 'validation_types', name: 'max_length', label: 'Max Length', description: 'Maximum character length', config: JSON.stringify({ max: 255 }) },
    { category: 'validation_types', name: 'range', label: 'Number Range', description: 'Value within range', config: JSON.stringify({ min: 0, max: 100 }) },
    { category: 'validation_types', name: 'regex', label: 'Regex Pattern', description: 'Custom regex validation', config: JSON.stringify({ pattern: '' }) },
    { category: 'validation_types', name: 'unique', label: 'Unique Value', description: 'No duplicates allowed', config: JSON.stringify({}) },
  ]

  const layoutTemplates = [
    { category: 'layout_templates', name: 'single_column', label: 'Single Column', description: 'One column layout', config: JSON.stringify({}) },
    { category: 'layout_templates', name: 'two_column', label: 'Two Column', description: 'Two column layout', config: JSON.stringify({}) },
    { category: 'layout_templates', name: 'tabbed', label: 'Tabbed', description: 'Tab-based layout', config: JSON.stringify({ tabs: [] }) },
    { category: 'layout_templates', name: 'wizard', label: 'Wizard', description: 'Step-by-step wizard', config: JSON.stringify({ steps: [] }) },
  ]

  const allMetadata = [...fieldTypes, ...uiComponents, ...validationTypes, ...layoutTemplates]

  for (const item of allMetadata) {
    await prisma.metadataLibrary.upsert({
      where: { category_name: { category: item.category, name: item.name } },
      update: {},
      create: item,
    })
  }

  console.log('✅ Metadata library seeded')

  // ==========================================
  // CREATE PLATFORM ADMIN ONLY
  // ==========================================
  // Platform admin doesn't belong to any tenant - they manage all tenants
  const platformAdminPassword = await bcrypt.hash('Platform@123', 10)
  const platformAdmin = await prisma.user.upsert({
    where: { email: 'platform@easy2work.com' },
    update: {},
    create: {
      email: 'platform@easy2work.com',
      name: 'Platform Administrator',
      password: platformAdminPassword,
      tenantId: null, // Platform admin has no tenant
      role: 'platform_admin',
      status: 'active',
    },
  })

  console.log('✅ Platform admin created:', platformAdmin.email)
  console.log('\n📋 Platform Admin Credentials:')
  console.log('================================')
  console.log('Email: platform@easy2work.com')
  console.log('Password: Platform@123')
  console.log('================================\n')
  console.log('ℹ️  Platform admin will create tenants via UI')
  console.log('ℹ️  Tenant admin credentials will be auto-generated on tenant creation')

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
