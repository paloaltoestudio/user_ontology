import { Node, Edge } from '@xyflow/react'

export type Stage = 'registered' | 'in_activation' | 'activated' | 'dropped'

export interface StageData {
  title: string
  description: string
  metrics: Array<{ label: string; value: string | number; icon: string }>
  actions: Array<{ label: string; description: string; icon: string }>
  insights: string[]
}

export interface UserJourneyNode {
  id: string
  label: string
  stage: 'registered' | 'in_activation' | 'activated' | 'dropped'
  count: number
  percentage: number
}

export interface CompanyStageNode {
  id: string
  name: string
  count: number
  stage: 'registered' | 'in_activation' | 'activated' | 'dropped'
}

// KPI Summary Data
export const kpiData = {
  totalRegistered: 1240,
  inActivation: 487,
  activated: 318,
  droppedInactivos: 435,
}

// User Journey Flow Data
export const userJourneyData: {
  nodes: Node[]
  edges: Edge[]
} = {
  nodes: [
    // Stage 1: Registered
    {
      id: 'registered',
      data: {
        label: 'Registered',
        count: 1240,
        percentage: 100,
        stage: 'registered',
      },
      position: { x: 100, y: 250 },
      type: 'custom',
    },
    // Stage 2: In Activation / Goals
    {
      id: 'in_activation',
      data: {
        label: 'In Activation',
        count: 487,
        percentage: 39.3,
        stage: 'in_activation',
      },
      position: { x: 400, y: 250 },
      type: 'custom',
    },
    // Stage 3: Activated
    {
      id: 'activated',
      data: {
        label: 'Activated',
        count: 318,
        percentage: 25.6,
        stage: 'activated',
      },
      position: { x: 700, y: 150 },
      type: 'custom',
    },
    // Stage 3: Dropped
    {
      id: 'dropped',
      data: {
        label: 'Dropped',
        count: 435,
        percentage: 35.1,
        stage: 'dropped',
      },
      position: { x: 700, y: 350 },
      type: 'custom',
    },
    // Recovery/Reactivation
    {
      id: 'recovery',
      data: {
        label: 'Recovery Flow',
        count: 48,
        percentage: 11,
        stage: 'in_activation',
      },
      position: { x: 900, y: 350 },
      type: 'custom',
    },
  ],
  edges: [
    {
      id: 'e-registered-activation',
      source: 'registered',
      target: 'in_activation',
      animated: true,
      style: { stroke: '#FBBF24', strokeWidth: 3 },
    },
    {
      id: 'e-activation-activated',
      source: 'in_activation',
      target: 'activated',
      animated: true,
      style: { stroke: '#10B981', strokeWidth: 3 },
    },
    {
      id: 'e-activation-dropped',
      source: 'in_activation',
      target: 'dropped',
      animated: false,
      style: { stroke: '#F43F5E', strokeWidth: 2, strokeDasharray: '5,5' },
    },
    {
      id: 'e-dropped-recovery',
      source: 'dropped',
      target: 'recovery',
      animated: false,
      style: { stroke: '#A78BFA', strokeWidth: 2, strokeDasharray: '5,5' },
    },
  ],
}

// Company Stage Distribution Data
export const companyStagesData: CompanyStageNode[] = [
  { id: 'company-1', name: 'TechCorp Inc', count: 95, stage: 'activated' },
  { id: 'company-2', name: 'Innovate Labs', count: 65, stage: 'in_activation' },
  { id: 'company-3', name: 'Design Studio Co', count: 98, stage: 'activated' },
  { id: 'company-4', name: 'Startup AI', count: 20, stage: 'registered' },
  { id: 'company-5', name: 'Enterprise Solutions', count: 35, stage: 'dropped' },
  { id: 'company-6', name: 'Global Tech GmbH', count: 88, stage: 'activated' },
  { id: 'company-7', name: 'E-Commerce Plus Japan', count: 45, stage: 'dropped' },
  { id: 'company-8', name: 'Creative Agency Paris', count: 72, stage: 'in_activation' },
]

// Stage color mapping
export const stageColorMap: Record<
  'registered' | 'in_activation' | 'activated' | 'dropped',
  { bg: string; border: string; text: string; icon: 'user-plus' | 'zap' | 'check-circle' | 'trending-down' }
> = {
  registered: {
    bg: '#0369A1',
    border: '#06B6D4',
    text: '#06B6D4',
    icon: 'user-plus',
  },
  in_activation: {
    bg: '#92400E',
    border: '#FBBF24',
    text: '#FBBF24',
    icon: 'zap',
  },
  activated: {
    bg: '#064E3B',
    border: '#10B981',
    text: '#10B981',
    icon: 'check-circle',
  },
  dropped: {
    bg: '#500724',
    border: '#F43F5E',
    text: '#F43F5E',
    icon: 'trending-down',
  },
}

// Stage details for modals and tooltips
export const stageDetails: Record<Stage, StageData> = {
  registered: {
    title: 'New Registrations',
    description:
      'Users who just signed up. Focus on onboarding and initial value demonstration.',
    metrics: [
      { label: 'Sign-ups (7d)', value: '324', icon: 'user-plus' },
      { label: 'Email Verified', value: '89%', icon: 'check-circle' },
      { label: 'Avg. Time to First Login', value: '2.4h', icon: 'clock' },
    ],
    actions: [
      {
        label: 'Send Onboarding Series',
        description: 'Automated email sequence to guide users through key features',
        icon: 'mail',
      },
      {
        label: 'Schedule Intro Call',
        description: 'Personal onboarding call with success manager for enterprise users',
        icon: 'phone',
      },
      {
        label: 'Deploy Feature Tutorial',
        description: 'Interactive in-app walkthrough showing core platform capabilities',
        icon: 'play',
      },
    ],
    insights: [
      '✓ Mobile registrations increased 34% month-over-month',
      '✓ Users from tech industry activate 3.2x faster',
      '→ Weekend signups need 18h more to first login',
    ],
  },
  in_activation: {
    title: 'Active Onboarding',
    description:
      'Users exploring features. Critical engagement window—recommendations and guidance drive conversions.',
    metrics: [
      { label: 'Avg. Features Explored', value: '4.2/8', icon: 'zap' },
      { label: 'Engagement Score', value: '6.8/10', icon: 'target' },
      { label: 'Days to First Goal', value: '3.1d', icon: 'clock' },
    ],
    actions: [
      {
        label: 'AI-Powered Recommendations',
        description:
          'Suggest next features based on behavior & industry best practices',
        icon: 'lightbulb',
      },
      {
        label: 'Send Success Tips',
        description: 'Targeted content showing ROI examples from similar companies',
        icon: 'mail',
      },
      {
        label: 'Offer 1:1 Strategy Session',
        description: 'High-touch onboarding for high-value prospects (ACVs $50k+)',
        icon: 'target',
      },
    ],
    insights: [
      '✓ Users completing Goal 1 → 67% conversion to Activated',
      '→ 23% drop off after Day 5 with no engagement',
      '✓ Live chat support increases conversion 2.4x',
    ],
  },
  activated: {
    title: 'Active Customers',
    description:
      'Successful users driving ROI. Focus on retention, expansion, and growth.',
    metrics: [
      { label: 'Monthly Active Users', value: '318', icon: 'check-circle' },
      { label: 'Avg. Features Used', value: '6.4/8', icon: 'zap' },
      { label: 'NPS Score', value: '72', icon: 'trending-up' },
    ],
    actions: [
      {
        label: 'Upsell Enterprise Plan',
        description: 'Identify multi-team usage and offer premium pricing tiers',
        icon: 'target',
      },
      {
        label: 'Premium Feature Offers',
        description:
          'Early access to new features for accounts hitting usage thresholds',
        icon: 'zap',
      },
      {
        label: 'Schedule Quarterly Review',
        description:
          'Check in on ROI, gather feedback, and identify expansion opportunities',
        icon: 'user-plus',
      },
    ],
    insights: [
      '✓ 94% of activated users integrate with 2+ tools',
      '✓ Customers stay for avg 18+ months—97% retention rate',
      '→ Premium feature adoption drives 3.1x higher LTV',
    ],
  },
  dropped: {
    title: 'Churn & At-Risk',
    description:
      'Inactive or churned users. Implement recovery campaigns and understand why they left.',
    metrics: [
      { label: 'Churned Users (30d)', value: '435', icon: 'trending-down' },
      { label: 'Avg. Time to Churn', value: '47d', icon: 'clock' },
      { label: 'Recovery Rate', value: '11%', icon: 'trending-up' },
    ],
    actions: [
      {
        label: 'Send Win-Back Campaign',
        description:
          'Personalized email showing new features, success stories, and exclusive offers',
        icon: 'mail',
      },
      {
        label: 'Churn Feedback Survey',
        description:
          'Understand pain points to improve product roadmap and future onboarding',
        icon: 'info',
      },
      {
        label: 'Offer Special Reactivation',
        description: '30% discount for 3 months if they return within 90 days',
        icon: 'zap',
      },
    ],
    insights: [
      '→ Setup incomplete is #1 churn reason (42% of dropped users)',
      '✓ Win-back campaigns convert 11% of churned users back',
      '→ Users who churned within 30d have highest recovery potential',
    ],
  },
}
