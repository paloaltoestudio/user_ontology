import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { switchAccount, getMyAccounts } from '../api/accounts'

export function AccountSwitcher() {
  const navigate = useNavigate()
  const { currentAccount, accounts, setCurrentAccount, setAccounts } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSwitch = async (accountId: number) => {
    if (accountId === currentAccount?.id) {
      setOpen(false)
      return
    }
    setSwitching(accountId)
    try {
      await switchAccount(accountId)
      const res = await getMyAccounts()
      setAccounts(res.data)
      const membership = res.data.find((m) => m.account_id === accountId)
      if (membership) setCurrentAccount(membership.account)
      setOpen(false)
      // Hard refresh to clear all cached query state
      navigate(0)
    } catch {
      // no-op
    } finally {
      setSwitching(null)
    }
  }

  if (!currentAccount) return null

  const initial = currentAccount.name.charAt(0).toUpperCase()

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition text-left group"
      >
        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#0582BE] to-blue-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">{initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">{currentAccount.name}</p>
          <p className="text-slate-500 text-xs truncate">{currentAccount.slug}</p>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-700">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Workspaces</p>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {accounts.map((m) => {
              const isActive = m.account_id === currentAccount.id
              const isLoading = switching === m.account_id
              return (
                <button
                  key={m.id}
                  onClick={() => handleSwitch(m.account_id)}
                  disabled={isLoading}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700 transition text-left ${
                    isActive ? 'bg-slate-700/60' : ''
                  }`}
                >
                  <div className="w-7 h-7 rounded-md bg-gradient-to-br from-slate-600 to-slate-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs">
                      {m.account.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{m.account.name}</p>
                    <p className="text-slate-500 text-xs truncate">{m.account.slug}</p>
                  </div>
                  {isActive && (
                    <svg
                      className="w-4 h-4 text-blue-400 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {isLoading && (
                    <svg
                      className="w-4 h-4 text-slate-400 flex-shrink-0 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>

          <div className="border-t border-slate-700">
            <button
              onClick={() => { setOpen(false); navigate('/create-account') }}
              className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-700 transition text-left text-slate-300 text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create new workspace
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
