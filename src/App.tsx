import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import './App.css'
import GameScene from './components/GameScene'
import { useGameStore } from './game/useGameStore'
function App() {
  const { currentPlayer, scores, reset, gameOver, winner } = useGameStore(
    (state) => ({
      currentPlayer: state.currentPlayer,
      scores: state.scores,
      reset: state.reset,
      gameOver: state.gameOver,
      winner: state.winner,
    }),
  )
  const currentLabel = currentPlayer === 1 ? 'Black' : 'White'
  const winnerLabel =
    winner === 0 ? 'Draw' : winner === 1 ? 'Black' : 'White'

  return (
    <div className="app">
      <Canvas className="h-full w-full" camera={{ position: [9, 9, 9], fov: 50 }}>
        <color attach="background" args={['#05070d']} />
        <GameScene />
        <OrbitControls makeDefault enablePan />
      </Canvas>
      <div className="absolute left-4 top-4 z-10 w-56 rounded-lg bg-slate-900/80 p-4 text-xs text-slate-100 shadow-lg">
        <div className="text-sm font-semibold">Hyper Othello</div>
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
            White
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
          onClick={reset}
          type="button"
        >
          Reset
        </button>
      </div>
    </div>
  )
}

export default App
