import { Node, Edge } from '@xyflow/react'

export interface UserProfile {
  id: string
  name: string
  email: string
  company: string
  stage: 'registered' | 'in_activation' | 'activated' | 'dropped'
  registeredDate: string
  lastActive: string
  activationRate: number
}

export interface UserJourneyNode {
  id: string
  type: 'user' | 'event' | 'goal' | 'action' | 'suggestion'
  label: string
  data: any
}

// Mock user profile
export const mockUser: UserProfile = {
  id: 'user-1',
  name: 'Alice Johnson',
  email: 'alice@techcorp.com',
  company: 'TechCorp Inc',
  stage: 'activated',
  registeredDate: 'Jan 14, 2024',
  lastActive: 'Apr 7, 2026',
  activationRate: 95,
}

// User journey flow with detailed nodes
export const userJourneyFlow: {
  nodes: Node[]
  edges: Edge[]
} = {
  nodes: [
    // Central User Node
    {
      id: 'user',
      data: {
        name: 'Alice Johnson',
        email: 'alice@techcorp.com',
        company: 'TechCorp Inc',
        stage: 'activated',
      },
      position: { x: 100, y: 250 },
      type: 'userNode',
    },
    // Events
    {
      id: 'event-registered',
      data: {
        label: 'REGISTERED',
        date: 'Jan 8 · 09:14am',
        status: '✓ synced to SaaS',
        type: 'event',
      },
      position: { x: 400, y: 100 },
      type: 'eventNode',
    },
    {
      id: 'event-form-submit',
      data: {
        label: 'FORM SUBMIT',
        date: 'Jan 8 · 09:32am',
        meta: 'firma.app/trial',
        type: 'event',
      },
      position: { x: 400, y: 350 },
      type: 'eventNode',
    },
    {
      id: 'event-in-activation',
      data: {
        label: 'IN ACTIVACIÓN',
        status: '48h · no action',
        risk: '⚠ at risk',
        type: 'event',
      },
      position: { x: 800, y: 280 },
      type: 'eventNode',
    },
    {
      id: 'event-activated',
      data: {
        label: 'ACTIVATED',
        status: 'not reached yet',
        locked: '🔒 locked',
        type: 'event',
      },
      position: { x: 1100, y: 100 },
      type: 'eventNode',
    },
    // Goals
    {
      id: 'goal-upload',
      data: {
        label: 'GOAL',
        title: 'Upload Document',
        status: '✓ completed Jan 9',
        type: 'goal',
      },
      position: { x: 600, y: 150 },
      type: 'goalNode',
    },
    {
      id: 'goal-signature',
      data: {
        label: 'GOAL 1',
        title: 'First Signature',
        status: '⏱ pending · 0/1',
        type: 'goal',
      },
      position: { x: 1000, y: 50 },
      type: 'goalNode',
    },
    // Actions
    {
      id: 'action-email',
      data: {
        label: 'ACTION',
        title: 'Email Reminder',
        status: 'sent · Jan 10',
        type: 'action',
      },
      position: { x: 600, y: 450 },
      type: 'actionNode',
    },
    // Suggestions
    {
      id: 'suggestion-whatsapp',
      data: {
        label: 'SUGGESTION',
        title: 'Send WhatsApp',
        confidence: '87%',
        type: 'suggestion',
      },
      position: { x: 800, y: 500 },
      type: 'suggestionNode',
    },
    {
      id: 'suggestion-upgrade',
      data: {
        label: 'SUGGESTION',
        title: 'Offer Pro Upgrade',
        phase: 'phase 2 · locked',
        type: 'suggestion',
      },
      position: { x: 1200, y: 300 },
      type: 'suggestionNode',
    },
  ],
  edges: [
    // User to Events
    {
      id: 'e-user-registered',
      source: 'user',
      target: 'event-registered',
      animated: true,
      style: { stroke: '#06B6D4', strokeWidth: 2 },
      label: 'registers',
    },
    {
      id: 'e-user-form',
      source: 'user',
      target: 'event-form-submit',
      animated: true,
      style: { stroke: '#06B6D4', strokeWidth: 2 },
      label: 'submit',
    },
    // Events to Goals
    {
      id: 'e-registered-goal-upload',
      source: 'event-registered',
      target: 'goal-upload',
      animated: true,
      style: { stroke: '#FBBF24', strokeWidth: 2 },
      label: 'triggers',
    },
    {
      id: 'e-form-activation',
      source: 'event-form-submit',
      target: 'event-in-activation',
      animated: true,
      style: { stroke: '#F43F5E', strokeWidth: 2 },
    },
    // In Activation to Goals
    {
      id: 'e-activation-goal-signature',
      source: 'event-in-activation',
      target: 'goal-signature',
      animated: true,
      style: { stroke: '#FBBF24', strokeWidth: 2 },
      label: 'triggers',
    },
    // Activation to Activated
    {
      id: 'e-activation-activated',
      source: 'event-in-activation',
      target: 'event-activated',
      animated: false,
      style: { stroke: '#10B981', strokeWidth: 2, strokeDasharray: '5,5' },
      label: 'leads to',
    },
    // Actions
    {
      id: 'e-form-action',
      source: 'event-form-submit',
      target: 'action-email',
      animated: false,
      style: { stroke: '#A78BFA', strokeWidth: 2 },
      label: 'triggers',
    },
    // Suggestions
    {
      id: 'e-activation-suggestion',
      source: 'event-in-activation',
      target: 'suggestion-whatsapp',
      animated: false,
      style: { stroke: '#A78BFA', strokeWidth: 2, strokeDasharray: '5,5' },
      label: 'suggests',
    },
    {
      id: 'e-signature-suggestion',
      source: 'goal-signature',
      target: 'suggestion-upgrade',
      animated: false,
      style: { stroke: '#A78BFA', strokeWidth: 2, strokeDasharray: '5,5' },
      label: 'suggests',
    },
  ],
}

// Quick actions for sidebar
export const userQuickActions = [
  { id: 'email', label: 'Send Email', icon: 'file-text' as const, color: '#06B6D4' },
  { id: 'call', label: 'Schedule Call', icon: 'clock' as const, color: '#FBBF24' },
  { id: 'whatsapp', label: 'Send WhatsApp', icon: 'zap' as const, color: '#10B981' },
  { id: 'export', label: 'Export Profile', icon: 'copy' as const, color: '#F43F5E' },
]

// AI Insights
export const aiInsights = [
  {
    id: 'insight-1',
    title: 'High Activation Potential',
    description: 'User shows strong engagement signals. Complete signature goal to unlock activation.',
    confidence: 92,
    type: 'positive',
  },
  {
    id: 'insight-2',
    title: 'At-Risk Window',
    description: '48h without action. Recommend immediate outreach via WhatsApp.',
    confidence: 87,
    type: 'warning',
  },
  {
    id: 'insight-3',
    title: 'Upsell Opportunity',
    description: 'User interacted with 6+ features. Ready for Pro plan upgrade pitch.',
    confidence: 78,
    type: 'positive',
  },
]
