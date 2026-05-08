export interface Account {
  id: number
  name: string
  slug: string
  created_at: string
  updated_at: string
}

export type MembershipRole = 'admin' | 'member'

export interface AccountMembership {
  id: number
  user_id: number
  account_id: number
  role: MembershipRole
  created_at: string
  account: Account
}

export interface CurrentUser {
  id: number
  email: string
  username: string
  first_name: string | null
  last_name: string | null
  role: string
  is_active: boolean
  is_superadmin: boolean
  last_active_account_id: number | null
  lead_score: number
  user_metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface SlugValidation {
  slug: string
  available: boolean
}
