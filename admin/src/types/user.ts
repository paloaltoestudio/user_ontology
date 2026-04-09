export type UserStatus = 'lead_captured' | 'activated' | 'in_progress' | 'inactive' | 'churned'
export type GoalStatus = 'completed' | 'in_progress' | 'not_started'

export interface UserGoal {
  id: number
  title: string
  description: string
  status: GoalStatus
  dueDate?: string
  completedDate?: string
}

export interface UserActivity {
  id: number
  type: 'login' | 'form_submission' | 'goal_completed' | 'profile_updated' | 'feature_accessed'
  title: string
  description: string
  timestamp: string
  metadata?: Record<string, any>
}

export type SuggestionPriority = 'urgent' | 'high' | 'medium' | 'low'
export type SuggestionType = 'email' | 'call' | 'tutorial' | 'feature' | 'recovery' | 'survey' | 'offer'

export interface UserSuggestion {
  id: number
  type: SuggestionType
  title: string
  description: string
  action: string
  priority: SuggestionPriority
  reason: string // Why this suggestion is recommended
  suggestedAt: string
  automatable?: boolean // Whether this suggestion can be executed by an agent (n8n webhook, etc.)
  status?: 'pending' | 'applied' // Status of the suggestion (pending approval or already applied)
  appliedAt?: string // Timestamp when the suggestion was applied
}

export interface QualificationFactor {
  label: string
  weight: number // 0-100, how much this factor contributes
  status: 'positive' | 'negative' | 'neutral'
}

export interface QualificationInsight {
  id: number
  text: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
}

export interface User {
  id: number
  email: string
  name: string
  company?: string
  status: UserStatus
  registeredAt: string
  lastActive: string
  activationRate: number // 0-100
  goals: UserGoal[]
  activities: UserActivity[]
  suggestions: UserSuggestion[]
  qualification?: {
    score: number // 0-100
    confidence: number // 0-100, how confident the AI is
    status: 'cold' | 'warm' | 'qualified'
    factors: QualificationFactor[]
    trend: 'up' | 'down' | 'stable'
    assessedAt: string
    insights?: QualificationInsight[]
  }
  metadata?: {
    country?: string
    industry?: string
    teamSize?: string
  }
}
