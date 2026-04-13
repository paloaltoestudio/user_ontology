import { useState } from 'react'
import { Icon } from './Icon'

interface UserFiltersProps {
  onFilterChange?: (filters: FilterState) => void
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

export interface FilterState {
  goal?: string
  companySizeRange?: string
  industries?: string[]
  engagementLevel?: string
  company?: string
  status?: string
}

const GOALS = [
  'Product Adoption',
  'Team Expansion',
  'Process Optimization',
  'Cost Reduction',
]

const COMPANY_SIZE_RANGES = [
  { value: '0-50', label: '0 - 50 employees' },
  { value: '51-100', label: '51 - 100 employees' },
  { value: '101-500', label: '101 - 500 employees' },
  { value: '501-1000', label: '501 - 1,000 employees' },
  { value: '1000+', label: '1,000+ employees' },
]

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Retail',
  'Manufacturing',
  'Education',
  'Real Estate',
  'Telecommunications',
  'Energy',
  'Transportation',
]

const ENGAGEMENT_LEVELS = [
  'Hot',
  'Warm',
  'Cold',
  'Not Qualified',
]

const STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'activated', label: 'Activated' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'churned', label: 'Churned' },
]

export function UserFilters({
  onFilterChange,
  searchQuery = '',
  onSearchChange
}: UserFiltersProps) {
  const [showDrawer, setShowDrawer] = useState(false)
  const [filters, setFilters] = useState<FilterState>({})
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)

  const handleGoalChange = (goal: string) => {
    const newFilters = { ...filters, goal: filters.goal === goal ? undefined : goal }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const handleCompanySizeChange = (range: string) => {
    const newFilters = { ...filters, companySizeRange: filters.companySizeRange === range ? undefined : range }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const handleIndustryChange = (industry: string) => {
    const industries = filters.industries || []
    const newIndustries = industries.includes(industry)
      ? industries.filter((i) => i !== industry)
      : [...industries, industry]
    const newFilters = { ...filters, industries: newIndustries.length > 0 ? newIndustries : undefined }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const handleEngagementLevelChange = (level: string) => {
    const newFilters = { ...filters, engagementLevel: filters.engagementLevel === level ? undefined : level }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const handleCompanyChange = (company: string) => {
    const newFilters = { ...filters, company: company || undefined }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const handleStatusChange = (status: string) => {
    const newFilters = { ...filters, status: filters.status === status ? undefined : status }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined && (Array.isArray(v) ? v.length > 0 : true)).length

  const getFilterLabel = (key: string, value: any): string => {
    if (key === 'goal') return `Goal: ${value}`
    if (key === 'companySizeRange') return `Company Size: ${value}`
    if (key === 'industries') return value.join(', ')
    if (key === 'engagementLevel') return `Engagement: ${value}`
    if (key === 'company') return `Company: ${value}`
    if (key === 'status') {
      const label = STATUSES.find(s => s.value === value)?.label
      return label ? `Status: ${label}` : value
    }
    return value
  }

  return (
    <div className="space-y-3">
      {/* Search Bar - Primary */}
      <div className="relative">
        <Icon
          type="search"
          size={1}
          color="#94a3b8"
          className="absolute left-3 top-1/2 -translate-y-1/2"
        />
        <input
          type="text"
          placeholder="Search users by name, email, or company..."
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="w-full pl-10 pr-12 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
        />
        <button
          onClick={() => setShowDrawer(!showDrawer)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-700/50 rounded transition"
          title="Advanced Filters"
        >
          <Icon type="filter" size={1} color="#94a3b8" />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-semibold">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Active Filters Tags */}
      {activeFiltersCount > 0 && (
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-slate-400 font-medium">ACTIVE:</span>
          {Object.entries(filters).map(([key, value]) => {
            if (value === undefined || (Array.isArray(value) && value.length === 0)) return null
            return (
              <div
                key={key}
                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-xs text-blue-300"
              >
                {Array.isArray(value) ? value.join(', ') : getFilterLabel(key, value)}
                <button
                  onClick={() => {
                    const newFilters = { ...filters, [key]: undefined }
                    setFilters(newFilters)
                    onFilterChange?.(newFilters)
                  }}
                  className="hover:text-blue-200 transition font-bold"
                >
                  ✕
                </button>
              </div>
            )
          })}
          <button
            onClick={() => {
              setFilters({})
              onFilterChange?.({})
            }}
            className="text-xs text-slate-400 hover:text-slate-300 transition"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Advanced Filters Drawer */}
      {showDrawer && (
        <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-6 space-y-6 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Filter by Attributes</h3>
            <button
              onClick={() => setShowDrawer(false)}
              className="p-1 hover:bg-slate-700/50 rounded transition"
            >
              <Icon type="x" size={1} color="#94a3b8" />
            </button>
          </div>

          <div className="h-px bg-slate-700/30" />

          {/* Goal Filter */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Goal (What they want to achieve)</label>
            <div className="flex gap-2 flex-wrap">
              {GOALS.map((goal) => (
                <button
                  key={goal}
                  onClick={() => handleGoalChange(goal)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    filters.goal === goal
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-700/30" />

          {/* Company Profile Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Company Profile</h4>

            {/* Company Size */}
            <div className="space-y-2.5">
              <label className="text-xs font-medium text-slate-400">Company Size</label>
              <div className="grid grid-cols-2 gap-2">
                {COMPANY_SIZE_RANGES.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => handleCompanySizeChange(range.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition text-left ${
                      filters.companySizeRange === range.value
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Industry */}
            <div className="space-y-2.5">
              <label className="text-xs font-medium text-slate-400">Industry</label>
              <div className="relative">
                <button
                  onClick={() => setShowIndustryDropdown(!showIndustryDropdown)}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-300 hover:bg-slate-700 transition flex items-center justify-between text-sm"
                >
                  <span>
                    {filters.industries && filters.industries.length > 0
                      ? `${filters.industries.length} selected`
                      : 'Select industries...'}
                  </span>
                  <Icon
                    type={showIndustryDropdown ? 'chevron-up' : 'chevron-down'}
                    size={0.875}
                    color="currentColor"
                  />
                </button>

                {showIndustryDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto">
                    {INDUSTRIES.map((industry) => (
                      <button
                        key={industry}
                        onClick={() => handleIndustryChange(industry)}
                        className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700/50 flex items-center gap-2.5 transition"
                      >
                        <input
                          type="checkbox"
                          checked={filters.industries?.includes(industry) || false}
                          onChange={() => {}}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <span>{industry}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Industries Tags */}
              {filters.industries && filters.industries.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {filters.industries.map((industry) => (
                    <div
                      key={industry}
                      className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-700/50 border border-slate-600/50 rounded text-xs text-slate-300"
                    >
                      {industry}
                      <button
                        onClick={() => handleIndustryChange(industry)}
                        className="hover:text-slate-200 transition font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Company Name */}
            <div className="space-y-2.5">
              <label className="text-xs font-medium text-slate-400">Company Name</label>
              <div className="relative">
                <Icon
                  type="search"
                  size={0.875}
                  color="#94a3b8"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2"
                />
                <input
                  type="text"
                  placeholder="Search company..."
                  value={filters.company || ''}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-700/30" />

          {/* Engagement Level Filter */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Engagement Level</label>
            <div className="grid grid-cols-2 gap-2">
              {ENGAGEMENT_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => handleEngagementLevelChange(level)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    filters.engagementLevel === level
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-700/30" />

          {/* Status Filter (Optional) */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Status (Optional)</label>
            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-300 hover:bg-slate-700 transition flex items-center justify-between text-sm"
              >
                <span>
                  {filters.status
                    ? STATUSES.find(s => s.value === filters.status)?.label
                    : 'Select status...'}
                </span>
                <Icon
                  type={showStatusDropdown ? 'chevron-up' : 'chevron-down'}
                  size={0.875}
                  color="currentColor"
                />
              </button>

              {showStatusDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto">
                  {STATUSES.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => {
                        handleStatusChange(status.value)
                        setShowStatusDropdown(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700/50 flex items-center gap-2.5 transition"
                    >
                      <input
                        type="radio"
                        checked={filters.status === status.value}
                        onChange={() => {}}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span>{status.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
