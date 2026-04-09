import { useState } from 'react'
import { Icon } from '../Icon'

interface EmbedModalProps {
  formId: number
  isOpen: boolean
  onClose: () => void
}

export function EmbedModal({ formId, isOpen, onClose }: EmbedModalProps) {
  const [copiedType, setCopiedType] = useState<'url' | 'iframe' | null>(null)

  const publicUrl = `${window.location.origin}/forms/public/${formId}`
  const iframeCode = `<iframe src="${publicUrl}" width="100%" height="600" frameborder="0"></iframe>`

  const handleCopy = (text: string, type: 'url' | 'iframe') => {
    navigator.clipboard.writeText(text)
    setCopiedType(type)
    setTimeout(() => setCopiedType(null), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-white">Embed Form</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-300 transition"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Public URL */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Public URL
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Share this link directly or embed it in an iframe.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={publicUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-sm text-slate-300 font-mono"
              />
              <button
                onClick={() => handleCopy(publicUrl, 'url')}
                className={`px-3 py-2 rounded transition ${
                  copiedType === 'url'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                {copiedType === 'url' ? '✓' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Iframe Embed */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Embed Code
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Paste this code in your website's HTML.
            </p>
            <div className="flex gap-2">
              <textarea
                value={iframeCode}
                readOnly
                rows={3}
                className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-sm text-slate-300 font-mono resize-none"
              />
              <button
                onClick={() => handleCopy(iframeCode, 'iframe')}
                className={`px-3 py-2 rounded transition whitespace-nowrap ${
                  copiedType === 'iframe'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                {copiedType === 'iframe' ? '✓' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
            <p className="text-xs text-blue-300">
              ℹ️ The form will always use the latest version from your builder. Changes you make will appear instantly.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition font-medium"
        >
          Close
        </button>
      </div>
    </div>
  )
}
