import { useMemo, useState } from 'react'
import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useShallow } from 'zustand/react/shallow'
import './App.css'
import GameScene from './components/GameScene'
import { positionKey, useGameStore } from './game/useGameStore'
import type { CellValue, Position } from './game/useGameStore'

const formatCoordinate = (position: Position) =>
  `(${position.x + 1}, ${position.y + 1}, ${position.z + 1})`

const formatCellValue = (value: CellValue) =>
  value === 0 ? 'Empty' : value === 1 ? 'Black' : 'White'
function App() {
  const {
    currentPlayer,
    scores,
    reset,
    gameOver,
    winner,
    board,
    boardSize,
    gameMode,
    setGameMode,
    validMoves,
    placePiece,
    moveLog,
    lastMoveByPlayer,
  } = useGameStore(
    useShallow((state) => ({
      currentPlayer: state.currentPlayer,
      scores: state.scores,
      reset: state.reset,
      gameOver: state.gameOver,
      winner: state.winner,
      board: state.board,
      boardSize: state.boardSize,
      gameMode: state.gameMode,
      setGameMode: state.setGameMode,
      validMoves: state.validMoves,
      placePiece: state.placePiece,
      moveLog: state.moveLog,
      lastMoveByPlayer: state.lastMoveByPlayer,
    })),
  )
  const [sliceMode, setSliceMode] = useState<'xy' | 'xz'>('xy')
  const [sliceHoverKey, setSliceHoverKey] = useState<string | null>(null)
  const whiteLabel = gameMode === 'ai' ? 'White (AI)' : 'White'
  const currentLabel =
    currentPlayer === 1 ? 'Black' : gameMode === 'ai' ? whiteLabel : 'White'
  const winnerLabel =
    winner === 0 ? 'Draw' : winner === 1 ? 'Black' : whiteLabel
  const opponentLastMoveKey = useMemo(() => {
    const opponent = currentPlayer === 1 ? 2 : 1
    const opponentLastMove = lastMoveByPlayer[opponent]
    return opponentLastMove ? positionKey(opponentLastMove) : null
  }, [currentPlayer, lastMoveByPlayer])
  const slices = useMemo(() => {
    if (sliceMode === 'xy') {
      return board.map((layer, index) => ({
        label: `Z ${index + 1}`,
        rows: layer,
      }))
    }
    return Array.from({ length: boardSize }, (_, layerIndex) => ({
      label: `Y ${layerIndex + 1}`,
      rows: board.map((layer) => layer[layerIndex]),
    }))
  }, [board, boardSize, sliceMode])
  const slicePreviewSet = useMemo(() => {
    const set = new Set<string>()
    const hoveredFlips = sliceHoverKey ? validMoves[sliceHoverKey] ?? [] : []
    hoveredFlips.forEach((flip) => {
      set.add(positionKey(flip))
    })
    return set
  }, [sliceHoverKey, validMoves])

  return (
    <div className="app">
      <Canvas className="h-full w-full" camera={{ position: [9, 9, 9], fov: 50 }}>
        <color attach="background" args={['#0f172a']} />
        <GameScene />
        <OrbitControls makeDefault enablePan />
      </Canvas>
      <div className="absolute left-4 top-4 z-10 w-56 rounded-lg bg-slate-900/80 p-4 text-xs text-slate-100 shadow-lg">
        <div className="text-sm font-semibold">Hyper Othello</div>
        <div className="mt-3 space-y-2 text-[11px] text-slate-300">
          <label className="flex flex-col gap-1">
            <span>Board Size</span>
            <select
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
              onChange={(event) => {
                const size = Number(event.target.value) as 4 | 6
                reset(size)
              }}
              value={boardSize}
            >
              <option value={4}>4 x 4 x 4</option>
              <option value={6}>6 x 6 x 6</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span>Mode</span>
            <select
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
              onChange={(event) => {
                const mode = event.target.value === 'ai' ? 'ai' : 'pvp'
                setGameMode(mode)
                reset(boardSize)
              }}
              value={gameMode}
            >
              <option value="pvp">Player vs Player</option>
              <option value="ai">Player vs AI</option>
            </select>
          </label>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-300">
          <span>Status</span>
          <span className="font-semibold text-slate-100">
            {gameOver ? 'Game Over' : currentLabel}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border border-slate-500 bg-slate-900" />
            Black
          </span>
          <span className="font-semibold">{scores[1]}</span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border border-slate-300 bg-slate-100" />
            {whiteLabel}
          </span>
          <span className="font-semibold">{scores[2]}</span>
        </div>
        {gameOver ? (
          <div className="mt-2 text-[11px] text-emerald-300">
            Winner: {winnerLabel}
          </div>
        ) : null}
        <button
          className="mt-3 w-full rounded-md bg-emerald-400/90 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300"
          onClick={() => reset()}
          type="button"
        >
          Reset
        </button>
      </div>
      <div className="absolute right-4 top-4 z-10 w-64 rounded-lg bg-slate-900/80 p-4 text-xs text-slate-100 shadow-lg">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>Slice View</span>
          <select
            className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
            onChange={(event) =>
              setSliceMode(event.target.value === 'xz' ? 'xz' : 'xy')
            }
            value={sliceMode}
          >
            <option value="xy">X-Y (Z layers)</option>
            <option value="xz">X-Z (Y layers)</option>
          </select>
        </div>
        <div className="mt-3 max-h-[70vh] space-y-3 overflow-auto pr-1">
          {slices.map((slice, sliceIndex) => (
            <div key={`${sliceMode}-${sliceIndex}`}>
              <div className="text-[10px] text-slate-400">{slice.label}</div>
              <div
                className="mt-1 grid gap-0.5"
                style={{
                  gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
                }}
              >
                {slice.rows.flatMap((row, rowIndex) =>
                  row.map((cell, cellIndex) => {
                    const position =
                      sliceMode === 'xy'
                        ? { x: cellIndex, y: rowIndex, z: sliceIndex }
                        : { x: cellIndex, y: sliceIndex, z: rowIndex }
                    const key = positionKey(position)
                    const isValid =
                      !gameOver && cell === 0 && Boolean(validMoves[key])
                    const isPreview = slicePreviewSet.has(key)
                    const isOpponentLastMove = opponentLastMoveKey === key
                    const isHoverTarget = sliceHoverKey === key
                    const baseColor =
                      cell === 1
                        ? '#1e293b'
                        : cell === 2
                          ? '#f8fafc'
                          : '#0f172a'
                    const boxShadow = [
                      isHoverTarget
                        ? '0 0 0 2px rgba(56,189,248,0.9) inset'
                        : '',
                      isValid
                        ? '0 0 0 1px rgba(125,211,252,0.7) inset'
                        : '',
                      isPreview
                        ? '0 0 0 2px rgba(244,114,182,0.6) inset'
                        : '',
                      isOpponentLastMove
                        ? '0 0 0 2px rgba(250,204,21,0.75) inset'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(', ')
                    return (
                      <button
                        key={`${slice.label}-${rowIndex}-${cellIndex}`}
                        className="flex h-3 w-3 items-center justify-center rounded-[2px] border border-slate-700"
                        style={{
                          backgroundColor: baseColor,
                          boxShadow: boxShadow || undefined,
                          cursor: isValid ? 'pointer' : 'default',
                        }}
                        onClick={() => {
                          if (!isValid) {
                            return
                          }
                          setSliceHoverKey(null)
                          placePiece(position)
                        }}
                        onMouseEnter={() => {
                          if (isValid) {
                            setSliceHoverKey(key)
                          }
                        }}
                        onMouseLeave={() => {
                          if (sliceHoverKey === key) {
                            setSliceHoverKey(null)
                          }
                        }}
                        type="button"
                      >
                        {isValid ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-300/80" />
                        ) : null}
                      </button>
                    )
                  }),
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-4 right-4 z-10 w-72 rounded-lg bg-slate-900/80 p-4 text-xs text-slate-100 shadow-lg">
        <div className="text-sm font-semibold">Move Log</div>
        <div className="mt-3 max-h-[35vh] space-y-3 overflow-auto pr-1">
          {moveLog.length === 0 ? (
            <div className="text-[11px] text-slate-400">No moves yet.</div>
          ) : (
            [...moveLog].reverse().map((entry) => (
              <div key={entry.moveNumber} className="space-y-1">
                <div className="text-[11px] font-semibold text-slate-200">
                  {entry.moveNumber}.{' '}
                  {entry.player === 1 ? 'Black' : whiteLabel} @{' '}
                  {formatCoordinate(entry.position)}
                </div>
                <div className="space-y-0.5 text-[10px] text-slate-400">
                  {entry.changes.map((change, index) => (
                    <div
                      key={`${entry.moveNumber}-${positionKey(change.position)}-${index}`}
                    >
                      {formatCoordinate(change.position)}{' '}
                      {formatCellValue(change.from)} →{' '}
                      {formatCellValue(change.to)}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default App
