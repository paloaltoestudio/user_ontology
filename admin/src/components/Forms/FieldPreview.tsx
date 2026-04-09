import { FieldType } from '../../types/form'

interface FieldPreviewProps {
  field_name: string
  field_type: FieldType
  required: boolean
  help_text?: string
  field_options?: Array<{ label: string; value: string }>
}

export function FieldPreview({
  field_name,
  field_type,
  required,
  help_text,
  field_options,
}: FieldPreviewProps) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
      <h4 className="text-sm font-semibold text-slate-300 mb-4">Preview</h4>
      <div className="space-y-3 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
        <label className="block">
          <span className="block text-sm font-medium text-white mb-2">
            {field_name}
            {required && <span className="text-red-400 ml-1">*</span>}
          </span>

          {/* Text, Email, Password, Number */}
          {['text', 'email', 'password', 'number'].includes(field_type) && (
            <input
              type={field_type}
              placeholder={`Enter ${field_name.toLowerCase()}`}
              disabled
              className="w-full px-3 py-2 border border-slate-600 rounded-md text-slate-500 bg-slate-800/50 cursor-not-allowed"
            />
          )}

          {/* Textarea */}
          {field_type === 'textarea' && (
            <textarea
              placeholder={`Enter ${field_name.toLowerCase()}`}
              disabled
              rows={3}
              className="w-full px-3 py-2 border border-slate-600 rounded-md text-slate-500 bg-slate-800/50 cursor-not-allowed"
            />
          )}

          {/* Date */}
          {field_type === 'date' && (
            <input
              type="date"
              disabled
              className="w-full px-3 py-2 border border-slate-600 rounded-md text-slate-500 bg-slate-800/50 cursor-not-allowed"
            />
          )}

          {/* Select */}
          {field_type === 'select' && (
            <select disabled className="w-full px-3 py-2 border border-slate-600 rounded-md text-slate-500 bg-slate-800/50 cursor-not-allowed">
              <option>Select {field_name.toLowerCase()}</option>
              {field_options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {/* Checkbox */}
          {field_type === 'checkbox' && (
            <div className="space-y-2">
              {field_options?.map((opt) => (
                <div key={opt.value} className="flex items-center">
                  <input
                    type="checkbox"
                    id={opt.value}
                    disabled
                    className="w-4 h-4 rounded border-slate-600 accent-[#0582BE] cursor-not-allowed"
                  />
                  <label
                    htmlFor={opt.value}
                    className="ml-2 text-sm text-slate-400"
                  >
                    {opt.label}
                  </label>
                </div>
              ))}
            </div>
          )}
        </label>

        {help_text && (
          <p className="text-xs text-slate-500 mt-2">{help_text}</p>
        )}
      </div>
    </div>
  )
}
