export interface FormField {
  id: number
  step_id: number
  field_name: string
  field_type: string
  required: boolean
  help_text?: string
  user_field_mapping?: string
  field_options?: Array<{ label: string; value: string }>
  display_order: number
  created_at: string
  updated_at: string
}

export interface FormStep {
  id: number
  form_id: number
  step_number: number
  title: string
  description?: string
  fields: FormField[]
  created_at: string
  updated_at: string
}

export interface LeadFieldMapping {
  name?: string
  last_name?: string
  email?: string
  phone?: string
  company?: string
  company_url?: string
}

export interface Form {
  id: number
  name: string
  description?: string
  is_active: boolean
  webhooks?: string[]
  display_as_steps: boolean
  lead_field_mapping?: LeadFieldMapping
  actions?: Array<{ id: number; name: string; description?: string; webhook_url: string }>
  steps: FormStep[]
  created_at: string
  updated_at: string
}

export interface FormCreateRequest {
  name: string
  description?: string
  is_active?: boolean
  display_as_steps?: boolean
  webhooks?: string[]
  lead_field_mapping?: LeadFieldMapping
  steps?: Array<{
    step_number: number
    title: string
    description?: string
    fields?: Array<{
      field_name: string
      field_type: string
      required?: boolean
      help_text?: string
      user_field_mapping?: string
      field_options?: Array<{ label: string; value: string }>
      display_order: number
    }>
  }>
}

export type FieldType = 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'date'

// Lead field configuration for mapping
export const LEAD_FIELDS = {
  name: { label: 'First Name', required: true },
  last_name: { label: 'Last Name', required: true },
  email: { label: 'Email', required: true },
  phone: { label: 'Phone', required: false },
  company: { label: 'Company', required: false },
  company_url: { label: 'Company URL', required: false },
} as const
