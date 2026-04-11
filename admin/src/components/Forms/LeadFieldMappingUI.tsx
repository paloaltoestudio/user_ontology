import { Form, LeadFieldMapping, LEAD_FIELDS } from '../../types/form'
import { Icon } from '../Icon'
import { useMemo } from 'react'

interface LeadFieldMappingUIProps {
  form: Form
  mapping: LeadFieldMapping
  onMappingChange: (mapping: LeadFieldMapping) => void
}

export function LeadFieldMappingUI({ form, mapping, onMappingChange }: LeadFieldMappingUIProps) {
  // Get all form field names
  const formFieldNames = useMemo(() => {
    const fields = new Set<string>()
    form.steps.forEach((step) => {
      step.fields.forEach((field) => {
        fields.add(field.field_name)
      })
    })
    return Array.from(fields).sort()
  }, [form])

  // Validation: Check for duplicate mappings
  const getMappedFields = () => {
    const mapped = new Set<string>()
    Object.values(mapping).forEach((fieldName) => {
      if (fieldName) mapped.add(fieldName)
    })
    return mapped
  }

  // Check if a field is already mapped
  const isFieldAlreadyMapped = (fieldName: string, excludeKey?: string) => {
    return Object.entries(mapping).some(
      ([key, value]) => value === fieldName && key !== excludeKey
    )
  }

  // Validation: Check required fields
  const getMappingStatus = () => {
    const requiredFields = Object.entries(LEAD_FIELDS)
      .filter(([_, config]) => config.required)
      .map(([key]) => key)

    const mappedRequired = requiredFields.filter((field) => mapping[field as keyof LeadFieldMapping])
    return {
      required: requiredFields.length,
      mapped: mappedRequired.length,
      isComplete: mappedRequired.length === requiredFields.length,
    }
  }

  const status = getMappingStatus()

  const handleMapChange = (leadField: string, formField: string | null) => {
    const newMapping = { ...mapping }
    if (formField) {
      newMapping[leadField as keyof LeadFieldMapping] = formField
    } else {
      delete newMapping[leadField as keyof LeadFieldMapping]
    }
    onMappingChange(newMapping)
  }

  return (
    <div className="space-y-8">
      {/* Status Card */}
      <div className={`p-4 rounded-lg border ${
        status.isComplete
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-amber-500/10 border-amber-500/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon
              type={status.isComplete ? 'check-circle' : 'alert-circle'}
              size={1.25}
              color={status.isComplete ? '#10B981' : '#F59E0B'}
            />
            <div>
              <p className={`font-semibold ${status.isComplete ? 'text-emerald-300' : 'text-amber-300'}`}>
                {status.isComplete ? '✓ All Required Fields Mapped' : '⚠ Incomplete Mapping'}
              </p>
              <p className={`text-sm ${status.isComplete ? 'text-emerald-200' : 'text-amber-200'}`}>
                {status.mapped} of {status.required} required fields configured
              </p>
              {!status.isComplete && (
                <p className="text-xs text-amber-300 mt-2">
                  Complete mapping before sharing your form
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Required Fields Section */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-xs text-red-300">✓</span>
          Required Fields
        </h3>
        <div className="space-y-4">
          {Object.entries(LEAD_FIELDS)
            .filter(([_, config]) => config.required)
            .map(([leadKey, leadConfig]) => {
              const currentMapping = mapping[leadKey as keyof LeadFieldMapping]
              const isDuplicate = currentMapping && isFieldAlreadyMapped(currentMapping, leadKey)

              return (
                <div key={leadKey} className="bg-slate-700/30 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-200 mb-2">
                        {leadConfig.label}
                        <span className="text-red-400 ml-1">*</span>
                      </label>
                      <p className="text-xs text-slate-400">Lead property: <code className="text-slate-300">{leadKey}</code></p>
                    </div>
                    <div className="flex-1">
                      <select
                        value={currentMapping || ''}
                        onChange={(e) => handleMapChange(leadKey, e.target.value || null)}
                        className={`w-full px-3 py-2 bg-slate-700/50 border rounded text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0582BE] outline-none transition ${
                          isDuplicate ? 'border-red-500/50' : 'border-slate-600'
                        }`}
                      >
                        <option value="">Select a form field...</option>
                        {formFieldNames.map((fieldName) => (
                          <option
                            key={fieldName}
                            value={fieldName}
                            disabled={isFieldAlreadyMapped(fieldName, leadKey)}
                          >
                            {fieldName}
                          </option>
                        ))}
                      </select>
                      {isDuplicate && (
                        <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                          <Icon type="alert-circle" size={0.75} color="currentColor" />
                          This form field is already mapped
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      {/* Optional Fields Section */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-slate-600/30 flex items-center justify-center text-xs text-slate-400">○</span>
          Optional Fields
        </h3>
        <div className="space-y-4">
          {Object.entries(LEAD_FIELDS)
            .filter(([_, config]) => !config.required)
            .map(([leadKey, leadConfig]) => {
              const currentMapping = mapping[leadKey as keyof LeadFieldMapping]
              const isDuplicate = currentMapping && isFieldAlreadyMapped(currentMapping, leadKey)

              return (
                <div key={leadKey} className="bg-slate-700/30 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-200 mb-2">
                        {leadConfig.label}
                      </label>
                      <p className="text-xs text-slate-400">Lead property: <code className="text-slate-300">{leadKey}</code></p>
                    </div>
                    <div className="flex-1">
                      <select
                        value={currentMapping || ''}
                        onChange={(e) => handleMapChange(leadKey, e.target.value || null)}
                        className={`w-full px-3 py-2 bg-slate-700/50 border rounded text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0582BE] outline-none transition ${
                          isDuplicate ? 'border-red-500/50' : 'border-slate-600'
                        }`}
                      >
                        <option value="">Unmapped (optional)</option>
                        {formFieldNames.map((fieldName) => (
                          <option
                            key={fieldName}
                            value={fieldName}
                            disabled={isFieldAlreadyMapped(fieldName, leadKey)}
                          >
                            {fieldName}
                          </option>
                        ))}
                      </select>
                      {isDuplicate && (
                        <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                          <Icon type="alert-circle" size={0.75} color="currentColor" />
                          This form field is already mapped
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex gap-3">
          <Icon type="info" size={1} color="#3B82F6" className="flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-200">
            <p className="font-medium mb-1">Mapping Guide</p>
            <ul className="space-y-1 text-xs">
              <li>• Select which form field corresponds to each lead property</li>
              <li>• All required fields must be mapped before publishing</li>
              <li>• Each form field can only map to one lead property</li>
              <li>• Optional fields can be left unmapped</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
