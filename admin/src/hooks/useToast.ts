import { useToastContext } from '../components/Toast/ToastContainer'

export function useToast() {
  const { addToast } = useToastContext()

  return {
    success: (message: string, duration?: number) =>
      addToast(message, 'success', duration),
    error: (message: string, duration?: number) =>
      addToast(message, 'error', duration),
    info: (message: string, duration?: number) =>
      addToast(message, 'info', duration),
    warning: (message: string, duration?: number) =>
      addToast(message, 'warning', duration),
  }
}
