import { useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { BOARD_SIZE, positionKey, useGameStore } from '../game/useGameStore'
import type { CellValue } from '../game/useGameStore'

const spacing = 1.2
const offset = (BOARD_SIZE - 1) / 2

interface CellProps {
  position: [number, number, number]
  value: CellValue
  isValid: boolean
  isPreview: boolean
  isHoverTarget: boolean
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
  onHover,
  onBlur,
  onClick,
}: CellProps) => (
  <group position={position}>
    <mesh>
      <boxGeometry args={[0.9, 0.9, 0.9]} />
      <meshStandardMaterial
        color="#0f172a"
        transparent
        opacity={0.25}
        wireframe
      />
    </mesh>
    {value !== 0 ? (
      <mesh>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial
          color={value === 1 ? '#0b1120' : '#e2e8f0'}
          metalness={0.1}
          roughness={0.4}
        />
      </mesh>
    ) : null}
    {isPreview && value !== 0 ? (
      <mesh>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.35} />
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
          color={isHoverTarget ? '#4ade80' : '#22c55e'}
          transparent
          opacity={isHoverTarget ? 0.6 : 0.35}
        />
      </mesh>
    ) : null}
  </group>
)

const GameScene = () => {
  const { board, validMoves, placePiece, gameOver } = useGameStore(
    useShallow((state) => ({
      board: state.board,
      validMoves: state.validMoves,
      placePiece: state.placePiece,
      gameOver: state.gameOver,
    })),
  )
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

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
      <ambientLight intensity={0.6} />
      <directionalLight position={[6, 9, 5]} intensity={1.1} />
      <pointLight position={[-6, -4, -6]} intensity={0.6} />
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
