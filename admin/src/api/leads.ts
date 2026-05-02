import apiClient from './client'

export interface LeadStats {
  total: number
  by_status: { status: string; count: number; percentage: number }[]
}

interface Lead {
  id: number
  form_id: number
  email: string
  status: 'new' | 'contacted' | 'qualified' | 'activated' | 'inactive' | 'churned'
  form_data: Record<string, any>
  notes: string | null
  webhook_deliveries: any[]
  created_at: string
  updated_at: string
}

export const leadsApi = {
  listLeads: async (formId?: number, status?: string): Promise<Lead[]> => {
    const params = new URLSearchParams()
    if (formId) params.append('form_id', String(formId))
    if (status) params.append('status', status)

    const queryString = params.toString()
    const url = `/api/v1/leads${queryString ? `?${queryString}` : ''}`
    const response = await apiClient.get<Lead[]>(url)
    return response.data
  },

  getLead: async (leadId: number): Promise<Lead> => {
    const response = await apiClient.get<Lead>(`/api/v1/leads/${leadId}`)
    return response.data
  },

  updateLead: async (
    leadId: number,
    data: { status?: string; notes?: string }
  ): Promise<Lead> => {
    const response = await apiClient.put<Lead>(
      `/api/v1/leads/${leadId}`,
      data
    )
    return response.data
  },

  deleteLead: async (leadId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/leads/${leadId}`)
  },

  applyActionToLeads: async (leadIds: number[], actionId: number): Promise<void> => {
    await apiClient.post(`/api/v1/leads/actions/apply`, {
      lead_ids: leadIds,
      action_id: actionId,
    })
  },

  getStats: async (): Promise<LeadStats> => {
    const response = await apiClient.get<LeadStats>('/api/v1/leads/stats')
    return response.data
  },

  getJourney: async (leadId: number): Promise<LeadJourney> => {
    const response = await apiClient.get<LeadJourney>(`/api/v1/leads/${leadId}/journey`)
    return response.data
  },
}

export interface LeadJourney {
  lead: { id: number; name: string; last_name: string; email: string; company: string | null; status: string; created_at: string; entry_source: string }
  entry: { source: string; form_id: number | null; form_name: string | null; at: string }
  goals: { id: number; goal_id: number; name: string; description: string | null; completed: boolean; completed_at: string | null; assigned_at: string; due_date: string | null }[]
  actions: { id: number; name: string; description: string | null; last_triggered_at: string | null; last_success: boolean | null }[]
  status_history: { id: number; from_status: string | null; to_status: string; changed_by: string | null; note: string | null; created_at: string }[]
}
