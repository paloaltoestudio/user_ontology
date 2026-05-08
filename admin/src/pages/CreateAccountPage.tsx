import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { createAccount, validateSlug, getMyAccounts, getCurrentUser } from '../api/accounts'
import { useAuthStore } from '../store/authStore'

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100)
}

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error'

export function CreateAccountPage() {
  const navigate = useNavigate()
  const { setCurrentUser, setAccounts, setCurrentAccount, clearTokens, accounts } = useAuthStore()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-derive slug from name unless user manually edited it
  useEffect(() => {
    if (!slugEdited) {
      setSlug(toSlug(name))
    }
  }, [name, slugEdited])

  // Debounced slug validation
  const checkSlug = useCallback(
    (() => {
      let timer: ReturnType<typeof setTimeout>
      return (value: string) => {
        clearTimeout(timer)
        if (!value) {
          setSlugStatus('idle')
          return
        }
        setSlugStatus('checking')
        timer = setTimeout(async () => {
          try {
            const res = await validateSlug(value)
            setSlugStatus(res.data.available ? 'available' : 'taken')
          } catch {
            setSlugStatus('error')
          }
        }, 400)
      }
    })(),
    []
  )

  useEffect(() => {
    checkSlug(slug)
  }, [slug, checkSlug])

  const handleSlugChange = (value: string) => {
    setSlugEdited(true)
    setSlug(toSlug(value))
  }

  const handleSignOut = () => {
    clearTokens()
    navigate('/login', { replace: true })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !slug || slugStatus !== 'available') return

    setSubmitting(true)
    setError(null)
    try {
      await createAccount(name.trim(), slug)

      // Refresh user + accounts in store
      const [userRes, accountsRes] = await Promise.all([getCurrentUser(), getMyAccounts()])
      setCurrentUser(userRes.data)
      setAccounts(accountsRes.data)

      // Set the newly created account as current
      const newMembership = accountsRes.data.find((m) => m.account.slug === slug)
      if (newMembership) setCurrentAccount(newMembership.account)

      navigate('/dashboard')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Failed to create account'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const SlugIndicator = () => {
    if (!slug) return null
    if (slugStatus === 'checking')
      return <span className="text-slate-400 text-sm">Checking…</span>
    if (slugStatus === 'available')
      return (
        <span className="flex items-center gap-1 text-emerald-400 text-sm font-medium">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Available
        </span>
      )
    if (slugStatus === 'taken')
      return (
        <span className="flex items-center gap-1 text-red-400 text-sm font-medium">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Not Available
        </span>
      )
    return null
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0582BE] to-blue-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">UV</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Create your workspace</h1>
          <p className="text-slate-400 mt-2 text-sm">
            Your workspace is where your team manages forms, leads, and insights.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-slate-800 rounded-xl p-8 space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Workspace name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Corp"
              maxLength={255}
              required
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              URL handle
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="acme-corp"
                maxLength={100}
                required
                className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition font-mono text-sm"
              />
              <div className="w-28 flex justify-end">
                <SlugIndicator />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Unique identifier for your workspace — lowercase letters, numbers, and hyphens only.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !name.trim() || !slug || slugStatus !== 'available'}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#0582BE] to-blue-600 hover:from-blue-500 hover:to-blue-500 text-white font-semibold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating…' : 'Create workspace'}
          </button>

          {accounts.length > 0 ? (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full py-2.5 text-sm text-slate-400 hover:text-slate-200 transition"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full py-2.5 text-sm text-slate-500 hover:text-slate-300 transition"
            >
              Sign out
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
