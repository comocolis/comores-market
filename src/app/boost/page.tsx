
import BoostClientPage from './BoostClientPage'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin"></div></div>}>
      <BoostClientPage />
    </Suspense>
  )
}
