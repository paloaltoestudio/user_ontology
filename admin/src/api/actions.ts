import apiClient from './client'
import { Action, ActionCreateRequest, ActionUpdateRequest, ActionLog } from '../types/action'

export const actionsApi = {
  // CRUD operations
  listActions: async (): Promise<Action[]> => {
    const response = await apiClient.get<Action[]>('/api/v1/actions')
    return response.data
  },

  getAction: async (actionId: number): Promise<Action> => {
    const response = await apiClient.get<Action>(`/api/v1/actions/${actionId}`)
    return response.data
  },

  createAction: async (actionData: ActionCreateRequest): Promise<Action> => {
    const response = await apiClient.post<Action>('/api/v1/actions', actionData)
    return response.data
  },

  updateAction: async (
    actionId: number,
    actionData: ActionUpdateRequest
  ): Promise<Action> => {
    const response = await apiClient.put<Action>(
      `/api/v1/actions/${actionId}`,
      actionData
    )
    return response.data
  },

  deleteAction: async (actionId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/actions/${actionId}`)
  },

  // Logging
  getActionLogs: async (actionId: number, filters?: {
    user_id?: number
    success?: boolean
  }): Promise<ActionLog[]> => {
    const response = await apiClient.get<ActionLog[]>(
      `/api/v1/actions/${actionId}/logs`,
      { params: filters }
    )
    return response.data
  },
}
