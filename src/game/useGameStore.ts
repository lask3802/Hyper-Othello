import { create } from 'zustand'

export const BOARD_SIZE = 6

export type Player = 1 | 2
export type CellValue = 0 | Player
export type Winner = 0 | Player

export interface Position {
  x: number
  y: number
  z: number
}

interface GameState {
  board: CellValue[][][]
  currentPlayer: Player
  scores: Record<Player, number>
  validMoves: Record<string, Position[]>
  gameOver: boolean
  winner: Winner
  placePiece: (position: Position) => void
  reset: () => void
}

const directions: Position[] = []
for (let dx = -1; dx <= 1; dx += 1) {
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dz = -1; dz <= 1; dz += 1) {
      if (dx === 0 && dy === 0 && dz === 0) {
        continue
      }
      directions.push({ x: dx, y: dy, z: dz })
    }
  }
}

export const positionKey = (position: Position) =>
  `${position.x},${position.y},${position.z}`

const isWithinBounds = (x: number, y: number, z: number) =>
  x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE && z >= 0 && z < BOARD_SIZE

const createEmptyBoard = (): CellValue[][][] =>
  Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, () => 0 as CellValue),
    ),
  )

const createInitialBoard = (): CellValue[][][] => {
  const board = createEmptyBoard()
  const mid = BOARD_SIZE / 2 - 1
  for (let z = mid; z <= mid + 1; z += 1) {
    for (let y = mid; y <= mid + 1; y += 1) {
      for (let x = mid; x <= mid + 1; x += 1) {
        board[z][y][x] = (x + y + z) % 2 === 0 ? 1 : 2
      }
    }
  }
  return board
}

const cloneBoard = (board: CellValue[][][]): CellValue[][][] =>
  board.map((layer) => layer.map((row) => [...row]))

const countScores = (board: CellValue[][][]): Record<Player, number> => {
  let black = 0
  let white = 0
  for (let z = 0; z < BOARD_SIZE; z += 1) {
    for (let y = 0; y < BOARD_SIZE; y += 1) {
      for (let x = 0; x < BOARD_SIZE; x += 1) {
        const value = board[z][y][x]
        if (value === 1) {
          black += 1
        } else if (value === 2) {
          white += 1
        }
      }
    }
  }
  return { 1: black, 2: white }
}

const getValidMoves = (
  board: CellValue[][][],
  player: Player,
): Record<string, Position[]> => {
  const opponent = player === 1 ? 2 : 1
  const moves: Record<string, Position[]> = {}
  for (let z = 0; z < BOARD_SIZE; z += 1) {
    for (let y = 0; y < BOARD_SIZE; y += 1) {
      for (let x = 0; x < BOARD_SIZE; x += 1) {
        if (board[z][y][x] !== 0) {
          continue
        }
        const flips: Position[] = []
        for (const direction of directions) {
          let cx = x + direction.x
          let cy = y + direction.y
          let cz = z + direction.z
          const dirFlips: Position[] = []
          while (
            isWithinBounds(cx, cy, cz) &&
            board[cz][cy][cx] === opponent
          ) {
            dirFlips.push({ x: cx, y: cy, z: cz })
            cx += direction.x
            cy += direction.y
            cz += direction.z
          }
          if (
            dirFlips.length > 0 &&
            isWithinBounds(cx, cy, cz) &&
            board[cz][cy][cx] === player
          ) {
            flips.push(...dirFlips)
          }
        }
        if (flips.length > 0) {
          moves[positionKey({ x, y, z })] = flips
        }
      }
    }
  }
  return moves
}

const createInitialState = (): Omit<GameState, 'placePiece' | 'reset'> => {
  const board = createInitialBoard()
  return {
    board,
    currentPlayer: 1,
    scores: countScores(board),
    validMoves: getValidMoves(board, 1),
    gameOver: false,
    winner: 0,
  }
}

export const useGameStore = create<GameState>((set) => ({
  ...createInitialState(),
  placePiece: (position) => {
    set((state) => {
      if (state.gameOver) {
        return state
      }
      const key = positionKey(position)
      const flips = state.validMoves[key]
      if (!flips) {
        return state
      }
      const nextBoard = cloneBoard(state.board)
      nextBoard[position.z][position.y][position.x] = state.currentPlayer
      flips.forEach((flip) => {
        nextBoard[flip.z][flip.y][flip.x] = state.currentPlayer
      })
      const scores = countScores(nextBoard)
      const nextPlayer: Player = state.currentPlayer === 1 ? 2 : 1
      let nextMoves = getValidMoves(nextBoard, nextPlayer)
      let currentPlayer = nextPlayer
      let gameOver = false
      let winner: Winner = 0

      if (Object.keys(nextMoves).length === 0) {
        const currentMoves = getValidMoves(nextBoard, state.currentPlayer)
        if (Object.keys(currentMoves).length === 0) {
          gameOver = true
          winner =
            scores[1] === scores[2] ? 0 : scores[1] > scores[2] ? 1 : 2
          nextMoves = {}
          currentPlayer = nextPlayer
        } else {
          currentPlayer = state.currentPlayer
          nextMoves = currentMoves
        }
      }

      return {
        ...state,
        board: nextBoard,
        scores,
        currentPlayer,
        validMoves: nextMoves,
        gameOver,
        winner,
      }
    })
  },
  reset: () => {
    set(createInitialState())
  },
}))
