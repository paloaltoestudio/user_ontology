import apiClient from './client'

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
}
