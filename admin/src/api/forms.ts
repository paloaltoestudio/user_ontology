import apiClient from './client'
import { Form, FormCreateRequest } from '../types/form'

export const formsApi = {
  listForms: async (): Promise<Form[]> => {
    const response = await apiClient.get<Form[]>('/api/v1/forms')
    return response.data
  },

  getForm: async (formId: number): Promise<Form> => {
    const response = await apiClient.get<Form>(`/api/v1/forms/${formId}`)
    return response.data
  },

  createForm: async (formData: FormCreateRequest): Promise<Form> => {
    const response = await apiClient.post<Form>('/api/v1/forms', formData)
    return response.data
  },

  updateForm: async (
    formId: number,
    formData: Partial<FormCreateRequest>
  ): Promise<Form> => {
    const response = await apiClient.put<Form>(
      `/api/v1/forms/${formId}`,
      formData
    )
    return response.data
  },

  deleteForm: async (formId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/forms/${formId}`)
  },

  addStep: async (formId: number, stepData: any): Promise<Form> => {
    const response = await apiClient.post<Form>(
      `/api/v1/forms/${formId}/steps`,
      stepData
    )
    return response.data
  },

  deleteStep: async (formId: number, stepId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/forms/${formId}/steps/${stepId}`)
  },

  addField: async (
    formId: number,
    stepId: number,
    fieldData: any
  ): Promise<Form> => {
    const response = await apiClient.post<Form>(
      `/api/v1/forms/${formId}/steps/${stepId}/fields`,
      fieldData
    )
    return response.data
  },

  updateField: async (
    formId: number,
    stepId: number,
    fieldId: number,
    fieldData: any
  ): Promise<Form> => {
    const response = await apiClient.put<Form>(
      `/api/v1/forms/${formId}/steps/${stepId}/fields/${fieldId}`,
      fieldData
    )
    return response.data
  },

  deleteField: async (
    formId: number,
    stepId: number,
    fieldId: number
  ): Promise<void> => {
    await apiClient.delete(
      `/api/v1/forms/${formId}/steps/${stepId}/fields/${fieldId}`
    )
  },

  getFormActions: async (formId: number): Promise<any[]> => {
    const response = await apiClient.get(`/api/v1/actions/forms/${formId}/actions`)
    return response.data
  },

  addActionToForm: async (formId: number, actionId: number): Promise<any> => {
    const response = await apiClient.post(
      `/api/v1/actions/forms/${formId}/actions/${actionId}`
    )
    return response.data
  },

  removeActionFromForm: async (formId: number, actionId: number): Promise<void> => {
    await apiClient.delete(
      `/api/v1/actions/forms/${formId}/actions/${actionId}`
    )
  },
}
