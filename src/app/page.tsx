'use client'

import dynamic from 'next/dynamic'

const Workspace = dynamic(() => import('@/components/Workspace'), {
  ssr: false,
  loading: () => <LoadingScreen />,
})

function LoadingScreen() {
  return (
    <div className="w-screen h-screen bg-[#08080c] flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 border-2 border-blue-500/20 rounded-full" />
        <div className="absolute top-0 left-0 w-16 h-16 border-2 border-transparent border-t-blue-500 rounded-full animate-spin" />
      </div>
      <div className="text-white/40 text-sm tracking-widest uppercase">
        Initializing Simulation
      </div>
    </div>
  )
}

export default function Page() {
  return <Workspace />
}
