import apiClient from './client'

export interface LeadStats {
  total: number
  by_stage: { stage: string | null; count: number; percentage: number }[]
}

export interface Lead {
  id: number
  form_id: number
  email: string
  name?: string
  last_name?: string
  phone?: string
  company?: string
  company_url?: string
  stage: string | null
  form_data: Record<string, any>
  notes: string | null
  webhook_deliveries: any[]
  created_at: string
  updated_at: string
}

export interface LeadEvent {
  id: number
  lead_id: number
  account_id: number | null
  event_type: string
  payload: Record<string, any>
  source: string
  created_at: string
}

export interface LeadProperty {
  id: number
  lead_id: number
  account_id: number | null
  key: string
  value: string
  value_type: 'string' | 'number' | 'boolean' | 'datetime'
  source: string
  updated_at: string
}

export interface LeadTag {
  id: number
  lead_id: number
  account_id: number | null
  name: string
  source: string
  applied_at: string
  applied_by: string
}

export interface LeadStageHistory {
  id: number
  lead_id: number
  from_stage: string | null
  to_stage: string
  changed_by: string | null
  note: string | null
  created_at: string
}

export interface LeadJourney {
  lead: {
    id: number
    name: string
    last_name: string
    email: string
    company: string | null
    stage: string | null
    created_at: string
    entry_source: string
  }
  entry: { source: string; form_id: number | null; form_name: string | null; at: string }
  goals: {
    id: number
    goal_id: number
    name: string
    description: string | null
    completed: boolean
    completed_at: string | null
    assigned_at: string
    due_date: string | null
  }[]
  actions: {
    id: number
    name: string
    description: string | null
    last_triggered_at: string | null
    last_success: boolean | null
  }[]
  stage_history: {
    id: number
    from_stage: string | null
    to_stage: string
    changed_by: string | null
    note: string | null
    created_at: string
  }[]
}

export const leadsApi = {
  listLeads: async (formId?: number, stage?: string): Promise<Lead[]> => {
    const params = new URLSearchParams()
    if (formId) params.append('form_id', String(formId))
    if (stage) params.append('stage', stage)
    const qs = params.toString()
    const response = await apiClient.get<Lead[]>(`/api/v1/leads${qs ? `?${qs}` : ''}`)
    return response.data
  },

  getLead: async (leadId: number): Promise<Lead> => {
    const response = await apiClient.get<Lead>(`/api/v1/leads/${leadId}`)
    return response.data
  },

  updateLead: async (leadId: number, data: { stage?: string | null; notes?: string }): Promise<Lead> => {
    const response = await apiClient.put<Lead>(`/api/v1/leads/${leadId}`, data)
    return response.data
  },

  deleteLead: async (leadId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/leads/${leadId}`)
  },

  applyActionToLeads: async (leadIds: number[], actionId: number): Promise<void> => {
    await apiClient.post(`/api/v1/leads/actions/apply`, { lead_ids: leadIds, action_id: actionId })
  },

  getStats: async (): Promise<LeadStats> => {
    const response = await apiClient.get<LeadStats>('/api/v1/leads/stats')
    return response.data
  },

  getJourney: async (leadId: number): Promise<LeadJourney> => {
    const response = await apiClient.get<LeadJourney>(`/api/v1/leads/${leadId}/journey`)
    return response.data
  },

  // Events
  listEvents: async (leadId: number, filters?: { event_type?: string; source?: string; since?: string; until?: string }): Promise<LeadEvent[]> => {
    const params = new URLSearchParams()
    if (filters?.event_type) params.append('event_type', filters.event_type)
    if (filters?.source) params.append('source', filters.source)
    if (filters?.since) params.append('since', filters.since)
    if (filters?.until) params.append('until', filters.until)
    const qs = params.toString()
    const response = await apiClient.get<LeadEvent[]>(`/api/v1/leads/${leadId}/events${qs ? `?${qs}` : ''}`)
    return response.data
  },

  createEvent: async (leadId: number, data: { event_type: string; payload?: Record<string, any> }): Promise<LeadEvent> => {
    const response = await apiClient.post<LeadEvent>(`/api/v1/leads/${leadId}/events`, data)
    return response.data
  },

  // Properties
  listProperties: async (leadId: number): Promise<LeadProperty[]> => {
    const response = await apiClient.get<LeadProperty[]>(`/api/v1/leads/${leadId}/properties`)
    return response.data
  },

  upsertProperty: async (leadId: number, key: string, data: { value: string; value_type: LeadProperty['value_type'] }): Promise<LeadProperty> => {
    const response = await apiClient.put<LeadProperty>(`/api/v1/leads/${leadId}/properties/${encodeURIComponent(key)}`, data)
    return response.data
  },

  deleteProperty: async (leadId: number, key: string): Promise<void> => {
    await apiClient.delete(`/api/v1/leads/${leadId}/properties/${encodeURIComponent(key)}`)
  },

  // Tags
  listTags: async (leadId: number): Promise<LeadTag[]> => {
    const response = await apiClient.get<LeadTag[]>(`/api/v1/leads/${leadId}/tags`)
    return response.data
  },

  applyTag: async (leadId: number, name: string): Promise<LeadTag> => {
    const response = await apiClient.post<LeadTag>(`/api/v1/leads/${leadId}/tags`, { name })
    return response.data
  },

  removeTag: async (leadId: number, name: string): Promise<void> => {
    await apiClient.delete(`/api/v1/leads/${leadId}/tags/${encodeURIComponent(name)}`)
  },

  // Stage
  setStage: async (leadId: number, stage: string | null, note?: string): Promise<LeadStageHistory> => {
    const response = await apiClient.patch<LeadStageHistory>(`/api/v1/leads/${leadId}/stage`, { stage, note })
    return response.data
  },

  getStageHistory: async (leadId: number): Promise<LeadStageHistory[]> => {
    const response = await apiClient.get<LeadStageHistory[]>(`/api/v1/leads/${leadId}/stage/history`)
    return response.data
  },
}
