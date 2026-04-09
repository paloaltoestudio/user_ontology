import apiClient from './client'
import { LoginResponse, LoginFormData } from '../types/auth'

export const authApi = {
  login: async (credentials: LoginFormData): Promise<LoginResponse> => {
    const params = new URLSearchParams()
    params.append('username', credentials.username)
    params.append('password', credentials.password)

    const response = await apiClient.post<LoginResponse>(
      '/api/v1/auth/login',
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )
    return response.data
  },
}
