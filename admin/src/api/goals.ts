import apiClient from './client'
import { Goal, GoalCreateRequest, GoalUpdateRequest } from '../types/goal'

export const goalsApi = {
  // CRUD operations
  listGoals: async (): Promise<Goal[]> => {
    const response = await apiClient.get<Goal[]>('/api/v1/goals')
    return response.data
  },

  getGoal: async (goalId: number): Promise<Goal> => {
    const response = await apiClient.get<Goal>(`/api/v1/goals/${goalId}`)
    return response.data
  },

  createGoal: async (goalData: GoalCreateRequest): Promise<Goal> => {
    const response = await apiClient.post<Goal>('/api/v1/goals', goalData)
    return response.data
  },

  updateGoal: async (
    goalId: number,
    goalData: GoalUpdateRequest
  ): Promise<Goal> => {
    const response = await apiClient.put<Goal>(
      `/api/v1/goals/${goalId}`,
      goalData
    )
    return response.data
  },

  deleteGoal: async (goalId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/goals/${goalId}`)
  },

  toggleGoalStatus: async (goalId: number, isActive: boolean): Promise<Goal> => {
    const response = await apiClient.put<Goal>(
      `/api/v1/goals/${goalId}`,
      { is_active: isActive }
    )
    return response.data
  },
}
