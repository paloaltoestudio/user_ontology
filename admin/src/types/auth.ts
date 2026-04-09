export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
}

export interface LoginFormData {
  username: string
  password: string
}
