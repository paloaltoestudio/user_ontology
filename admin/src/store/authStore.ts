import { create } from 'zustand'
import { AuthState } from '../types/auth'

const STORAGE_KEY_ACCESS = 'auth_access_token'
const STORAGE_KEY_REFRESH = 'auth_refresh_token'

interface AuthStore extends AuthState {
  setTokens: (accessToken: string, refreshToken: string) => void
  clearTokens: () => void
  loadTokensFromStorage: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem(STORAGE_KEY_ACCESS, accessToken)
    localStorage.setItem(STORAGE_KEY_REFRESH, refreshToken)
    set({
      accessToken,
      refreshToken,
      isAuthenticated: true,
    })
  },

  clearTokens: () => {
    localStorage.removeItem(STORAGE_KEY_ACCESS)
    localStorage.removeItem(STORAGE_KEY_REFRESH)
    set({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    })
  },

  loadTokensFromStorage: () => {
    const accessToken = localStorage.getItem(STORAGE_KEY_ACCESS)
    const refreshToken = localStorage.getItem(STORAGE_KEY_REFRESH)

    if (accessToken && refreshToken) {
      set({
        accessToken,
        refreshToken,
        isAuthenticated: true,
      })
    }
  },
}))
