import apiClient from './client'

export type ValueType = 'string' | 'number' | 'boolean' | 'datetime'

// ---------------------------------------------------------------------------
// Stage definitions
// ---------------------------------------------------------------------------

export interface StageDefinition {
  id: number
  account_id: number
  name: string
  description: string | null
  color: string | null
  sort_order: number
  created_at: string
}

// ---------------------------------------------------------------------------
// Tag definitions
// ---------------------------------------------------------------------------

export interface TagDefinition {
  id: number
  account_id: number
  name: string
  description: string | null
  color: string | null
  created_at: string
}

// ---------------------------------------------------------------------------
// Property definitions
// ---------------------------------------------------------------------------

export interface PropertyDefinition {
  id: number
  account_id: number
  key: string
  display_name: string | null
  description: string | null
  value_type: ValueType
  created_at: string
}

// ---------------------------------------------------------------------------
// Event type definitions
// ---------------------------------------------------------------------------

export interface EventTypeDefinition {
  id: number
  account_id: number
  name: string
  description: string | null
  payload_schema: Record<string, any> | null
  created_at: string
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

export const catalogApi = {
  // Stages
  listStages: async (): Promise<StageDefinition[]> => {
    const r = await apiClient.get<StageDefinition[]>('/api/v1/catalog/stages')
    return r.data
  },
  createStage: async (data: { name: string; description?: string; color?: string; sort_order?: number }): Promise<StageDefinition> => {
    const r = await apiClient.post<StageDefinition>('/api/v1/catalog/stages', data)
    return r.data
  },
  updateStage: async (id: number, data: Partial<{ name: string; description: string; color: string; sort_order: number }>): Promise<StageDefinition> => {
    const r = await apiClient.put<StageDefinition>(`/api/v1/catalog/stages/${id}`, data)
    return r.data
  },
  deleteStage: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/catalog/stages/${id}`)
  },

  // Tags
  listTags: async (): Promise<TagDefinition[]> => {
    const r = await apiClient.get<TagDefinition[]>('/api/v1/catalog/tags')
    return r.data
  },
  createTag: async (data: { name: string; description?: string; color?: string }): Promise<TagDefinition> => {
    const r = await apiClient.post<TagDefinition>('/api/v1/catalog/tags', data)
    return r.data
  },
  updateTag: async (id: number, data: Partial<{ name: string; description: string; color: string }>): Promise<TagDefinition> => {
    const r = await apiClient.put<TagDefinition>(`/api/v1/catalog/tags/${id}`, data)
    return r.data
  },
  deleteTag: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/catalog/tags/${id}`)
  },

  // Properties
  listProperties: async (): Promise<PropertyDefinition[]> => {
    const r = await apiClient.get<PropertyDefinition[]>('/api/v1/catalog/properties')
    return r.data
  },
  createProperty: async (data: { key: string; display_name?: string; description?: string; value_type?: ValueType }): Promise<PropertyDefinition> => {
    const r = await apiClient.post<PropertyDefinition>('/api/v1/catalog/properties', data)
    return r.data
  },
  updateProperty: async (id: number, data: Partial<{ display_name: string; description: string; value_type: ValueType }>): Promise<PropertyDefinition> => {
    const r = await apiClient.put<PropertyDefinition>(`/api/v1/catalog/properties/${id}`, data)
    return r.data
  },
  deleteProperty: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/catalog/properties/${id}`)
  },

  // Event types
  listEventTypes: async (): Promise<EventTypeDefinition[]> => {
    const r = await apiClient.get<EventTypeDefinition[]>('/api/v1/catalog/event-types')
    return r.data
  },
  createEventType: async (data: { name: string; description?: string; payload_schema?: Record<string, any> }): Promise<EventTypeDefinition> => {
    const r = await apiClient.post<EventTypeDefinition>('/api/v1/catalog/event-types', data)
    return r.data
  },
  updateEventType: async (id: number, data: Partial<{ description: string; payload_schema: Record<string, any> }>): Promise<EventTypeDefinition> => {
    const r = await apiClient.put<EventTypeDefinition>(`/api/v1/catalog/event-types/${id}`, data)
    return r.data
  },
  deleteEventType: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/catalog/event-types/${id}`)
  },
}
