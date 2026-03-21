'use client'

import { useRef } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { InfiniteCanvas } from '@/components/canvas/InfiniteCanvas'
import { SettingsPanel } from '@/components/layout/SettingsPanel'

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  return (
    <div className="flex flex-col h-screen bg-neutral-950">
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-hidden">
          <InfiniteCanvas canvasRef={canvasRef} />
        </main>
        <Sidebar canvasRef={canvasRef} />
      </div>
      <SettingsPanel />
    </div>
  )
}
