import apiClient from './client'
import type { Account, AccountMembership, CurrentUser, MembershipRole, SlugValidation } from '../types/account'

export const getCurrentUser = () =>
  apiClient.get<CurrentUser>('/api/v1/auth/me')

export const getMyAccounts = () =>
  apiClient.get<AccountMembership[]>('/api/v1/accounts')

export const createAccount = (name: string, slug?: string) =>
  apiClient.post<Account>('/api/v1/accounts', { name, slug })

export const validateSlug = (q: string) =>
  apiClient.get<SlugValidation>(`/api/v1/accounts/validate-slug?q=${encodeURIComponent(q)}`)

export const switchAccount = (account_id: number) =>
  apiClient.put<{ account_id: number }>('/api/v1/accounts/switch', { account_id })

export const getAccount = (accountId: number) =>
  apiClient.get<Account>(`/api/v1/accounts/${accountId}`)

export const addMember = (accountId: number, email: string, role: MembershipRole) =>
  apiClient.post(`/api/v1/accounts/${accountId}/members`, { email, role })

export const removeMember = (accountId: number, userId: number) =>
  apiClient.delete(`/api/v1/accounts/${accountId}/members/${userId}`)
