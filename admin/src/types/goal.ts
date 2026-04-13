export interface Goal {
  id: number
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: number
}

export interface GoalCreateRequest {
  name: string
  description?: string
  is_active?: boolean
}

export interface GoalUpdateRequest {
  name?: string
  description?: string
  is_active?: boolean
}
