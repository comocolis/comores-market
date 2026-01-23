import { Toaster } from 'sonner'
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react'

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      theme="light"
      richColors
      expand
      closeButton
      icons={{
        success: <CheckCircle2 size={20} className="text-emerald-600" />,
        error: <AlertCircle size={20} className="text-red-600" />,
        warning: <AlertTriangle size={20} className="text-amber-600" />,
        info: <Info size={20} className="text-blue-600" />,
        loading: (
          <div className="animate-spin">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ),
      }}
      visibleToasts={3}
      duration={3000}
    />
  )
}
