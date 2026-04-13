import { useState } from 'react'
import { Icon } from '../Icon'

interface GoalShareModalProps {
  goalId: number
  goalName: string
  isOpen: boolean
  onClose: () => void
}

export function GoalShareModal({
  goalId,
  goalName,
  isOpen,
  onClose,
}: GoalShareModalProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  if (!isOpen) return null

  const apiUrl = `${window.location.origin.replace(':3000', ':8000')}/api/v1/goals/events`

  const examplePayloadString = `{
  "goal_id": ${goalId},
  "goal_name": "${goalName}",
  "external_user_id": "user_123",
  "email": "user@example.com",
  "timestamp": "${new Date().toISOString()}",
  "metadata": {
    // Additional data you want to send (optional)
  }
}`

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSection(section)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex justify-between items-center p-6 border-b border-slate-700 bg-slate-800">
          <h2 className="text-xl font-bold text-white">
            Share Goal - Integration Guide
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-300 transition"
            aria-label="Close"
          >
            <Icon type="x" size={1.5} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Endpoint Section */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">
              API Endpoint
            </h3>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 font-mono text-sm">
              <div className="text-slate-400 mb-2">POST</div>
              <div className="text-[#0582BE] break-all">{apiUrl}</div>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(apiUrl, 'endpoint')}
              className="mt-2 px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition"
            >
              {copiedSection === 'endpoint' ? '✓ Copied' : 'Copy Endpoint'}
            </button>
          </div>

          {/* Headers Section */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">
              Headers
            </h3>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-2 font-mono text-sm">
              <div>
                <span className="text-slate-400">Authorization: </span>
                <span className="text-green-400">Bearer &lt;your_api_key&gt;</span>
              </div>
              <div>
                <span className="text-slate-400">Content-Type: </span>
                <span className="text-green-400">application/json</span>
              </div>
              <div className="text-slate-500 text-xs pt-2">
                Optional: Add <span className="text-slate-400">Idempotency-Key</span> header for deduplication
              </div>
            </div>
          </div>

          {/* Request Body Section */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">
              Request Body (Example)
            </h3>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-x-auto">
              <pre className="font-mono text-sm text-slate-300">
                {examplePayloadString}
              </pre>
            </div>
            <button
              type="button"
              onClick={() =>
                handleCopy(examplePayloadString, 'payload')
              }
              className="mt-2 px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition"
            >
              {copiedSection === 'payload' ? '✓ Copied' : 'Copy Payload'}
            </button>
          </div>

          {/* Field Documentation */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">
              Field Reference
            </h3>
            <div className="space-y-3 text-sm">
              <div className="border-l-2 border-[#0582BE] pl-3">
                <div className="font-mono text-[#0582BE]">goal_id *</div>
                <div className="text-slate-400">
                  The ID of the goal (required). Current value: <span className="text-blue-400">{goalId}</span>
                </div>
              </div>
              <div className="border-l-2 border-slate-700 pl-3">
                <div className="font-mono text-slate-300">goal_name</div>
                <div className="text-slate-400">
                  Optional reference to goal name
                </div>
              </div>
              <div className="border-l-2 border-slate-700 pl-3">
                <div className="font-mono text-slate-300">external_user_id</div>
                <div className="text-slate-400">
                  User ID from your external system. Use this to identify the user completing the goal.
                </div>
              </div>
              <div className="border-l-2 border-slate-700 pl-3">
                <div className="font-mono text-slate-300">internal_user_id</div>
                <div className="text-slate-400">
                  Our internal user ID (optional fallback)
                </div>
              </div>
              <div className="border-l-2 border-slate-700 pl-3">
                <div className="font-mono text-slate-300">email</div>
                <div className="text-slate-400">
                  User email (used as fallback if external_user_id not found)
                </div>
              </div>
              <div className="border-l-2 border-[#0582BE] pl-3">
                <div className="font-mono text-[#0582BE]">timestamp *</div>
                <div className="text-slate-400">
                  When the goal was completed in ISO 8601 format (required)
                </div>
              </div>
              <div className="border-l-2 border-slate-700 pl-3">
                <div className="font-mono text-slate-300">metadata</div>
                <div className="text-slate-400">
                  Additional data to store with the event (optional)
                </div>
              </div>
            </div>
          </div>

          {/* Response Section */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">
              Success Response
            </h3>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-x-auto">
              <pre className="font-mono text-sm text-slate-300">
                {JSON.stringify(
                  {
                    success: true,
                    data: {
                      id: 123,
                      goal_id: goalId,
                      user_id: 456,
                      external_user_id: 'user_123',
                      first_completed_at: new Date().toISOString(),
                      created_at: new Date().toISOString(),
                    },
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex justify-end gap-2 p-6 border-t border-slate-700 bg-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
