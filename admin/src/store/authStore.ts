import { create } from 'zustand'
import { AuthState } from '../types/auth'
import type { Account, AccountMembership, CurrentUser } from '../types/account'

const STORAGE_KEY_ACCESS = 'auth_access_token'
const STORAGE_KEY_REFRESH = 'auth_refresh_token'
const STORAGE_KEY_ACCOUNT = 'auth_active_account_id'

interface AuthStore extends AuthState {
  currentUser: CurrentUser | null
  accounts: AccountMembership[]
  currentAccount: Account | null

  setTokens: (accessToken: string, refreshToken: string) => void
  clearTokens: () => void
  loadTokensFromStorage: () => void
  setCurrentUser: (user: CurrentUser) => void
  setAccounts: (memberships: AccountMembership[]) => void
  setCurrentAccount: (account: Account | null) => void
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  currentUser: null,
  accounts: [],
  currentAccount: null,

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem(STORAGE_KEY_ACCESS, accessToken)
    localStorage.setItem(STORAGE_KEY_REFRESH, refreshToken)
    set({ accessToken, refreshToken, isAuthenticated: true })
  },

  clearTokens: () => {
    localStorage.removeItem(STORAGE_KEY_ACCESS)
    localStorage.removeItem(STORAGE_KEY_REFRESH)
    localStorage.removeItem(STORAGE_KEY_ACCOUNT)
    set({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      currentUser: null,
      accounts: [],
      currentAccount: null,
    })
  },

  loadTokensFromStorage: () => {
    const accessToken = localStorage.getItem(STORAGE_KEY_ACCESS)
    const refreshToken = localStorage.getItem(STORAGE_KEY_REFRESH)
    if (accessToken && refreshToken) {
      set({ accessToken, refreshToken, isAuthenticated: true })
    }
  },

  setCurrentUser: (user) => {
    set({ currentUser: user })
  },

  setAccounts: (memberships) => {
    const storedAccountId = localStorage.getItem(STORAGE_KEY_ACCOUNT)
    const { currentAccount } = get()

    // Resolve current account: stored ID > user's last_active > first membership
    let resolved: Account | null = currentAccount
    if (!resolved && memberships.length > 0) {
      const targetId = storedAccountId ? parseInt(storedAccountId) : null
      const match = targetId
        ? memberships.find((m) => m.account_id === targetId)
        : null
      resolved = match ? match.account : memberships[0].account
    }

    if (resolved) {
      localStorage.setItem(STORAGE_KEY_ACCOUNT, String(resolved.id))
    }

    set({ accounts: memberships, currentAccount: resolved })
  },

  setCurrentAccount: (account) => {
    if (account) {
      localStorage.setItem(STORAGE_KEY_ACCOUNT, String(account.id))
    } else {
      localStorage.removeItem(STORAGE_KEY_ACCOUNT)
    }
    set({ currentAccount: account })
  },
}))
