import { toast } from 'sonner'

/**
 * Show a success notification
 */
export const toastSuccess = (message: string, description?: string) => {
  return toast.success(message, {
    description,
  })
}

/**
 * Show an error notification
 */
export const toastError = (message: string, description?: string) => {
  return toast.error(message, {
    description,
  })
}

/**
 * Show a warning notification
 */
export const toastWarning = (message: string, description?: string) => {
  return toast.warning(message, {
    description,
  })
}

/**
 * Show an info notification
 */
export const toastInfo = (message: string, description?: string) => {
  return toast.info(message, {
    description,
  })
}

/**
 * Show a loading notification
 */
export const toastLoading = (message: string, description?: string) => {
  return toast.loading(message, {
    description,
  })
}

/**
 * Show a promise-based notification (great for async operations)
 * Usage: await toastPromise(fetchData(), 'Loading...', 'Success!', 'Failed!')
 */
export const toastPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string
    error: string
  }
) => {
  return toast.promise(promise, messages)
}
