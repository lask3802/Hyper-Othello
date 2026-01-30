import { useMemo, useState } from 'react'
import { BoxGeometry } from 'three'
import { useShallow } from 'zustand/react/shallow'
import { positionKey, useGameStore } from '../game/useGameStore'
import type { CellValue } from '../game/useGameStore'

const spacing = 1.2
const edgeGeometry = new BoxGeometry(0.9, 0.9, 0.9)

interface CellProps {
  position: [number, number, number]
  value: CellValue
  isValid: boolean
  isPreview: boolean
  isHoverTarget: boolean
  isLastMove: boolean
  onHover: () => void
  onBlur: () => void
  onClick: () => void
}

const Cell = ({
  position,
  value,
  isValid,
  isPreview,
  isHoverTarget,
  isLastMove,
  onHover,
  onBlur,
  onClick,
}: CellProps) => (
  <group position={position}>
    <lineSegments>
      <edgesGeometry args={[edgeGeometry]} />
      <lineBasicMaterial color="#475569" transparent opacity={0.45} />
    </lineSegments>
    {value !== 0 ? (
      <mesh>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial
          color={value === 1 ? '#1e293b' : '#f8fafc'}
          metalness={0.1}
          roughness={0.4}
        />
      </mesh>
    ) : null}
    {isLastMove ? (
      <mesh>
        <sphereGeometry args={[0.48, 24, 24]} />
        <meshBasicMaterial color="#facc15" transparent opacity={0.4} />
      </mesh>
    ) : null}
    {isPreview && value !== 0 ? (
      <mesh>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshBasicMaterial color="#f9a8d4" transparent opacity={0.25} />
      </mesh>
    ) : null}
    {isValid ? (
      <mesh
        onClick={(event) => {
          event.stopPropagation()
          onClick()
        }}
        onPointerOut={(event) => {
          event.stopPropagation()
          onBlur()
        }}
        onPointerOver={(event) => {
          event.stopPropagation()
          onHover()
        }}
      >
        <sphereGeometry args={[0.28, 20, 20]} />
        <meshBasicMaterial
          color={isHoverTarget ? '#38bdf8' : '#7dd3fc'}
          transparent
          opacity={isHoverTarget ? 0.55 : 0.3}
        />
      </mesh>
    ) : null}
  </group>
)

const GameScene = () => {
  const { board, validMoves, placePiece, gameOver, currentPlayer, lastMoveByPlayer } = useGameStore(
    useShallow((state) => ({
      board: state.board,
      validMoves: state.validMoves,
      placePiece: state.placePiece,
      gameOver: state.gameOver,
      currentPlayer: state.currentPlayer,
      lastMoveByPlayer: state.lastMoveByPlayer,
    })),
  )
  const boardSize = board.length
  const offset = (boardSize - 1) / 2
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const opponentLastMoveKey = useMemo(() => {
    const opponent = currentPlayer === 1 ? 2 : 1
    const opponentLastMove = lastMoveByPlayer[opponent]
    return opponentLastMove ? positionKey(opponentLastMove) : null
  }, [currentPlayer, lastMoveByPlayer])

  const previewSet = useMemo(() => {
    const set = new Set<string>()
    const hoveredFlips = hoveredKey ? validMoves[hoveredKey] ?? [] : []
    hoveredFlips.forEach((flip) => {
      set.add(positionKey(flip))
    })
    return set
  }, [hoveredKey, validMoves])

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 9, 5]} intensity={1.4} />
      <directionalLight position={[-6, 6, -4]} intensity={0.6} />
      <pointLight position={[-6, -4, -6]} intensity={0.9} />
      <group>
        {board.map((layer, z) =>
          layer.map((row, y) =>
            row.map((value, x) => {
              const key = positionKey({ x, y, z })
              const isValid =
                !gameOver && Boolean(validMoves[key]) && value === 0
              const position: [number, number, number] = [
                (x - offset) * spacing,
                (y - offset) * spacing,
                (z - offset) * spacing,
              ]
              return (
                <Cell
                  key={key}
                  position={position}
                  value={value}
                  isValid={isValid}
                  isPreview={previewSet.has(key)}
                  isHoverTarget={hoveredKey === key}
                  isLastMove={opponentLastMoveKey === key}
                  onHover={() => setHoveredKey(key)}
                  onBlur={() => setHoveredKey(null)}
                  onClick={() => placePiece({ x, y, z })}
                />
              )
            }),
          ),
        )}
      </group>
    </>
  )
}

export default GameScene
