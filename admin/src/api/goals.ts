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

  assignGoalToUser: async (goalId: number, userId: number): Promise<any> => {
    const response = await apiClient.post(`/api/v1/goals/${goalId}/assign`, { user_id: userId })
    return response.data
  },

  assignGoalToMultipleUsers: async (goalId: number, userIds: number[]): Promise<any> => {
    const response = await apiClient.post(`/api/v1/goals/${goalId}/assign-bulk`, { user_ids: userIds })
    return response.data
  },

  getGoalAssignments: async (goalId: number): Promise<any[]> => {
    const response = await apiClient.get(`/api/v1/goals/${goalId}/assignments`)
    return response.data
  },

  getUserGoalAssignments: async (userId: number): Promise<any[]> => {
    const response = await apiClient.get(`/api/v1/goals/user/${userId}/assignments`)
    return response.data
  },

  removeAssignment: async (goalId: number, assignmentId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/goals/${goalId}/assignments/${assignmentId}`)
  },
}
