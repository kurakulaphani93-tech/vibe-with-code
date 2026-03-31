import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, SquareTerminal } from 'lucide-react';

const TRACKS = [
  { id: 1, title: "AI_GEN_TRACK_01.WAV", url: "https://actions.google.com/sounds/v1/science_fiction/alien_breath.ogg" },
  { id: 2, title: "NEURAL_NET_LULLABY.MP3", url: "https://actions.google.com/sounds/v1/science_fiction/sci_fi_drone.ogg" },
  { id: 3, title: "SYNTHETIC_SOUL.FLAC", url: "https://actions.google.com/sounds/v1/science_fiction/spaceship_engine.ogg" }
];

const GRID_SIZE = 20;
const CANVAS_SIZE = 400;

function SnakeGame({ onScore, onGameOver }: { onScore: (s: number) => void, onGameOver: (over: boolean) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(false);

  // Game state refs to avoid dependency issues in loop
  const snakeRef = useRef([{ x: 10, y: 10 }]);
  const dirRef = useRef({ x: 0, y: -1 });
  const nextDirRef = useRef({ x: 0, y: -1 });
  const foodRef = useRef({ x: 15, y: 5 });
  const lastUpdateRef = useRef(0);

  const resetGame = useCallback(() => {
    snakeRef.current = [{ x: 10, y: 10 }];
    dirRef.current = { x: 0, y: -1 };
    nextDirRef.current = { x: 0, y: -1 };
    foodRef.current = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
    onScore(0);
    setGameOver(false);
    onGameOver(false);
  }, [onScore, onGameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault();
      }
      const dir = dirRef.current;
      switch (e.key) {
        case 'ArrowUp': case 'w': if (dir.y === 0) nextDirRef.current = { x: 0, y: -1 }; break;
        case 'ArrowDown': case 's': if (dir.y === 0) nextDirRef.current = { x: 0, y: 1 }; break;
        case 'ArrowLeft': case 'a': if (dir.x === 0) nextDirRef.current = { x: -1, y: 0 }; break;
        case 'ArrowRight': case 'd': if (dir.x === 0) nextDirRef.current = { x: 1, y: 0 }; break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const loop = (timestamp: number) => {
      if (gameOver) return;

      if (timestamp - lastUpdateRef.current > 100) {
        lastUpdateRef.current = timestamp;
        dirRef.current = nextDirRef.current;
        const head = snakeRef.current[0];
        const newHead = { x: head.x + dirRef.current.x, y: head.y + dirRef.current.y };

        // Collision with walls
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
          setGameOver(true);
          onGameOver(true);
          return;
        }

        // Collision with self
        if (snakeRef.current.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          onGameOver(true);
          return;
        }

        const newSnake = [newHead, ...snakeRef.current];

        // Eat food
        if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
          onScore((s: number) => s + 10);
          foodRef.current = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
          };
        } else {
          newSnake.pop();
        }

        snakeRef.current = newSnake;
      }

      // Draw
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#050505';
          ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

          // Draw grid (optional glitchy look)
          ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
          for(let i=0; i<=CANVAS_SIZE; i+=CANVAS_SIZE/GRID_SIZE) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_SIZE); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_SIZE, i); ctx.stroke();
          }

          // Draw food
          ctx.fillStyle = '#ff00ff';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#ff00ff';
          ctx.fillRect(foodRef.current.x * (CANVAS_SIZE/GRID_SIZE), foodRef.current.y * (CANVAS_SIZE/GRID_SIZE), CANVAS_SIZE/GRID_SIZE - 2, CANVAS_SIZE/GRID_SIZE - 2);

          // Draw snake
          ctx.fillStyle = '#00ffff';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#00ffff';
          snakeRef.current.forEach((segment, index) => {
            if (index === 0) ctx.fillStyle = '#ffffff'; // head
            else ctx.fillStyle = '#00ffff';
            ctx.fillRect(segment.x * (CANVAS_SIZE/GRID_SIZE), segment.y * (CANVAS_SIZE/GRID_SIZE), CANVAS_SIZE/GRID_SIZE - 2, CANVAS_SIZE/GRID_SIZE - 2);
          });
          ctx.shadowBlur = 0; // reset
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameOver, onScore, onGameOver]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="border-2 border-[#00ffff] shadow-[0_0_15px_rgba(0,255,255,0.5)] bg-black w-full max-w-[400px] aspect-square"
      />
      {gameOver && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10">
          <h3 className="text-[#ff00ff] text-2xl md:text-4xl mb-6 glitch font-bold" data-text="SYSTEM_FAILURE">SYSTEM_FAILURE</h3>
          <button
            onClick={resetGame}
            className="px-6 py-3 border-2 border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-colors uppercase tracking-widest font-bold"
          >
            REBOOT_SEQUENCE
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const currentTrack = TRACKS[currentTrackIndex];

  return (
    <div className="min-h-screen bg-[#050505] text-[#00ffff] font-mono p-4 md:p-8 crt-flicker relative overflow-x-hidden flex flex-col items-center">
      <header className="w-full max-w-6xl mb-8 flex justify-between items-end border-b-2 border-[#ff00ff] pb-4 z-10">
        <div>
          <h1 className="text-4xl md:text-6xl font-bold glitch uppercase tracking-tighter" data-text="NEON_SERPENT.EXE">
            NEON_SERPENT.EXE
          </h1>
          <p className="text-[#ff00ff] text-xl md:text-2xl mt-2 tracking-widest glitch font-bold" data-text="v2.0.4 // UNAUTHORIZED_ACCESS">v2.0.4 // UNAUTHORIZED_ACCESS</p>
        </div>
        <div className="hidden md:flex items-center gap-3 text-2xl md:text-3xl text-[#00ffff]">
          <SquareTerminal className="w-8 h-8 animate-pulse text-[#ff00ff]" />
          <span className="glitch font-bold tracking-widest" data-text="SYS.ONLINE">SYS.ONLINE</span>
        </div>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
        {/* Left Panel: Audio */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="border-glitch p-4 bg-black/50 backdrop-blur-sm">
            <h2 className="text-[#ff00ff] text-xl mb-4 border-b border-[#ff00ff]/30 pb-2">AUDIO_DAEMON</h2>
            <div className="mb-6">
              <div className="text-xs text-gray-500 mb-1">CURRENT_STREAM:</div>
              <div className="text-sm truncate animate-pulse">{currentTrack.title}</div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <button onClick={handlePrev} className="p-2 hover:bg-[#00ffff] hover:text-black transition-colors border border-[#00ffff]">
                <SkipBack className="w-5 h-5" />
              </button>
              <button onClick={togglePlay} className="p-4 hover:bg-[#ff00ff] hover:text-black transition-colors border border-[#ff00ff] text-[#ff00ff]">
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
              <button onClick={handleNext} className="p-2 hover:bg-[#00ffff] hover:text-black transition-colors border border-[#00ffff]">
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full bg-gray-900 h-2 mt-4 relative overflow-hidden">
              <div className={`absolute top-0 left-0 h-full bg-[#00ffff] ${isPlaying ? 'w-full animate-[slide_2s_linear_infinite]' : 'w-0'}`}></div>
            </div>

            <audio
              ref={audioRef}
              src={currentTrack.url}
              onEnded={handleNext}
              loop={false}
            />
          </div>

          <div className="border-glitch p-4 bg-black/50 backdrop-blur-sm hidden lg:block">
            <h2 className="text-[#ff00ff] text-xl mb-4 border-b border-[#ff00ff]/30 pb-2">SYS_LOGS</h2>
            <div className="text-xs space-y-2 opacity-70">
              <p>&gt; INITIALIZING KERNEL...</p>
              <p>&gt; MOUNTING AUDIO_DRIVERS... OK</p>
              <p>&gt; ALLOCATING MEMORY FOR SERPENT... OK</p>
              <p className="text-[#ff00ff]">&gt; WARNING: ANOMALY DETECTED</p>
              <p>&gt; AWAITING USER INPUT...</p>
            </div>
          </div>
        </div>

        {/* Center Panel: Game */}
        <div className="lg:col-span-6 flex justify-center items-start">
          <div className="border-glitch p-2 bg-black/80 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#00ffff] to-[#ff00ff] opacity-20 blur group-hover:opacity-40 transition duration-1000"></div>
            <SnakeGame 
              onScore={(updater) => setScore(typeof updater === 'function' ? updater : () => updater)} 
              onGameOver={setIsGameOver} 
            />
          </div>
        </div>

        {/* Right Panel: Telemetry */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="border-glitch p-4 bg-black/50 backdrop-blur-sm">
            <h2 className="text-[#ff00ff] text-xl mb-4 border-b border-[#ff00ff]/30 pb-2">TELEMETRY</h2>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">SCORE_HASH:</div>
                <div className="text-3xl font-bold text-[#00ffff]">{score.toString().padStart(6, '0')}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">STATUS:</div>
                <div className={`text-sm ${isGameOver ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
                  {isGameOver ? 'ERR_CRITICAL_COLLISION' : 'NOMINAL_OPERATION'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">CONTROLS:</div>
                <div className="text-xs grid grid-cols-2 gap-2">
                  <div className="border border-[#00ffff]/30 p-1 text-center">W / UP</div>
                  <div className="border border-[#00ffff]/30 p-1 text-center">S / DOWN</div>
                  <div className="border border-[#00ffff]/30 p-1 text-center">A / LEFT</div>
                  <div className="border border-[#00ffff]/30 p-1 text-center">D / RIGHT</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
