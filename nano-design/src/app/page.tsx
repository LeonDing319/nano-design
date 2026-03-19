'use client'

import { useRef } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { InfiniteCanvas } from '@/components/canvas/InfiniteCanvas'
import { Header } from '@/components/layout/Header'

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  return (
    <div className="flex flex-col h-screen bg-neutral-950">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-hidden">
          <InfiniteCanvas canvasRef={canvasRef} />
        </main>
        <Sidebar canvasRef={canvasRef} />
      </div>
    </div>
  )
}
