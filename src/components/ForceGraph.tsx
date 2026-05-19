'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'

// react-force-graph needs to be dynamically imported with SSR disabled
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

interface Node {
  id: string
  title: string
  group: string
  val: number
}

interface Link {
  source: string
  target: string
  type: string
}

export function MapGraph({ nodes, links }: { nodes: Node[], links: Link[] }) {
  const fgRef = useRef<any>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      })
    }

    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        })
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleNodeClick = useCallback((node: any) => {
    // Zoom in on node
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 1000)
      fgRef.current.zoom(8, 2000)
    }
  }, [])

  return (
    <div ref={containerRef} className="w-full h-[calc(100vh-140px)] bg-[#0a0e14] rounded-xl border border-white/[0.06] overflow-hidden">
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={{ nodes, links }}
        nodeLabel="title"
        nodeAutoColorBy="group"
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        onNodeClick={handleNodeClick}
        nodeRelSize={6}
        linkColor={(link: any) => link.type === 'manual' ? '#ef4444' : '#9ca3af'}
        linkWidth={(link: any) => link.type === 'manual' ? 2 : 1}
      />
    </div>
  )
}
