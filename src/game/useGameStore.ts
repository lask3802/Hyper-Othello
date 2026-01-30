import { create } from 'zustand'

export type BoardSize = 4 | 6

const DEFAULT_BOARD_SIZE: BoardSize = 6

export type Player = 1 | 2
export type CellValue = 0 | Player
export type Winner = 0 | Player
export type GameMode = 'pvp' | 'ai'

export interface Position {
  x: number
  y: number
  z: number
}

export interface MoveChange {
  position: Position
  from: CellValue
  to: CellValue
}

export interface MoveLogEntry {
  moveNumber: number
  player: Player
  position: Position
  changes: MoveChange[]
}

interface GameState {
  board: CellValue[][][]
  boardSize: BoardSize
  gameMode: GameMode
  currentPlayer: Player
  scores: Record<Player, number>
  validMoves: Record<string, Position[]>
  gameOver: boolean
  winner: Winner
  lastMoveByPlayer: Record<Player, Position | null>
  moveLog: MoveLogEntry[]
  placePiece: (position: Position) => void
  reset: (boardSize?: BoardSize) => void
  setGameMode: (mode: GameMode) => void
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

const createEmptyBoard = (boardSize: BoardSize): CellValue[][][] =>
  Array.from({ length: boardSize }, () =>
    Array.from({ length: boardSize }, () =>
      Array.from({ length: boardSize }, () => 0 as CellValue),
    ),
  )

const createInitialBoard = (boardSize: BoardSize): CellValue[][][] => {
  const board = createEmptyBoard(boardSize)
  const mid = boardSize / 2 - 1
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
  const boardSize = board.length
  let black = 0
  let white = 0
  for (let z = 0; z < boardSize; z += 1) {
    for (let y = 0; y < boardSize; y += 1) {
      for (let x = 0; x < boardSize; x += 1) {
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
  const boardSize = board.length
  const isWithinBounds = (x: number, y: number, z: number) =>
    x >= 0 &&
    x < boardSize &&
    y >= 0 &&
    y < boardSize &&
    z >= 0 &&
    z < boardSize
  const opponent = player === 1 ? 2 : 1
  const moves: Record<string, Position[]> = {}
  for (let z = 0; z < boardSize; z += 1) {
    for (let y = 0; y < boardSize; y += 1) {
      for (let x = 0; x < boardSize; x += 1) {
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

const createInitialState = (): Omit<
  GameState,
  'placePiece' | 'reset' | 'setGameMode'
> => {
  const board = createInitialBoard(DEFAULT_BOARD_SIZE)
  return {
    board,
    boardSize: DEFAULT_BOARD_SIZE,
    gameMode: 'pvp',
    currentPlayer: 1,
    scores: countScores(board),
    validMoves: getValidMoves(board, 1),
    gameOver: false,
    winner: 0,
    lastMoveByPlayer: { 1: null, 2: null },
    moveLog: [],
  }
}

export const useGameStore = create<GameState>((set) => ({
  ...createInitialState(),
  setGameMode: (mode) => {
    set((state) => {
      if (state.gameMode === mode) {
        return state
      }
      return { ...state, gameMode: mode }
    })
  },
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
      const moveResult = applyMove(
        state.board,
        state.currentPlayer,
        position,
        flips,
      )
      const transition = advanceState(
        moveResult.board,
        state.currentPlayer,
        state.gameMode,
      )
      const moveEntry: MoveLogEntry = {
        moveNumber: state.moveLog.length + 1,
        player: state.currentPlayer,
        position,
        changes: moveResult.changes,
      }
      const aiMoveLog = transition.aiMoveLog.map((entry, index) => ({
        ...entry,
        moveNumber: moveEntry.moveNumber + index + 1,
      }))
      const nextMoveLog = [...state.moveLog, moveEntry, ...aiMoveLog]
      const nextLastMove = {
        ...state.lastMoveByPlayer,
        [state.currentPlayer]: position,
      }
      if (transition.aiLastMoveByPlayer[1]) {
        nextLastMove[1] = transition.aiLastMoveByPlayer[1]
      }
      if (transition.aiLastMoveByPlayer[2]) {
        nextLastMove[2] = transition.aiLastMoveByPlayer[2]
      }

      return {
        ...state,
        board: transition.board,
        scores: transition.scores,
        currentPlayer: transition.currentPlayer,
        validMoves: transition.validMoves,
        gameOver: transition.gameOver,
        winner: transition.winner,
        moveLog: nextMoveLog,
        lastMoveByPlayer: nextLastMove,
      }
    })
  },
  reset: (boardSize) => {
    set((state) => {
      const nextSize = boardSize ?? state.boardSize
      const board = createInitialBoard(nextSize)
      return {
        board,
        boardSize: nextSize,
        gameMode: state.gameMode,
        currentPlayer: 1,
        scores: countScores(board),
        validMoves: getValidMoves(board, 1),
        gameOver: false,
        winner: 0,
        lastMoveByPlayer: { 1: null, 2: null },
        moveLog: [],
      }
    })
  },
}))

const chooseGreedyMove = (
  validMoves: Record<string, Position[]>,
): Position | null => {
  let bestMove: Position | null = null
  let bestFlips = -1
  for (const [key, flips] of Object.entries(validMoves)) {
    const [x, y, z] = key.split(',').map(Number)
    if (flips.length > bestFlips) {
      bestFlips = flips.length
      bestMove = { x, y, z }
    }
  }
  return bestMove
}

const applyMove = (
  board: CellValue[][][],
  player: Player,
  position: Position,
  flips: Position[],
): { board: CellValue[][][]; changes: MoveChange[] } => {
  const nextBoard = cloneBoard(board)
  const changes: MoveChange[] = []
  const { x, y, z } = position
  const previousValue = nextBoard[z][y][x]
  nextBoard[z][y][x] = player
  changes.push({ position, from: previousValue, to: player })
  flips.forEach((flip) => {
    const before = nextBoard[flip.z][flip.y][flip.x]
    nextBoard[flip.z][flip.y][flip.x] = player
    changes.push({ position: flip, from: before, to: player })
  })
  return { board: nextBoard, changes }
}

const advanceState = (
  board: CellValue[][][],
  lastPlayer: Player,
  gameMode: GameMode,
): {
  board: CellValue[][][]
  scores: Record<Player, number>
  currentPlayer: Player
  validMoves: Record<string, Position[]>
  gameOver: boolean
  winner: Winner
  aiMoveLog: MoveLogEntry[]
  aiLastMoveByPlayer: Record<Player, Position | null>
} => {
  let currentBoard = board
  let currentPlayer: Player = lastPlayer === 1 ? 2 : 1
  let currentMoves = getValidMoves(currentBoard, currentPlayer)
  const aiMoveLog: MoveLogEntry[] = []
  const aiLastMoveByPlayer: Record<Player, Position | null> = {
    1: null,
    2: null,
  }

  if (Object.keys(currentMoves).length === 0) {
    const lastMoves = getValidMoves(currentBoard, lastPlayer)
    if (Object.keys(lastMoves).length === 0) {
      const scores = countScores(currentBoard)
      return {
        board: currentBoard,
        scores,
        currentPlayer,
        validMoves: {},
        gameOver: true,
        winner:
          scores[1] === scores[2] ? 0 : scores[1] > scores[2] ? 1 : 2,
        aiMoveLog,
        aiLastMoveByPlayer,
      }
    }
    currentPlayer = lastPlayer
    currentMoves = lastMoves
  }

  if (gameMode === 'ai') {
    while (currentPlayer === 2) {
      const aiMove = chooseGreedyMove(currentMoves)
      if (!aiMove) {
        break
      }
      const aiFlips = currentMoves[positionKey(aiMove)] ?? []
      const moveResult = applyMove(currentBoard, 2, aiMove, aiFlips)
      currentBoard = moveResult.board
      aiMoveLog.push({
        moveNumber: 0,
        player: 2,
        position: aiMove,
        changes: moveResult.changes,
      })
      aiLastMoveByPlayer[2] = aiMove
      currentPlayer = 1
      currentMoves = getValidMoves(currentBoard, currentPlayer)
      if (Object.keys(currentMoves).length === 0) {
        const aiMoves = getValidMoves(currentBoard, 2)
        if (Object.keys(aiMoves).length === 0) {
          const scores = countScores(currentBoard)
          return {
            board: currentBoard,
            scores,
            currentPlayer,
            validMoves: {},
            gameOver: true,
            winner:
              scores[1] === scores[2] ? 0 : scores[1] > scores[2] ? 1 : 2,
            aiMoveLog,
            aiLastMoveByPlayer,
          }
        }
        currentPlayer = 2
        currentMoves = aiMoves
      }
    }
  }

  return {
    board: currentBoard,
    scores: countScores(currentBoard),
    currentPlayer,
    validMoves: currentMoves,
    gameOver: false,
    winner: 0,
    aiMoveLog,
    aiLastMoveByPlayer,
  }
}
