import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { formsApi } from '../api/forms'
import { Form, FormField } from '../types/form'
import { useToast } from '../hooks/useToast'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? ''

export function PublicFormPage() {
  const { formId } = useParams()
  const { success: showSuccess, error: showError } = useToast()
  const storageKey = `form_${formId}_data`

  // Initialize from localStorage if available
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [stepError, setStepError] = useState('')
  const [isFormSubmitted, setIsFormSubmitted] = useState(false)

  const { data: form, isLoading, error } = useQuery({
    queryKey: ['public-form', formId],
    queryFn: () => formsApi.getForm(Number(formId)),
  })

  // Save formData to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(formData))
      console.log('Form data saved to localStorage:', formData)
    } catch {
      console.error('Failed to save form data to localStorage')
    }
  }, [formData, storageKey])

  const handleInputChange = (fieldId: number, value: any) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [fieldId]: value,
      }
      console.log('formData updated:', updated)
      return updated
    })
  }

  const validateCurrentStep = (): boolean => {
    if (!form || !form.display_as_steps) return true

    const currentStep = form.steps[currentStepIndex]
    if (!currentStep) return true

    const fieldsToValidate = currentStep.fields.filter((field) => field.required)

    for (const field of fieldsToValidate) {
      if (!formData[field.id]) {
        setStepError(`${field.field_name} is required`)
        return false
      }
    }

    setStepError('')
    return true
  }

  const handleNextStep = () => {
    console.log('handleNextStep called')
    if (!validateCurrentStep()) {
      console.log('Current step validation failed')
      return
    }

    if (form && currentStepIndex < form.steps.length - 1) {
      console.log('Moving to next step. Current formData:', formData)
      setCurrentStepIndex(currentStepIndex + 1)
      setStepError('')
    }
  }

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      console.log('Moving to previous step. Current formData:', formData)
      setCurrentStepIndex(currentStepIndex - 1)
      setStepError('')
    }
  }

  const handleStartNewSubmission = () => {
    setIsFormSubmitted(false)
    setFormData({})
    setCurrentStepIndex(0)
    setStepError('')
    localStorage.removeItem(storageKey)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('handleSubmit called - form submission triggered!')
    e.preventDefault()

    if (!form) return

    // Phase 5: Validate lead field mapping is complete
    const mapping = form.lead_field_mapping || {}
    if (!mapping.name || !mapping.last_name || !mapping.email) {
      showError('This form is not properly configured. Please contact the form owner.')
      console.error('Form missing required lead field mappings')
      return
    }

    // Validate required form fields
    console.log('Validating all form steps...')
    for (const step of form.steps) {
      for (const field of step.fields) {
        if (field.required && !formData[field.id]) {
          showError(`${field.field_name} is required`)
          return
        }
      }
    }

    // Phase 5: Validate mapped fields are not empty
    const allFields = form.steps.flatMap(s => s.fields)
    const mappedFieldIds = new Set<number>()

    // Collect all field IDs that are mapped to lead properties
    const fieldNameToId = new Map<string, number>()
    allFields.forEach(field => {
      fieldNameToId.set(field.field_name, field.id)
    })

    // Validate required lead field mappings have values
    const requiredLeadMappings = [
      { key: 'name' as const, label: 'First Name' },
      { key: 'last_name' as const, label: 'Last Name' },
      { key: 'email' as const, label: 'Email' },
    ]

    for (const { key, label } of requiredLeadMappings) {
      const fieldName = mapping[key]
      const fieldId = fieldNameToId.get(fieldName!)
      if (fieldId && !formData[fieldId]) {
        showError(`${label} is required`)
        return
      }
    }

    try {
      setIsSubmitting(true)

      // Transform formData from field IDs to field names
      const transformedData: Record<string, any> = {}
      for (const step of form.steps) {
        for (const field of step.fields) {
          if (formData[field.id] !== undefined && formData[field.id] !== '') {
            transformedData[field.field_name] = formData[field.id]
          }
        }
      }

      // Phase 4: Extract lead data using field mapping
      const leadData: Record<string, any> = {}
      const mapping = form.lead_field_mapping || {}

      // Map required lead fields
      if (mapping.name) {
        leadData.name = transformedData[mapping.name] || ''
      }
      if (mapping.last_name) {
        leadData.last_name = transformedData[mapping.last_name] || ''
      }
      if (mapping.email) {
        leadData.email = transformedData[mapping.email] || ''
      }

      // Map optional lead fields (only if mapping exists)
      if (mapping.phone) {
        leadData.phone = transformedData[mapping.phone] || null
      }
      if (mapping.company) {
        leadData.company = transformedData[mapping.company] || null
      }
      if (mapping.company_url) {
        leadData.company_url = transformedData[mapping.company_url] || null
      }

      console.log('Extracted lead data:', leadData)
      console.log('Full form data:', transformedData)

      // Submit to API with both structured lead data and full form data
      const response = await fetch(
        `${API_BASE_URL}/api/v1/leads/submit/${form.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: leadData.name,
            last_name: leadData.last_name,
            email: leadData.email,
            phone: leadData.phone,
            company: leadData.company,
            company_url: leadData.company_url,
            form_data: transformedData,
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Submission failed with status ${response.status}`)
      }

      const result = await response.json()
      console.log('Form submission successful:', result)

      setIsFormSubmitted(true)
      setFormData({})
      localStorage.removeItem(storageKey)
      setCurrentStepIndex(0)
      showSuccess('Form submitted successfully!')
    } catch (err) {
      console.error('Form submission error:', err)
      showError(err instanceof Error ? err.message : 'Failed to submit form')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0582BE]"></div>
      </div>
    )
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-8 max-w-md">
          <h2 className="text-red-300 font-semibold mb-2">Form Not Found</h2>
          <p className="text-red-200 text-sm">The form you're looking for doesn't exist or is no longer available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {isFormSubmitted ? (
          // Thank You Screen
          <div className="text-center space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#0582BE] to-blue-600 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="relative w-24 h-24 bg-gradient-to-r from-[#0582BE] to-blue-600 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '0.1s' }}>
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Thank You Message */}
            <div className="space-y-3">
              <h2 className="text-4xl font-bold text-white">Thank You!</h2>
              <p className="text-xl text-slate-400">Your submission has been received successfully.</p>
            </div>

            {/* Details */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-left space-y-4 my-8">
              <div>
                <p className="text-sm text-slate-400 mb-1">Form</p>
                <p className="text-white font-medium">{form.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Submission ID</p>
                <p className="text-white font-mono text-sm">{formId}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Submitted at</p>
                <p className="text-white">{new Date().toLocaleString()}</p>
              </div>
            </div>

            {/* Message */}
            <p className="text-slate-300 text-lg">
              We'll review your submission and get back to you soon.
            </p>

            {/* Action Button */}
            <button
              onClick={handleStartNewSubmission}
              className="mt-8 px-8 py-3 bg-gradient-to-r from-[#0582BE] to-blue-600 hover:from-[#0582BE] hover:to-blue-700 text-white font-medium rounded-lg transition"
            >
              Submit Another Response
            </button>
          </div>
        ) : (
          <>
            {/* Form Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">{form.name}</h1>
              {form.description && (
                <p className="text-slate-400">{form.description}</p>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
          {form.display_as_steps ? (
            <>
              {/* Step-by-Step Mode */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-8">
                {/* Progress Indicator */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-slate-400">
                      Step {currentStepIndex + 1} of {form.steps.length}
                    </p>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0582BE] to-blue-600 transition-all duration-300"
                      style={{
                        width: `${((currentStepIndex + 1) / form.steps.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Current Step */}
                {form.steps[currentStepIndex] && (
                  <div>
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold text-white">
                        {form.steps[currentStepIndex].title}
                      </h2>
                      {form.steps[currentStepIndex].description && (
                        <p className="text-slate-400 text-sm mt-1">
                          {form.steps[currentStepIndex].description}
                        </p>
                      )}
                    </div>

                    {/* Step Fields */}
                    <div className="space-y-6 mb-6">
                      {form.steps[currentStepIndex].fields
                        .sort((a, b) => a.display_order - b.display_order)
                        .map((field) => {
                          console.log(`Rendering field ${field.id}: value = ${formData[field.id]}`)
                          return (
                            <FormFieldInput
                              key={field.id}
                              field={field}
                              value={formData[field.id] ?? ''}
                              onChange={(value) => handleInputChange(field.id, value)}
                            />
                          )
                        })}
                    </div>

                    {/* Step Error */}
                    {stepError && (
                      <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-lg mb-6">
                        <p className="text-sm text-red-300">{stepError}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step Navigation */}
                <div className="flex gap-3 pt-6 border-t border-slate-700">
                  {currentStepIndex > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handlePreviousStep()
                      }}
                      className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition"
                    >
                      ← Previous
                    </button>
                  )}

                  {currentStepIndex < form.steps.length - 1 ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleNextStep()
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-[#0582BE] to-blue-600 hover:from-[#0582BE] hover:to-blue-700 text-white font-medium rounded-lg transition"
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-gradient-to-r from-[#0582BE] to-blue-600 hover:from-[#0582BE] hover:to-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit'}
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* All Steps at Once */}
              {form.steps.map((step) => (
                <div key={step.id} className="bg-slate-800 rounded-xl border border-slate-700 p-8">
                  {/* Step Header */}
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-white">{step.title}</h2>
                    {step.description && (
                      <p className="text-slate-400 text-sm mt-1">{step.description}</p>
                    )}
                  </div>

                  {/* Step Fields */}
                  <div className="space-y-6">
                    {step.fields
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((field) => (
                        <FormFieldInput
                          key={field.id}
                          field={field}
                          value={formData[field.id] ?? ''}
                          onChange={(value) => handleInputChange(field.id, value)}
                        />
                      ))}
                  </div>
                </div>
              ))}

              {/* Submit Button */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-gradient-to-r from-[#0582BE] to-blue-600 hover:from-[#0582BE] hover:to-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </>
          )}
            </form>
          </>
        )}
      </div>
    </div>
  )
}

interface FormFieldInputProps {
  field: FormField
  value: any
  onChange: (value: any) => void
}

function FormFieldInput({ field, value, onChange }: FormFieldInputProps) {
  const commonInputClasses =
    'w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0582BE] outline-none transition'

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {field.field_name}
        {field.required && <span className="text-red-400 ml-1">*</span>}
      </label>

      {field.field_type === 'text' && (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => {
            console.log(`Field ${field.id} changed to: ${e.target.value}`)
            onChange(e.target.value)
          }}
          placeholder={field.help_text || ''}
          className={commonInputClasses}
        />
      )}

      {field.field_type === 'email' && (
        <input
          type="email"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.help_text || ''}
          className={commonInputClasses}
        />
      )}

      {field.field_type === 'password' && (
        <input
          type="password"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.help_text || ''}
          className={commonInputClasses}
        />
      )}

      {field.field_type === 'number' && (
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.help_text || ''}
          className={commonInputClasses}
        />
      )}

      {field.field_type === 'textarea' && (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.help_text || ''}
          rows={4}
          className={commonInputClasses}
        />
      )}

      {field.field_type === 'date' && (
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={commonInputClasses}
        />
      )}

      {field.field_type === 'select' && (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={commonInputClasses}
        >
          <option value="">Select an option</option>
          {field.field_options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}

      {field.field_type === 'checkbox' && (
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 rounded border-slate-600 bg-slate-700/50 accent-[#0582BE]"
        />
      )}

      {field.help_text && field.field_type !== 'text' && field.field_type !== 'email' && (
        <p className="text-xs text-slate-500 mt-1">{field.help_text}</p>
      )}
    </div>
  )
}
