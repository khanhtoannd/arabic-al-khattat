import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, PenTool, Keyboard, Check, RefreshCcw, ArrowRight, BookOpen, AlertCircle, Volume2, ThumbsDown, ThumbsUp, Trophy, Library, LogIn, LogOut } from 'lucide-react';
import { ARABIC_DICTIONARY } from './constants/dictionary';
import { DrawingCanvas, DrawingCanvasHandle } from './components/DrawingCanvas';
import { playArabicLetter } from './services/geminiService';
import { ActivityHeatmap } from './components/ActivityHeatmap';
import { useAuth } from './lib/useAuth';

type InputMode = 'draw' | 'type';
type GameState = 'question' | 'self_grade' | 'result';

interface EvaluationResult {
  isCorrect: boolean;
  recognizedAs?: string;
  feedback: string;
}

export default function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<InputMode>('draw');
  const [gameState, setGameState] = useState<GameState>('question');
  
  // Type mode state
  const [textInput, setTextInput] = useState('');
  
  // Results state
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);
  
  const canvasRef = useRef<DrawingCanvasHandle>(null);

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Auth setup
  const { user, login, logout, loading: authLoading } = useAuth();

  const [progressHistory, setProgressHistory] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('arabic_progress_history');
      if (saved) return JSON.parse(saved);
      // Migrate old data if it exists
      const oldDaily = localStorage.getItem('arabic_daily_progress');
      if (oldDaily) {
        const parsed = JSON.parse(oldDaily);
        if (parsed.date && parsed.count) {
          return { [parsed.date]: parsed.count };
        }
      }
    } catch {
      // ignore
    }
    return {};
  });

  const markCorrect = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    const dateStr = d.toISOString().split('T')[0];
    
    setProgressHistory(prev => {
      const next = { ...prev, [dateStr]: (prev[dateStr] || 0) + 1 };
      try {
        localStorage.setItem('arabic_progress_history', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const currentCharacter = ARABIC_DICTIONARY[currentIndex];

  const handlePlayAudio = async () => {
    try {
      setIsPlayingAudio(true);
      await playArabicLetter(currentCharacter.letter);
    } catch (e) {
      console.error(e);
      alert('Failed to play audio');
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const pickRandomCharacter = useCallback(() => {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * ARABIC_DICTIONARY.length);
    } while (nextIndex === currentIndex && ARABIC_DICTIONARY.length > 1);
    
    setCurrentIndex(nextIndex);
    setGameState('question');
    setTextInput('');
    setEvalResult(null);
    canvasRef.current?.clear();
  }, [currentIndex]);

  // Load a random character on start
  useEffect(() => {
    pickRandomCharacter();
  }, []);

  const handleClear = () => {
    if (mode === 'draw') {
      canvasRef.current?.clear();
    } else {
      setTextInput('');
    }
  };

  const checkAnswer = async () => {
    if (gameState !== 'question') return;

    if (mode === 'type') {
      const isCorrect = textInput.trim() === currentCharacter.letter;
      if (isCorrect) markCorrect();
      setEvalResult({
        isCorrect,
        recognizedAs: textInput.trim(),
        feedback: isCorrect ? "Perfectly typed!" : `Incorrect. The expected letter is ${currentCharacter.letter}.`
      });
      setGameState('result');
    } else if (mode === 'draw') {
      setGameState('self_grade');
    }
  };

  const handleSelfGrade = (isCorrect: boolean) => {
    if (isCorrect) markCorrect();
    setEvalResult({
      isCorrect,
      feedback: isCorrect ? "Great job!" : "Keep practicing, you'll get it!"
    });
    setGameState('result');
  };

  const handleNext = () => {
    pickRandomCharacter();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      
      {/* Auth Header */}
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
        {!authLoading && (
          user ? (
            <div className="flex items-center space-x-3 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200">
              <span className="text-sm font-medium text-slate-700 hidden sm:inline-block">
                {user.displayName || user.email}
              </span>
              <button
                onClick={logout}
                className="p-1.5 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-full font-medium shadow-sm hover:bg-indigo-700 transition-colors text-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )
        )}
      </div>

      {/* Header */}
      <header className="mb-10 text-center space-y-3 pt-12 sm:pt-0">
        <div className="inline-flex flex-wrap items-center justify-center gap-2 mb-2">
          <div className="inline-flex items-center space-x-2 bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-semibold">
            <BookOpen className="w-4 h-4" />
            <span>Al-Khattat (الخطاط)</span>
          </div>
          <div className="inline-flex items-center space-x-2 bg-slate-100 text-slate-700 px-4 py-1.5 rounded-full text-sm font-semibold">
            <Library className="w-4 h-4" />
            <span>{ARABIC_DICTIONARY.length} Items</span>
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 tracking-tight">
          Learn Arabic Letters
        </h1>
        <p className="text-slate-500 max-w-sm mx-auto">
          Write or draw the phonetic target. 
        </p>
      </header>

      {/* Main Card */}
      <main className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 flex flex-col relative z-10 transition-all duration-300">
        
        {/* Flashcard Area */}
        <div className="bg-slate-50 border-b border-slate-100 p-8 text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[140px]">
          <div className="absolute top-0 inset-x-0 h-1 bg-indigo-500" />
          <h2 className="text-[11px] font-bold text-indigo-400 tracking-[0.2em] uppercase mb-3">Phonetic Target</h2>
          <div className="text-4xl sm:text-5xl font-display font-black bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-5 block transform transition-all group-hover:scale-105">
            "{currentCharacter.phonetic}"
          </div>
          <button
            onClick={handlePlayAudio}
            disabled={isPlayingAudio}
            className="inline-flex items-center justify-center space-x-2 text-indigo-600 bg-indigo-100/50 hover:bg-indigo-100 px-6 py-3 rounded-full transition-colors font-medium text-base disabled:opacity-50"
          >
            {isPlayingAudio ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
            <span>Hear Pronunciation</span>
          </button>
        </div>

        {/* Interaction Area */}
        <div className="p-6">
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6 shadow-inner">
            <button
              onClick={() => { setMode('draw'); setGameState('question'); }}
              disabled={gameState !== 'question'}
              className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'draw' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              } disabled:opacity-50`}
            >
              <PenTool className="w-4 h-4 mr-2" /> Draw
            </button>
            <button
              onClick={() => { setMode('type'); setGameState('question'); }}
              disabled={gameState !== 'question'}
              className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'type' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              } disabled:opacity-50`}
            >
              <Keyboard className="w-4 h-4 mr-2" /> Type
            </button>
          </div>

          <div className="relative mb-6">
            {mode === 'draw' ? (
              <div className="relative w-full aspect-square bg-white border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden group hover:border-indigo-300 transition-colors">
                <DrawingCanvas ref={canvasRef} />
                <button
                  onClick={handleClear}
                  disabled={gameState !== 'question'}
                  className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white text-slate-400 hover:text-slate-600 rounded-full shadow-sm backdrop-blur transition-all disabled:opacity-0 disabled:pointer-events-none"
                  aria-label="Clear Canvas"
                >
                  <RefreshCcw className="w-4 h-4" />
                </button>
                <div className="absolute inset-x-0 bottom-4 text-center pointer-events-none opacity-40">
                  <span className="text-xs font-medium text-slate-400 bg-white/80 px-3 py-1 rounded-full">Draw here</span>
                </div>
              </div>
            ) : (
              <div className="w-full aspect-[2/1] flex flex-col justify-center">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  disabled={gameState !== 'question'}
                  placeholder="ا"
                  dir="rtl"
                  className="w-full text-center text-7xl font-arabic py-8 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all placeholder:mt-4 placeholder:text-slate-300 disabled:opacity-60"
                  onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                />
              </div>
            )}
            
            {/* Self-Grade Overlay */}
            <AnimatePresence>
              {gameState === 'self_grade' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 bg-white/95 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center border-2 border-indigo-200 p-6"
                >
                  <h3 className="text-slate-500 font-medium mb-2 text-sm uppercase tracking-wide">Expected Letter/Word</h3>
                  <div className="text-8xl font-arabic text-indigo-600 mb-6">{currentCharacter.letter}</div>
                  <p className="text-slate-700 font-medium mb-4 text-center">Did you get it right?</p>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => handleSelfGrade(false)}
                      className="flex-1 py-3 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <ThumbsDown className="w-4 h-4" /> No
                    </button>
                    <button
                      onClick={() => handleSelfGrade(true)}
                      className="flex-1 py-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4" /> Yes
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Area */}
          {gameState === 'question' ? (
            <button
              onClick={checkAnswer}
              disabled={mode === 'type' && !textInput.trim()}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center space-x-2 active:scale-[0.98]"
            >
              <span>Check Answer</span>
              <Check className="w-5 h-5" />
            </button>
          ) : gameState === 'result' && evalResult ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-2xl mb-4 border ${
                evalResult.isCorrect 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-900' 
                  : 'bg-rose-50 border-rose-100 text-rose-900'
              }`}
            >
              <div className="flex items-start">
                <div className="shrink-0 mt-0.5">
                  {evalResult.isCorrect 
                    ? <Check className="w-5 h-5 text-emerald-500" />
                    : <AlertCircle className="w-5 h-5 text-rose-500" />
                  }
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-semibold mb-1">
                    {evalResult.isCorrect ? 'Correct!' : 'Keep practicing!'}
                  </h3>
                  <p className="text-sm opacity-90 mb-3">{evalResult.feedback}</p>
                  
                  {!evalResult.isCorrect && (
                    <div className="mt-3 bg-white/60 p-3 rounded-xl border border-rose-100/50 flex items-center justify-between">
                      <span className="text-xs font-medium opacity-80 uppercase tracking-widest">Expected</span>
                      <span className="text-4xl font-arabic text-rose-600">{currentCharacter.letter}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : null}

          {/* Next Button explicitly below result */}
          {(gameState === 'result') && (
            <button
              onClick={handleNext}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 active:scale-[0.98]"
            >
              <span>Next Letter</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

        </div>
      </main>
      
      {/* GitHub-style Activity Heatmap */}
      <ActivityHeatmap history={progressHistory} />
      
    </div>
  );
}
