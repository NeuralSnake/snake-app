"use client"

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { db } from '@/lib/firebaseClient'
import { doc, onSnapshot } from 'firebase/firestore'
import TransactionCard from '@/components/TransactionCard'
import GoldenAppleNotification from '@/components/GoldenAppleNotification'

interface Position {
  x: number
  y: number
}

interface GoldenAppleSpawnData {
  tx_id: string
  amount: number
  time: number
}

interface SnakeState {
  snake: Position[]
  apple: Position
  direction: Position
  score: number
  is_golden_apple?: boolean
  apple_spawned_by?: GoldenAppleSpawnData | null
}

const Home: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [cellSize, setCellSize] = useState<number>(40)
  const [segmentSize, setSegmentSize] = useState<number>(40)

  const [camera, setCamera] = useState<Position>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [lastMousePos, setLastMousePos] = useState<Position>({ x: 0, y: 0 })

  const [snakeData, setSnakeData] = useState<SnakeState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [initialFocusSet, setInitialFocusSet] = useState(false)

  // For handling pinch-zoom
  const [touches, setTouches] = useState<React.Touch[]>([])
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null)
  const [initialCellSize, setInitialCellSize] = useState<number>(40)
  const [initialPinchMidWorld, setInitialPinchMidWorld] = useState<Position | null>(null)
  const [initialPinchCamera, setInitialPinchCamera] = useState<Position | null>(null)

  // Images for snake components
  const [appleImg, setAppleImg] = useState<HTMLImageElement | null>(null)
  const [goldenAppleImg, setGoldenAppleImg] = useState<HTMLImageElement | null>(null)
  const [headImg, setHeadImg] = useState<HTMLImageElement | null>(null)
  const [tailImg, setTailImg] = useState<HTMLImageElement | null>(null)
  const [bodyStraightImg, setBodyStraightImg] = useState<HTMLImageElement | null>(null)

  // Pre-rotated corner images
  const [bodyCornerUpLeftImg, setBodyCornerUpLeftImg] = useState<HTMLImageElement | null>(null)
  const [bodyCornerLeftDownImg, setBodyCornerLeftDownImg] = useState<HTMLImageElement | null>(null)
  const [bodyCornerDownRightImg, setBodyCornerDownRightImg] = useState<HTMLImageElement | null>(null)
  const [bodyCornerRightUpImg, setBodyCornerRightUpImg] = useState<HTMLImageElement | null>(null)

  const [showNotification, setShowNotification] = useState(true)

  useEffect(() => {
    const snakeDocRef = doc(db, 'gameState', 'snakeState')
    const unsub = onSnapshot(
      snakeDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as SnakeState
          setSnakeData(data)
          console.log("Snake state:", data)
        } else {
          console.log("No snakeState found.")
        }
        setIsLoading(false)
      },
      (error) => {
        console.error("Error fetching snakeState:", error)
        setIsLoading(false)
      }
    )

    return () => unsub()
  }, [])

  useEffect(() => {
    // Once we have snakeData, if we haven't set the initial focus yet, do it.
    if (snakeData && !initialFocusSet) {
      handleLocateSnake()
      setInitialFocusSet(true)
    }
  }, [snakeData, initialFocusSet])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const worldX = (mouseX + camera.x) / cellSize
      const worldY = (mouseY + camera.y) / cellSize

      const zoomFactor = 1.05
      let newCellSize: number

      if (e.deltaY < 0) {
        newCellSize = cellSize * zoomFactor
      } else {
        newCellSize = cellSize / zoomFactor
      }

      const newSegmentSize = newCellSize
      const newCamera = {
        x: worldX * newCellSize - mouseX,
        y: worldY * newCellSize - mouseY,
      }

      setCamera(newCamera)
      setCellSize(newCellSize)
      setSegmentSize(newSegmentSize)
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [camera, cellSize])

  const toScreenCoords = useCallback((x: number, y: number) => {
    return {
      sx: x * cellSize - camera.x,
      sy: y * cellSize - camera.y
    }
  }, [camera, cellSize])

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)'
    ctx.lineWidth = 0.5
    ctx.font = '10px Arial'
    ctx.fillStyle = '#000'

    const startX = Math.floor(camera.x / cellSize) * cellSize - camera.x
    const startY = Math.floor(camera.y / cellSize) * cellSize - camera.y

    const dynamicLabelInterval = Math.max(1, Math.floor(40 / cellSize))

    for (let x = startX; x < width; x += cellSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
      const gridX = Math.floor((x + camera.x) / cellSize)
      if (gridX % dynamicLabelInterval === 0) {
        ctx.fillText(gridX.toString(), x + 2, 10)
      }
    }

    for (let y = startY; y < height; y += cellSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
      const gridY = Math.floor((y + camera.y) / cellSize)
      if (gridY % dynamicLabelInterval === 0) {
        ctx.fillText(gridY.toString(), 2, y - 2)
      }
    }
  }, [camera, cellSize])

  // Load images once
  useEffect(() => {
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.src = src
        img.onload = () => resolve(img)
        img.onerror = reject
      })
    }

    const loadAll = async () => {
      try {
        const appleI = await loadImage('/apple.png')
        const goldenAppleI = await loadImage('/golden_apple.png')
        const headI = await loadImage('/snake_head.svg')
        const tailI = await loadImage('/snake_tail.svg')
        const bodyStraightI = await loadImage('/snake_body_straight.svg')

        const bodyCornerUpLeftI = await loadImage('/body_corner_up_left.svg')
        const bodyCornerLeftDownI = await loadImage('/body_corner_left_down.svg')
        const bodyCornerDownRightI = await loadImage('/body_corner_down_right.svg')
        const bodyCornerRightUpI = await loadImage('/body_corner_right_up.svg')

        setAppleImg(appleI)
        setGoldenAppleImg(goldenAppleI)
        setHeadImg(headI)
        setTailImg(tailI)
        setBodyStraightImg(bodyStraightI)
        setBodyCornerUpLeftImg(bodyCornerUpLeftI)
        setBodyCornerLeftDownImg(bodyCornerLeftDownI)
        setBodyCornerDownRightImg(bodyCornerDownRightI)
        setBodyCornerRightUpImg(bodyCornerRightUpI)
      } catch (e) {
        console.error('Error loading images:', e)
      }
    }

    (async () => {
      await loadAll()
    })()
  }, [])

  const getDirection = (from: Position, to: Position) => {
    const dx = to.x - from.x
    const dy = to.y - from.y
    if (dx === 1 && dy === 0) return 'right'
    if (dx === -1 && dy === 0) return 'left'
    if (dx === 0 && dy === 1) return 'down'
    if (dx === 0 && dy === -1) return 'up'
    return null
  }

  const rotateForDirection = (ctx: CanvasRenderingContext2D, direction: string, cx: number, cy: number) => {
    ctx.translate(cx, cy)
    let angle = 0
    if (direction === 'up') angle = -Math.PI / 2
    else if (direction === 'down') angle = Math.PI / 2
    else if (direction === 'left') angle = Math.PI
    else if (direction === 'right') angle = 0
    ctx.rotate(angle)
    ctx.translate(-cx, -cy)
  }

  const getCornerImage = (prevDir: string, nextDir: string): HTMLImageElement | null => {
    const turnMap: Record<string, HTMLImageElement | null> = {
      'down_right': bodyCornerDownRightImg,
      'right_up': bodyCornerRightUpImg,
      'up_left': bodyCornerUpLeftImg,
      'left_down': bodyCornerLeftDownImg,
      'right_down': bodyCornerUpLeftImg,
      'up_right': bodyCornerLeftDownImg,
      'left_up': bodyCornerDownRightImg,
      'down_left': bodyCornerRightUpImg,
    }

    const turnKey = `${prevDir}_${nextDir}`
    return turnMap[turnKey] || bodyStraightImg
  }

  const drawApple = useCallback((ctx: CanvasRenderingContext2D, apple: Position, isGolden?: boolean) => {
    if (!appleImg || !goldenAppleImg) return
    const { sx, sy } = toScreenCoords(apple.x, apple.y)
    const size = segmentSize * 0.8

    const imgToUse = isGolden ? goldenAppleImg : appleImg
    ctx.drawImage(imgToUse, sx - size/2, sy - size/2, size, size)
  }, [toScreenCoords, segmentSize, appleImg, goldenAppleImg])

  const drawSnake = useCallback((ctx: CanvasRenderingContext2D, snake: Position[]) => {
    if (!headImg || !tailImg || !bodyStraightImg || !bodyCornerUpLeftImg || !bodyCornerLeftDownImg || !bodyCornerDownRightImg || !bodyCornerRightUpImg) return

    for (let i = 0; i < snake.length; i++) {
      const seg = snake[i]
      const { sx, sy } = toScreenCoords(seg.x, seg.y)
      const size = segmentSize

      ctx.save()
      let img: HTMLImageElement | null = null

      if (i === 0) {
        // Head
        img = headImg
        let direction = 'right'
        if (snake.length > 1) {
          const nextSeg = snake[i+1]
          const dir = getDirection(seg, nextSeg)
          if (dir) direction = dir
        }
        rotateForDirection(ctx, direction, sx, sy)
        ctx.drawImage(img, sx - size/2, sy - size/2, size, size)
      } else if (i === snake.length - 1) {
        // Tail
        img = tailImg
        let direction = 'right'
        const prevSeg = snake[i-1]
        const dir = getDirection(prevSeg, seg)
        if (dir) direction = dir
        rotateForDirection(ctx, direction, sx, sy)
        ctx.drawImage(img, sx - size/2, sy - size/2, size, size)
      } else {
        // Body segment
        const prevSeg = snake[i-1]
        const nextSeg = snake[i+1]
        const prevDir = getDirection(prevSeg, seg)
        const nextDir = getDirection(seg, nextSeg)

        if (!prevDir || !nextDir) {
          img = bodyStraightImg
          ctx.drawImage(img, sx - size/2, sy - size/2, size, size)
          ctx.restore()
          continue
        }

        if (prevDir === nextDir) {
          // Straight segment
          img = bodyStraightImg
          rotateForDirection(ctx, prevDir, sx, sy)
          ctx.drawImage(img, sx - size/2, sy - size/2, size, size)
        } else {
          // Corner segment
          const cornerImg = getCornerImage(prevDir, nextDir)
          if (cornerImg) {
            ctx.drawImage(cornerImg, sx - size/2, sy - size/2, size, size)
          } else {
            ctx.drawImage(bodyStraightImg, sx - size/2, sy - size/2, size, size)
          }
        }
      }
      ctx.restore()
    }
  }, [
    toScreenCoords,
    segmentSize,
    headImg,
    tailImg,
    bodyStraightImg,
    bodyCornerUpLeftImg,
    bodyCornerLeftDownImg,
    bodyCornerDownRightImg,
    bodyCornerRightUpImg
  ])

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const pixelRatio = window.devicePixelRatio || 1
    const width = canvas.width / pixelRatio
    const height = canvas.height / pixelRatio

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    drawGrid(ctx, width, height)

    if (snakeData) {
      drawApple(ctx, snakeData.apple, snakeData.is_golden_apple)
      drawSnake(ctx, snakeData.snake)
    }
  }, [camera, cellSize, segmentSize, snakeData, drawGrid, drawApple, drawSnake])

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const container = canvas.parentElement
      if (!container) return
      const width = container.clientWidth
      const height = container.clientHeight

      const pixelRatio = window.devicePixelRatio || 1
      canvas.width = width * pixelRatio
      canvas.height = height * pixelRatio

      canvas.style.width = '100%'
      canvas.style.height = '100%'

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      renderCanvas()
    }

    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [renderCanvas])

  useEffect(() => {
    renderCanvas()
  }, [camera, cellSize, segmentSize, snakeData, renderCanvas])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      setIsDragging(true)
      setLastMousePos({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      const dx = e.clientX - lastMousePos.x
      const dy = e.clientY - lastMousePos.y
      setCamera(prev => ({ x: prev.x - dx, y: prev.y - dy }))
      setLastMousePos({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch2.clientX - touch1.clientX
    const dy = touch2.clientY - touch1.clientY
    return Math.sqrt(dx*dx + dy*dy)
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const currentTouches = Array.from(e.touches)
    if (currentTouches.length === 1) {
      setIsDragging(true)
      setLastMousePos({ x: currentTouches[0].clientX, y: currentTouches[0].clientY })
    } else if (currentTouches.length === 2) {
      const dist = getDistance(currentTouches[0], currentTouches[1])
      setInitialPinchDistance(dist)
      setInitialCellSize(cellSize)

      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()

      // Compute the midpoint on screen
      const midX = (currentTouches[0].clientX + currentTouches[1].clientX) / 2 - rect.left
      const midY = (currentTouches[0].clientY + currentTouches[1].clientY) / 2 - rect.top

      // Convert that midpoint to world coordinates at the start of pinch
      const worldX = (midX + camera.x) / cellSize
      const worldY = (midY + camera.y) / cellSize

      setInitialPinchMidWorld({ x: worldX, y: worldY })
      setInitialPinchCamera({ x: camera.x, y: camera.y })
    }
    setTouches(currentTouches)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const currentTouches = Array.from(e.touches)
    setTouches(currentTouches)

    // Single-finger drag
    if (currentTouches.length === 1 && isDragging) {
      const dx = currentTouches[0].clientX - lastMousePos.x
      const dy = currentTouches[0].clientY - lastMousePos.y
      setCamera(prev => ({ x: prev.x - dx, y: prev.y - dy }))
      setLastMousePos({ x: currentTouches[0].clientX, y: currentTouches[0].clientY })
    }

    // Two-finger pinch
    else if (currentTouches.length === 2 && initialPinchDistance !== null && initialPinchCamera && initialPinchMidWorld) {
      const newDist = getDistance(currentTouches[0], currentTouches[1])
      const ratio = newDist / initialPinchDistance

      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()

      // Current midpoint on screen
      const midX = (currentTouches[0].clientX + currentTouches[1].clientX) / 2 - rect.left
      const midY = (currentTouches[0].clientY + currentTouches[1].clientY) / 2 - rect.top

      // We know the initial pinch world coords and camera, now apply the ratio
      const newCellSize = initialCellSize * ratio
      const newSegmentSize = newCellSize

      // Reposition camera so that initial pinch world point stays at the same screen point
      const newCamera = {
        x: initialPinchMidWorld.x * newCellSize - midX,
        y: initialPinchMidWorld.y * newCellSize - midY,
      }

      setCamera(newCamera)
      setCellSize(newCellSize)
      setSegmentSize(newSegmentSize)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const currentTouches = Array.from(e.touches)
    setTouches(currentTouches)

    if (currentTouches.length < 2) {
      setInitialPinchDistance(null)
      setInitialPinchMidWorld(null)
      setInitialPinchCamera(null)
    }
    if (currentTouches.length === 0) {
      setIsDragging(false)
    }
  }

  const handleLocateSnake = () => {
    if (!snakeData || !snakeData.snake || snakeData.snake.length === 0) return
    // Center camera on snake (average position)
    const snake = snakeData.snake
    const avgX = snake.reduce((sum, seg) => sum + seg.x, 0) / snake.length
    const avgY = snake.reduce((sum, seg) => sum + seg.y, 0) / snake.length

    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    const newCamera = {
      x: avgX * cellSize - width / 2,
      y: avgY * cellSize - height / 2,
    }

    setCamera(newCamera)
  }

  return (
    <div
      className="fixed inset-0 select-none bg-white"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        zIndex: 0
      }}
    >
      {/* For better mobile responsiveness, ensure you have:
          <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
      */}

      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          touchAction: 'none',
          display: 'block',
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1
        }}
      />

      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 9999 }}>
        <TransactionCard/>
        {snakeData?.is_golden_apple && snakeData.apple_spawned_by && showNotification && (
          <GoldenAppleNotification
            tx_id={snakeData.apple_spawned_by.tx_id}
            amount={snakeData.apple_spawned_by.amount}
            time={snakeData.apple_spawned_by.time}
            onClose={() => setShowNotification(false)}
          />
        )}
      </div>

      <div style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999
      }}>
        <button
          onClick={handleLocateSnake}
          style={{
            background: '#000',
            color: '#fff',
            borderRadius: '8px',
            padding: '15px 25px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Locate Snake
        </button>
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-50">
          <div className="text-gray-600 flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            Loading...
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
