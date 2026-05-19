'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Layers, 
  Tag, 
  Link2, 
  RefreshCw, 
  Info, 
  X, 
  HelpCircle, 
  Check, 
  FileText, 
  Link as LinkIcon, 
  Type,
  Video,
  Pause,
  Play,
  ArrowRight
} from 'lucide-react'

interface Node {
  id: string
  title: string
  group: string
  type?: string
  summary?: string
  url?: string
  tags?: string[]
  createdAt?: string
  x?: number
  y?: number
  vx?: number
  vy?: number
}

interface Link {
  source: string
  target: string
  type: string
  similarity?: number
}

export function MapGraph({ nodes: initialNodes, links: initialLinks, workspaceId }: { nodes: Node[], links: Link[], workspaceId: string }) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Graph Simulation State stored in refs for 60fps canvas performance
  const simulationNodesRef = useRef<Node[]>([])
  const simulationLinksRef = useRef<any[]>([])
  const isSimulatingRef = useRef<boolean>(true)

  // Zoom / Pan state
  const [scale, setScale] = useState(1)
  const scaleRef = useRef(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const offsetRef = useRef({ x: 0, y: 0 })
  
  // UI Toggles & Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['pdf', 'note', 'url', 'doc', 'video'])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showAllLabels, setShowAllLabels] = useState(false)
  const [physicsActive, setPhysicsActive] = useState(true)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [similarityThreshold, setSimilarityThreshold] = useState(0.2) // Filter auto connections by strength if present

  // Selection & Hover State
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null)
  const selectedNodeRef = useRef<Node | null>(null)
  const hoveredNodeRef = useRef<Node | null>(null)

  // Manual Connection Mode State
  const [connectionMode, setConnectionMode] = useState<boolean>(false)
  const [connectionSource, setConnectionSource] = useState<Node | null>(null)
  const [connecting, setConnecting] = useState(false)

  // Interaction State
  const dragNodeRef = useRef<Node | null>(null)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const isPanningRef = useRef(false)
  const panStartRef = useRef({ x: 0, y: 0 })

  // Dimensions
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  // Unique tags list for filters
  const allTagsList = useMemo(() => {
    const tagsSet = new Set<string>()
    initialNodes.forEach(n => {
      if (Array.isArray(n.tags)) {
        n.tags.forEach(t => tagsSet.add(t))
      } else if (n.group && n.group !== 'untagged') {
        tagsSet.add(n.group)
      }
    })
    return Array.from(tagsSet)
  }, [initialNodes])

  // Map nodes to dictionary for fast lookup in links
  const nodeMap = useMemo(() => {
    const map = new Map<string, Node>()
    initialNodes.forEach(n => map.set(n.id, n))
    return map
  }, [initialNodes])

  // Setup / Update Simulation Nodes and Links
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const width = canvas.width
    const height = canvas.height

    // Initialize node positions safely
    const currentSimNodes = simulationNodesRef.current
    const newSimNodes = initialNodes.map(node => {
      const existing = currentSimNodes.find(n => n.id === node.id)
      return {
        ...node,
        // Keep coordinates if node already exists to prevent jumping
        x: existing?.x ?? (width / 2 + (Math.random() - 0.5) * (width * 0.4)),
        y: existing?.y ?? (height / 2 + (Math.random() - 0.5) * (height * 0.4)),
        vx: existing?.vx ?? 0,
        vy: existing?.vy ?? 0
      }
    })
    simulationNodesRef.current = newSimNodes

    // Map link strings to node objects for the layout engine
    simulationLinksRef.current = initialLinks.map(link => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id
      const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id
      return {
        ...link,
        sourceId,
        targetId
      }
    })
  }, [initialNodes, initialLinks])

  // Handle Container Resizing
  useEffect(() => {
    if (!containerRef.current) return

    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: Math.max(containerRef.current.clientHeight, 500)
        })
      }
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(containerRef.current)
    handleResize()

    return () => resizeObserver.disconnect()
  }, [])

  // Sync ref flags
  useEffect(() => {
    isSimulatingRef.current = physicsActive
  }, [physicsActive])

  // Color mapper for node types/groups
  const getNodeColor = (node: Node, isDimmed: boolean) => {
    if (isDimmed) return 'rgba(75, 85, 99, 0.15)' // Dark dimmed gray
    
    // Check type
    const type = (node.type || '').toLowerCase()
    if (type === 'pdf') return '#06b6d4' // Cyan
    if (type === 'url') return '#10b981' // Emerald
    if (type === 'note' || node.tags?.includes('Journal') || node.tags?.includes('Daily-Report')) return '#a855f7' // Purple
    if (type === 'video') return '#f43f5e' // Rose
    
    // Group-based coloring
    if (node.group === 'untagged') return '#9ca3af' // Gray
    return '#eab308' // Amber
  };

  const getNodeIcon = (node: Node) => {
    const type = (node.type || '').toLowerCase()
    if (type === 'pdf') return 'PDF'
    if (type === 'url') return 'URL'
    if (node.tags?.includes('Daily-Report') || node.tags?.includes('Journal')) return 'JRN'
    if (type === 'note') return 'NTE'
    if (type === 'video') return 'VID'
    return 'DOC'
  }

  // Filtered nodes and links to draw
  const filteredData = useMemo(() => {
    const nodes = simulationNodesRef.current
    const links = simulationLinksRef.current

    // Set of active node IDs based on filters
    const activeNodeIds = new Set<string>()

    nodes.forEach(node => {
      // 1. Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchTitle = node.title.toLowerCase().includes(query)
        const matchSummary = (node.summary || '').toLowerCase().includes(query)
        const matchTags = (node.tags || []).some(t => t.toLowerCase().includes(query))
        if (!matchTitle && !matchSummary && !matchTags) return
      }

      // 2. Resource Type filter
      const type = (node.type || 'note').toLowerCase()
      if (!selectedTypes.includes(type)) return

      // 3. Tag filter
      if (selectedTags.length > 0) {
        const hasMatchingTag = (node.tags || []).some(t => selectedTags.includes(t)) || selectedTags.includes(node.group)
        if (!hasMatchingTag) return
      }

      activeNodeIds.add(node.id)
    })

    // Filter links: draw links only if both source and target nodes are visible
    const visibleLinks = links.filter(link => {
      return activeNodeIds.has(link.sourceId) && activeNodeIds.has(link.targetId)
    })

    return {
      visibleNodeIds: activeNodeIds,
      visibleLinks
    }
  }, [searchQuery, selectedTypes, selectedTags, similarityThreshold, dimensions]) // depends on dimensions to sync with tick trigger

  // Physics Simulation Loop
  useEffect(() => {
    let animFrameId: number
    const canvas = canvasRef.current
    if (!canvas) return

    const tick = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const dpr = window.devicePixelRatio || 1
      const width = dimensions.width
      const height = dimensions.height

      // Ensure canvas backing store matches display size * DPR for Retina display sharpness
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr
        canvas.height = height * dpr
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
      }

      // Save context state, apply scaling for Retina display, and clear canvas
      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, width, height)

      const nodes = simulationNodesRef.current
      const links = filteredData.visibleLinks
      const visibleNodeIds = filteredData.visibleNodeIds

      // 1. Apply Force Physics Tick (if active)
      if (isSimulatingRef.current) {
        const centerX = width / 2
        const centerY = height / 2

        // Repel force between all visible nodes (charge force)
        for (let i = 0; i < nodes.length; i++) {
          if (!visibleNodeIds.has(nodes[i].id)) continue
          
          for (let j = i + 1; j < nodes.length; j++) {
            if (!visibleNodeIds.has(nodes[j].id)) continue

            let dx = nodes[j].x! - nodes[i].x!
            let dy = nodes[j].y! - nodes[i].y!
            if (dx === 0) dx = 0.1
            const dist = Math.sqrt(dx * dx + dy * dy)
            
            // Repel range
            if (dist < 320) {
              const repelForce = (170 * 170) / (dist * dist + 10)
              const forceX = (dx / dist) * repelForce * 0.45
              const forceY = (dy / dist) * repelForce * 0.45
              
              if (dragNodeRef.current !== nodes[i]) {
                nodes[i].vx = (nodes[i].vx || 0) - forceX
                nodes[i].vy = (nodes[i].vy || 0) - forceY
              }
              if (dragNodeRef.current !== nodes[j]) {
                nodes[j].vx = (nodes[j].vx || 0) + forceX
                nodes[j].vy = (nodes[j].vy || 0) + forceY
              }
            }
          }
        }

        // Link forces (spring pull)
        links.forEach(link => {
          const source = nodes.find(n => n.id === link.sourceId)
          const target = nodes.find(n => n.id === link.targetId)

          if (source && target) {
            const dx = target.x! - source.x!
            const dy = target.y! - source.y!
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist === 0) return

            // Standard link distance is 140px (increased slightly for larger nodes)
            const desiredDist = 140
            const springK = 0.035
            const force = (dist - desiredDist) * springK
            const forceX = (dx / dist) * force
            const forceY = (dy / dist) * force

            if (dragNodeRef.current !== source) {
              source.vx = (source.vx || 0) + forceX
              source.vy = (source.vy || 0) + forceY
            }
            if (dragNodeRef.current !== target) {
              target.vx = (target.vx || 0) - forceX
              target.vy = (target.vy || 0) - forceY
            }
          }
        })

        // Centering force, collision friction and coordinate update
        nodes.forEach(node => {
          if (!visibleNodeIds.has(node.id)) return
          if (dragNodeRef.current === node) return // Dragged node stays under cursor

          // Gentle pull to center
          const dx = centerX - node.x!
          const dy = centerY - node.y!
          node.vx = (node.vx || 0) + dx * 0.003
          node.vy = (node.vy || 0) + dy * 0.003

          // Update coords
          node.x! += node.vx!
          node.y! += node.vy!

          // Damping friction
          node.vx! *= 0.75
          node.vy! *= 0.75
        })
      }

      // Apply Camera matrix (Offset and Zoom scale)
      ctx.translate(offsetRef.current.x, offsetRef.current.y)
      ctx.scale(scaleRef.current, scaleRef.current)

      // Hover / Selection neighborhood checks
      const activeHoveredNode = hoveredNodeRef.current
      const activeSelectedNode = selectedNodeRef.current
      const activeFocusNode = activeHoveredNode || activeSelectedNode

      const connectedNodeIds = new Set<string>()
      if (activeFocusNode) {
        connectedNodeIds.add(activeFocusNode.id)
        links.forEach(link => {
          if (link.sourceId === activeFocusNode.id) connectedNodeIds.add(link.targetId)
          if (link.targetId === activeFocusNode.id) connectedNodeIds.add(link.sourceId)
        })
      }

      // --- Draw Links ---
      links.forEach(link => {
        const source = nodes.find(n => n.id === link.sourceId)
        const target = nodes.find(n => n.id === link.targetId)

        if (source && target) {
          const isManual = link.type === 'manual'
          const isHighlighted = activeFocusNode && (link.sourceId === activeFocusNode.id || link.targetId === activeFocusNode.id)
          const isDimmed = activeFocusNode && !isHighlighted

          ctx.beginPath()
          ctx.moveTo(source.x!, source.y!)
          ctx.lineTo(target.x!, target.y!)
          
          if (isDimmed) {
            ctx.strokeStyle = 'rgba(75, 85, 99, 0.03)' // Very faint gray
            ctx.lineWidth = 0.5
            ctx.setLineDash([])
          } else {
            ctx.strokeStyle = isManual 
              ? 'rgba(16, 185, 129, 0.65)'  // Vibrant manual link (green)
              : 'rgba(99, 102, 241, 0.45)'  // Indigo auto link
            ctx.lineWidth = isHighlighted ? 3 : 1.2
            if (!isManual) {
              ctx.setLineDash([4, 4]) // Dashed for auto
            } else {
              ctx.setLineDash([])
            }
          }
          ctx.stroke()
          ctx.setLineDash([]) // Reset
        }
      })

      // --- Draw Nodes ---
      nodes.forEach(node => {
        if (!visibleNodeIds.has(node.id)) return

        const isSelected = activeSelectedNode?.id === node.id
        const isHovered = activeHoveredNode?.id === node.id
        const isNeighbor = activeFocusNode && connectedNodeIds.has(node.id)
        const isDimmed = activeFocusNode && !isNeighbor

        // Larger nodes (regular 22px, hovered 26px, selected 32px)
        const radius = isSelected ? 32 : isHovered ? 26 : 22

        // Glow effects for highlighted states
        ctx.save()
        if (isSelected) {
          ctx.shadowBlur = 25
          ctx.shadowColor = getNodeColor(node, false)
        } else if (isHovered) {
          ctx.shadowBlur = 15
          ctx.shadowColor = getNodeColor(node, false)
        }

        // Draw node body
        ctx.beginPath()
        ctx.arc(node.x!, node.y!, radius, 0, 2 * Math.PI)
        ctx.fillStyle = getNodeColor(node, !!isDimmed)
        ctx.fill()

        // Border
        ctx.strokeStyle = isSelected 
          ? '#ffffff' 
          : isHovered 
            ? 'rgba(255, 255, 255, 0.85)' 
            : 'rgba(255, 255, 255, 0.12)'
        ctx.lineWidth = isSelected ? 3.5 : isHovered ? 2.5 : 1.5
        ctx.stroke()
        ctx.restore() // Remove glow from other draws

        // Draw type abbreviation text inside node
        ctx.fillStyle = isDimmed ? 'rgba(156, 163, 175, 0.25)' : '#0a0e14'
        ctx.font = `bold ${Math.round(radius * 0.45)}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(getNodeIcon(node), node.x!, node.y!)

        // Draw Label Title
        const showLabel = showAllLabels || isSelected || isHovered || isNeighbor
        if (showLabel) {
          ctx.font = isSelected 
            ? 'bold 11px sans-serif' 
            : isHovered 
              ? '600 11px sans-serif' 
              : '10px sans-serif'
          
          // Truncate title
          let label = node.title
          if (label.length > 20) label = label.slice(0, 17) + '...'
          
          const textWidth = ctx.measureText(label).width
          const bgW = textWidth + 12
          const bgH = 18
          const bgX = node.x! - bgW / 2
          const bgY = node.y! + radius + 6
          
          // Draw rounded capsule background pill
          ctx.beginPath()
          if ((ctx as any).roundRect) {
            (ctx as any).roundRect(bgX, bgY, bgW, bgH, 5)
          } else {
            ctx.rect(bgX, bgY, bgW, bgH)
          }
          ctx.fillStyle = isSelected 
            ? 'rgba(16, 185, 129, 0.95)' 
            : isDimmed 
              ? 'rgba(10, 14, 20, 0.15)' 
              : 'rgba(10, 14, 20, 0.85)'
          ctx.fill()
          
          ctx.strokeStyle = isSelected 
            ? 'rgba(255, 255, 255, 0.4)' 
            : isDimmed 
              ? 'rgba(255, 255, 255, 0.01)' 
              : 'rgba(255, 255, 255, 0.08)'
          ctx.lineWidth = 1
          ctx.stroke()
          
          // Draw text label
          ctx.fillStyle = isSelected 
            ? '#0a0e14' 
            : isDimmed 
              ? 'rgba(156, 163, 175, 0.2)' 
              : '#ffffff'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(label, node.x!, bgY + bgH / 2)
        }
      })

      // Draw manual connection linking line (preview)
      if (connectionMode && connectionSource) {
        // Find cursor pos relative to transformed canvas
        const currentMouse = hoveredNodeRef.current 
          ? hoveredNodeRef.current 
          : { x: dragStartRef.current.x, y: dragStartRef.current.y } // temporarily use this

        if (currentMouse && currentMouse.x !== undefined) {
          ctx.beginPath()
          ctx.moveTo(connectionSource.x!, connectionSource.y!)
          ctx.lineTo(currentMouse.x!, currentMouse.y!)
          ctx.strokeStyle = '#10b981'
          ctx.lineWidth = 2
          ctx.setLineDash([6, 3])
          ctx.stroke()
          ctx.setLineDash([])
        }
      }

      ctx.restore()

      // Request next frame
      animFrameId = requestAnimationFrame(tick)
    }

    animFrameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animFrameId)
  }, [filteredData, showAllLabels, connectionMode, connectionSource])

  // Map mouse coordinate to Canvas transformed coordinate system
  const getTransformedCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    const screenX = clientX - rect.left
    const screenY = clientY - rect.top
    
    return {
      x: (screenX - offsetRef.current.x) / scaleRef.current,
      y: (screenY - offsetRef.current.y) / scaleRef.current
    }
  }

  // Mouse Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const { x: gx, y: gy } = getTransformedCoordinates(e.clientX, e.clientY)
    
    // 1. Check if we clicked on a node
    const nodes = simulationNodesRef.current
    const visibleNodeIds = filteredData.visibleNodeIds
    
    let clickedNode: Node | null = null
    
    // Scan backward to select larger/on-top nodes first
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i]
      if (!visibleNodeIds.has(node.id)) continue
      
      const isSelected = selectedNodeRef.current?.id === node.id
      const radius = isSelected ? 32 : 22
      const dx = gx - node.x!
      const dy = gy - node.y!
      
      if (dx * dx + dy * dy < radius * radius * 1.5) { // generous click zone
        clickedNode = node
        break
      }
    }

    if (clickedNode) {
      if (connectionMode) {
        // Manual Connection workflow
        if (!connectionSource) {
          setConnectionSource(clickedNode)
        } else if (connectionSource.id !== clickedNode.id) {
          // Confirm connection
          handleCreateConnection(connectionSource, clickedNode)
        }
      } else {
        // Normal Drag / Select workflow
        dragNodeRef.current = clickedNode
        setSelectedNode(clickedNode)
        selectedNodeRef.current = clickedNode
      }
    } else {
      // Background click: Pan camera
      isPanningRef.current = true
      panStartRef.current = {
        x: e.clientX - offsetRef.current.x,
        y: e.clientY - offsetRef.current.y
      }
      
      if (!connectionMode) {
        setSelectedNode(null)
        selectedNodeRef.current = null
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x: gx, y: gy } = getTransformedCoordinates(e.clientX, e.clientY)
    dragStartRef.current = { x: gx, y: gy } // save raw coordinates

    const visibleNodeIds = filteredData.visibleNodeIds

    // 1. Handle dragging a node
    if (dragNodeRef.current) {
      dragNodeRef.current.x = gx
      dragNodeRef.current.y = gy
      dragNodeRef.current.vx = 0
      dragNodeRef.current.vy = 0
      return
    }

    // 2. Handle panning camera
    if (isPanningRef.current) {
      const newOffset = {
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      }
      setOffset(newOffset)
      offsetRef.current = newOffset
      return
    }

    // 3. Hover detection
    const nodes = simulationNodesRef.current
    let currHovered: Node | null = null

    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i]
      if (!visibleNodeIds.has(node.id)) continue
      
      const dx = gx - node.x!
      const dy = gy - node.y!
      const radius = 22
      
      if (dx * dx + dy * dy < radius * radius * 1.5) {
        currHovered = node
        break
      }
    }

    if (currHovered !== hoveredNode) {
      setHoveredNode(currHovered)
      hoveredNodeRef.current = currHovered
    }
  }

  const handleMouseUp = () => {
    dragNodeRef.current = null
    isPanningRef.current = false
  }

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    
    // Zoom factors
    const zoomIntensity = 0.05
    const zoomFactor = e.deltaY < 0 ? (1 + zoomIntensity) : (1 - zoomIntensity)
    const newScale = Math.min(Math.max(scaleRef.current * zoomFactor, 0.15), 5)
    
    // Zoom centered on cursor
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    const gx = (mouseX - offsetRef.current.x) / scaleRef.current
    const gy = (mouseY - offsetRef.current.y) / scaleRef.current
    
    const newOffset = {
      x: mouseX - gx * newScale,
      y: mouseY - gy * newScale
    }
    
    setScale(newScale)
    scaleRef.current = newScale
    setOffset(newOffset)
    offsetRef.current = newOffset
  }

  const resetView = () => {
    setScale(1)
    scaleRef.current = 1
    const initialOffset = { x: 0, y: 0 }
    setOffset(initialOffset)
    offsetRef.current = initialOffset
  }

  // Create Connection API Trigger
  const handleCreateConnection = async (source: Node, target: Node) => {
    setConnecting(true)
    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: source.id,
          targetId: target.id,
          type: 'manual'
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create connection')

      // Terminate connection mode and reload page to fetch fresh links
      setConnectionMode(false)
      setConnectionSource(null)
      router.refresh()
    } catch (err: any) {
      alert(`Error linking nodes: ${err.message}`)
    } finally {
      setConnecting(false)
    }
  }

  // Tag filter selection
  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  // Resource type filter selection
  const toggleTypeFilter = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 relative h-[650px] bg-[#0d1117] rounded-2xl border border-white/[0.06] overflow-hidden group/graph select-none shadow-2xl">
      
      {/* 1. Control Panel Overlay (Top left) */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-[320px] sm:max-w-sm pointer-events-none">
        
        {/* Unified Collapsible Control Deck */}
        <div className="bg-[#0a0e14]/95 backdrop-blur-md border border-white/[0.08] p-3 rounded-2xl flex flex-col gap-3 pointer-events-auto shadow-2xl w-[280px] sm:w-[320px] transition-all duration-300">
          
          {/* Top Bar: Search + Main Actions */}
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="flex-1 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 transition">
              <Search className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-white text-xs placeholder:text-gray-600 focus:outline-none focus:ring-0 w-full"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-gray-500 hover:text-white transition">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Toggle Filters Button */}
            <button
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className={`p-2 rounded-xl border transition flex items-center justify-center shrink-0 ${filtersExpanded ? 'bg-emerald-500 border-emerald-400 text-black animate-none' : 'bg-white/[0.03] border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/5'}`}
              title="Toggle Filters"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>

            {/* Reset Camera Button */}
            <button
              onClick={resetView}
              className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/5 transition shrink-0"
              title="Reset Camera View"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Collapsible Filters Section */}
          {filtersExpanded && (
            <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-3 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Types Filter */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Node Types</span>
                <div className="flex flex-wrap gap-1">
                  {['pdf', 'note', 'url', 'video'].map(type => {
                    const isActive = selectedTypes.includes(type)
                    return (
                      <button
                        key={type}
                        onClick={() => toggleTypeFilter(type)}
                        className={`px-2 py-1 rounded-lg text-[9px] font-semibold transition border ${isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-sm' : 'bg-transparent text-gray-600 border-transparent hover:text-gray-400'}`}
                      >
                        {type.toUpperCase()}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Tags Filter */}
              {allTagsList.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Filter by Tags</span>
                  <div className="flex flex-wrap gap-1 max-h-[100px] overflow-y-auto custom-scrollbar pr-1">
                    {allTagsList.map(tag => {
                      const isActive = selectedTags.includes(tag)
                      return (
                        <button
                          key={tag}
                          onClick={() => toggleTagFilter(tag)}
                          className={`px-2 py-0.5 rounded-md text-[9px] font-medium transition ${isActive ? 'bg-emerald-500 text-[#0a0e14] font-semibold border border-emerald-400' : 'bg-white/[0.02] text-gray-500 border border-white/[0.04] hover:text-gray-400'}`}
                        >
                          #{tag}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Toggles */}
              <div className="flex items-center justify-between border-t border-white/[0.06] pt-2.5">
                <button
                  onClick={() => setShowAllLabels(!showAllLabels)}
                  className={`text-[9px] font-semibold transition px-2.5 py-1 rounded-lg border ${showAllLabels ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : 'text-gray-500 border-transparent bg-white/[0.02] hover:text-gray-300'}`}
                >
                  Titles: {showAllLabels ? 'SHOW ALL' : 'ON HOVER'}
                </button>

                <button
                  onClick={() => setPhysicsActive(!physicsActive)}
                  className={`text-[9px] font-semibold transition px-2.5 py-1 rounded-lg border flex items-center gap-1 bg-white/[0.02] border-transparent ${physicsActive ? 'text-emerald-400 hover:text-emerald-300' : 'text-gray-500 hover:text-gray-400'}`}
                >
                  {physicsActive ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                  Physics: {physicsActive ? 'ACTIVE' : 'PAUSED'}
                </button>
              </div>
            </div>
          )}

          {/* Connection Link Trigger */}
          <button
            onClick={() => {
              setConnectionMode(!connectionMode)
              setConnectionSource(null)
            }}
            className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${connectionMode ? 'bg-red-500/10 border-red-500/35 text-red-400 animate-pulse' : 'bg-emerald-500 hover:bg-emerald-400 border-emerald-400 text-[#0a0e14] active:scale-95 shadow-md shadow-emerald-500/10'}`}
          >
            <Link2 className="w-3.5 h-3.5" />
            {connectionMode ? 'Cancel Manual Link' : 'Link Nodes Manually'}
          </button>

        </div>
      </div>

      {/* 2. Mode State Indicator Overlay (Top Center) */}
      {connectionMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-emerald-500 border border-emerald-400 text-black font-bold px-4 py-1.5 rounded-full text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <Link2 className="w-4 h-4 animate-spin" />
          <span>
            {!connectionSource 
              ? 'Select SOURCE node by clicking on it' 
              : `Linking from [${connectionSource.title.slice(0, 15)}...]. Select TARGET node.`}
          </span>
        </div>
      )}

      {/* 3. The Interactive Canvas */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`w-full h-full cursor-grab active:cursor-grabbing bg-[#0a0e14] ${connectionMode ? 'cursor-cell' : ''}`}
      />

      {/* 4. Node Details Side Panel (Right side) */}
      {selectedNode && (
        <div className="absolute top-4 bottom-4 right-4 z-10 w-72 sm:w-80 bg-[#0a0e14]/95 backdrop-blur-xl border border-white/[0.08] p-5 rounded-2xl flex flex-col gap-4 text-white shadow-2xl animate-in slide-in-from-right-8 duration-300">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                {selectedNode.type === 'pdf' ? (
                  <FileText className="w-4 h-4 text-cyan-400" />
                ) : selectedNode.type === 'url' ? (
                  <LinkIcon className="w-4 h-4 text-emerald-400" />
                ) : selectedNode.type === 'video' ? (
                  <Video className="w-4 h-4 text-rose-400" />
                ) : (
                  <Type className="w-4 h-4 text-purple-400" />
                )}
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{selectedNode.type || 'resource'}</span>
                <p className="text-[11px] text-gray-400 font-mono">{selectedNode.createdAt ? new Date(selectedNode.createdAt).toLocaleDateString() : ''}</p>
              </div>
            </div>
            
            <button 
              onClick={() => {
                setSelectedNode(null)
                if (selectedNodeRef.current?.id === selectedNode.id) {
                  selectedNodeRef.current = null
                }
              }} 
              className="text-gray-500 hover:text-white p-1 rounded-lg bg-white/5 active:scale-95 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Info Details */}
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 pr-1">
            <div>
              <h4 className="font-bold text-white text-sm tracking-tight">{selectedNode.title}</h4>
            </div>

            {selectedNode.summary && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-cyan-400" /> Summary
                </span>
                <p className="text-gray-300 text-xs leading-relaxed bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl">
                  {selectedNode.summary}
                </p>
              </div>
            )}

            {selectedNode.tags && selectedNode.tags.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1">
                  <Tag className="w-3 h-3 text-purple-400" /> Tags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.tags.map(t => (
                    <span key={t} className="text-[9px] bg-white/[0.04] border border-white/[0.06] text-gray-400 px-2 py-0.5 rounded-full font-medium">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action view resource */}
          {selectedNode.id && (
            <div className="pt-2 border-t border-white/[0.06]">
              <a
                href={selectedNode.url || `/workspaces/${workspaceId}`}
                target={selectedNode.url ? "_blank" : "_self"}
                rel="noreferrer"
                className="w-full py-2.5 px-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>View Resource Details</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </a>
            </div>
          )}

        </div>
      )}

      {/* 5. Legend Indicator (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-10 bg-[#0a0e14]/90 backdrop-blur-md border border-white/[0.08] p-3 rounded-2xl flex items-center gap-4 text-[10px] font-medium text-gray-400 shadow-xl pointer-events-auto">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]" />
          <span>PDF / Doc</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
          <span>URL</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#a855f7]" />
          <span>Notes / Journal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]" />
          <span>Video</span>
        </div>
      </div>
      
    </div>
  )
}
