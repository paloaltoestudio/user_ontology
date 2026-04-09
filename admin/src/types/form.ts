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

export interface Form {
  id: number
  name: string
  description?: string
  is_active: boolean
  webhooks?: string[]
  display_as_steps: boolean
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
