export interface Action {
  id: number
  name: string
  description?: string
  webhook_url: string
  auto_send: boolean
  created_at: string
  updated_at: string
}

export interface ActionCreateRequest {
  name: string
  description?: string
  webhook_url: string
  auto_send?: boolean
}

export interface ActionUpdateRequest {
  name?: string
  description?: string
  webhook_url?: string
  auto_send?: boolean
}

export interface ActionLog {
  id: number
  action_id: number
  user_id?: number
  form_id?: number
  payload?: Record<string, any>
  response_status?: number
  response_body?: string
  success: boolean
  error_message?: string
  created_at: string
}
