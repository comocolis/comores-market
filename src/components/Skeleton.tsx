'use client'

export function SkeletonProductCard() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <div className="bg-white rounded-xl p-3 shadow-sm border border-white">
        <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-200" />
        <div className="pt-3 px-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      <div className="h-10 bg-gray-100 rounded-xl" />
    </div>
  )
}

export function SkeletonProductGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[...Array(count)].map((_, i) => (
        <SkeletonProductCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonProfileHeader() {
  return (
    <div className="bg-white -mt-24 rounded-[3rem] shadow-xl relative z-10 p-8 pt-0 flex flex-col items-center text-center border border-white/50 animate-pulse">
      <div className="relative -mt-16 mb-4">
        <div className="w-32 h-32 rounded-[2.5rem] border-[6px] border-white shadow-2xl bg-gray-200" />
      </div>
      
      <div className="space-y-3 w-full max-w-sm">
        <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto" />
        <div className="h-8 bg-gray-100 rounded-full w-1/2 mx-auto" />
      </div>

      <div className="grid grid-cols-3 w-full max-w-sm mt-8 py-6 border-y border-gray-100">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 bg-gray-200 rounded w-8" />
          <div className="h-3 bg-gray-100 rounded w-12" />
        </div>
        <div className="flex flex-col items-center gap-2 border-x border-gray-100 px-4">
          <div className="h-6 bg-gray-200 rounded w-8" />
          <div className="h-3 bg-gray-100 rounded w-12" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 bg-gray-200 rounded w-8" />
          <div className="h-3 bg-gray-100 rounded w-12" />
        </div>
      </div>

      <div className="mt-6 space-y-4 w-full">
        <div className="h-10 bg-gray-100 rounded-full" />
        <div className="h-20 bg-gray-50 rounded-3xl" />
      </div>
    </div>
  )
}

export function SkeletonReviewCard() {
  return (
    <div className="bg-white p-7 rounded-4xl shadow-sm border border-white space-y-4 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gray-200" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-4 h-4 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
        <div className="h-3 bg-gray-200 rounded w-16" />
      </div>
      <div className="h-16 bg-gray-50 rounded-3xl" />
    </div>
  )
}

export function SkeletonReviewsList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <SkeletonReviewCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonSearchResult() {
  return (
    <div className="flex gap-3 p-4 bg-white rounded-2xl border border-gray-100 animate-pulse">
      <div className="w-20 h-20 rounded-lg bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
      </div>
    </div>
  )
}
