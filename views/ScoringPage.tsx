
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, RefreshCw, Flag, CheckCircle, Mic, PenTool, X, Monitor, Settings, Maximize2, Minimize2, Trophy, Printer, RotateCcw, AlertTriangle, Timer as TimerIcon, XCircle, ArrowLeftRight, CircleDot, FileText, BarChart3, List, MicOff, Keyboard, Command, FileSpreadsheet, TrendingUp, Cast, Video } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Match, Language, ScoringType, GameFormat, Player, MatchStatus, MatchEvent } from '../types';
import { analyzeMatch } from '../services/geminiService';
import { useData } from '../contexts/DataContext';

interface Props {
  language: Language;
  initialMatch: Match | null;
  onMatchUpdate?: (match: Match) => void;
}

// STREAM OVERLAY COMPONENT
const StreamOverlay: React.FC<{ match: Match, p1Score: number, p2Score: number, p1Games: number, p2Games: number, server: 1 | 2, onClose: () => void }> = ({ match, p1Score, p2Score, p1Games, p2Games, server, onClose }) => {
    const [chromaKey, setChromaKey] = useState(false); // Green screen mode

    return (
        <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-end pb-10 transition-colors duration-300 ${chromaKey ? 'bg-[#00b140]' : 'bg-slate-900/80 backdrop-blur-sm'}`}>
            
            {/* Control Bar (Not visible in crop if placed top, but useful) */}
            <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => setChromaKey(!chromaKey)} className="bg-black/50 text-white px-3 py-1 rounded text-xs font-bold hover:bg-black/70 flex items-center gap-2 border border-white/20">
                    <Video size={14}/> {chromaKey ? 'Disable Green Screen' : 'Enable Green Screen (OBS)'}
                </button>
                <button onClick={onClose} className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 shadow-lg"><X size={20}/></button>
            </div>

            {/* Broadcast Lower Third */}
            <div className="w-full max-w-5xl mx-auto transform transition-all duration-500 scale-100 animate-in slide-in-from-bottom-10">
                <div className="flex shadow-2xl rounded-xl overflow-hidden font-sans border-2 border-white/10">
                    
                    {/* Player 1 */}
                    <div className="flex-1 bg-white flex items-center justify-between px-6 py-3 border-r border-slate-200 relative">
                        {server === 1 && <div className="absolute left-0 top-0 bottom-0 w-2 bg-yellow-400 animate-pulse"></div>}
                        <div className="flex flex-col">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">{match.player1?.name || 'PLAYER 1'}</h2>
                            <span className="text-slate-500 font-bold text-xs mt-1 uppercase tracking-widest">{match.player1?.club || 'CLUB'}</span>
                        </div>
                        <div className="flex gap-1">
                            {Array.from({length: 3}).map((_, i) => (
                                <div key={i} className={`w-3 h-3 rounded-full ${i < p1Games ? 'bg-red-600' : 'bg-slate-200'}`}></div>
                            ))}
                        </div>
                    </div>

                    {/* Scores */}
                    <div className="w-48 bg-slate-900 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-black opacity-50"></div>
                        <div className="relative z-10 flex items-center gap-1">
                            <span className={`text-6xl font-black tracking-tighter ${server === 1 ? 'text-yellow-400' : 'text-white'}`}>{p1Score}</span>
                            <span className="text-slate-600 text-4xl font-light mx-1">-</span>
                            <span className={`text-6xl font-black tracking-tighter ${server === 2 ? 'text-yellow-400' : 'text-white'}`}>{p2Score}</span>
                        </div>
                    </div>

                    {/* Player 2 */}
                    <div className="flex-1 bg-white flex items-center justify-between px-6 py-3 border-l border-slate-200 flex-row-reverse relative">
                        {server === 2 && <div className="absolute right-0 top-0 bottom-0 w-2 bg-yellow-400 animate-pulse"></div>}
                        <div className="flex flex-col text-right">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">{match.player2?.name || 'PLAYER 2'}</h2>
                            <span className="text-slate-500 font-bold text-xs mt-1 uppercase tracking-widest">{match.player2?.club || 'CLUB'}</span>
                        </div>
                        <div className="flex gap-1">
                            {Array.from({length: 3}).map((_, i) => (
                                <div key={i} className={`w-3 h-3 rounded-full ${i < p2Games ? 'bg-red-600' : 'bg-slate-200'}`}></div>
                            ))}
                        </div>
                    </div>

                </div>
                
                {/* Meta Bar */}
                <div className="bg-black/90 text-white/80 px-6 py-1 flex justify-between items-center text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                    <span>{match.roundName}</span>
                    <span className="text-yellow-500">PRO SQUASH OPEN 2024</span>
                    <span>{match.court}</span>
                </div>
            </div>
        </div>
    );
};

// MATCH REPORT MODAL COMPONENT
const MatchReportModal: React.FC<{ match: Match, onClose: () => void }> = ({ match, onClose }) => {
    // Analytics Logic
    const stats = useMemo(() => {
        const events = match.events || [];
        const p1Strokes = events.filter(e => e.detail === 'STROKE' && e.player === 1).length;
        const p2Strokes = events.filter(e => e.detail === 'STROKE' && e.player === 2).length;
        const lets = events.filter(e => e.detail === 'LET').length;
        const p1Warnings = events.filter(e => e.detail === 'CONDUCT_WARNING' && e.player === 1).length;
        const p2Warnings = events.filter(e => e.detail === 'CONDUCT_WARNING' && e.player === 2).length;
        
        // Momentum Data: Calculate point diff over time
        let p1Running = 0;
        let p2Running = 0;
        const momentumData = events
            .filter(e => e.type === 'SCORE')
            .map((e, i) => {
                if (e.player === 1) p1Running++; else p2Running++;
                return { index: i + 1, diff: p1Running - p2Running, p1: p1Running, p2: p2Running };
            });

        return { p1Strokes, p2Strokes, lets, p1Warnings, p2Warnings, momentumData };
    }, [match]);

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><FileSpreadsheet className="text-blue-600"/> Match Report</h2>
                        <p className="text-sm text-slate-500">{match.roundName} • {match.player1?.name} vs {match.player2?.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-100 transition-colors"><X size={20}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Score Summary */}
                    <div className="flex items-center justify-center gap-8 py-6 bg-slate-900 text-white rounded-xl shadow-inner">
                        <div className="text-right">
                            <div className="text-2xl font-bold">{match.player1?.name}</div>
                            <div className="text-sm text-slate-400">{match.player1?.club}</div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-5xl font-black font-mono text-yellow-400">{match.scores.filter(s => s.p1 > s.p2).length}</div>
                            <div className="text-slate-500">-</div>
                            <div className="text-5xl font-black font-mono text-yellow-400">{match.scores.filter(s => s.p2 > s.p1).length}</div>
                        </div>
                        <div className="text-left">
                            <div className="text-2xl font-bold">{match.player2?.name}</div>
                            <div className="text-sm text-slate-400">{match.player2?.club}</div>
                        </div>
                    </div>
                    
                    {/* Game Scores Detail */}
                    <div className="flex justify-center gap-2">
                        {match.scores.map((s, i) => (
                            <div key={i} className="bg-slate-100 px-4 py-2 rounded text-center">
                                <div className="text-xs text-slate-500 font-bold uppercase mb-1">Game {i+1}</div>
                                <div className="font-mono font-bold text-lg">{s.p1} - {s.p2}</div>
                            </div>
                        ))}
                    </div>

                    {/* Momentum Chart */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><TrendingUp size={18}/> Match Momentum</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.momentumData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorDiff" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="index" hide />
                                    <YAxis hide domain={['auto', 'auto']} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                                    <Area type="monotone" dataKey="diff" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDiff)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-center text-xs text-slate-400 mt-2">Positive = Player 1 Lead | Negative = Player 2 Lead</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-4">
                            <h4 className="text-center font-bold text-slate-400 text-xs uppercase tracking-wider">Player 1 Stats</h4>
                            <div className="bg-blue-50 p-3 rounded flex justify-between items-center text-sm font-medium text-blue-800"><span>Strokes Won</span> <span>{stats.p1Strokes}</span></div>
                            <div className="bg-orange-50 p-3 rounded flex justify-between items-center text-sm font-medium text-orange-800"><span>Warnings</span> <span>{stats.p1Warnings}</span></div>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="bg-slate-100 rounded-full w-24 h-24 flex flex-col items-center justify-center border-4 border-slate-200">
                                <div className="text-3xl font-black text-slate-700">{stats.lets}</div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase">Total Lets</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-center font-bold text-slate-400 text-xs uppercase tracking-wider">Player 2 Stats</h4>
                            <div className="bg-blue-50 p-3 rounded flex justify-between items-center text-sm font-medium text-blue-800"><span>Strokes Won</span> <span>{stats.p2Strokes}</span></div>
                            <div className="bg-orange-50 p-3 rounded flex justify-between items-center text-sm font-medium text-orange-800"><span>Warnings</span> <span>{stats.p2Warnings}</span></div>
                        </div>
                    </div>
                </div>
                
                <div className="p-6 border-t border-slate-100 flex gap-4 bg-slate-50 print:hidden">
                    <button onClick={() => window.print()} className="flex-1 py-3 border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-white flex items-center justify-center gap-2"><Printer size={18}/> Print Sheet</button>
                    <button onClick={onClose} className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg">Close Report</button>
                </div>
            </div>
        </div>
    );
};

const ScoringPage: React.FC<Props> = ({ language, initialMatch, onMatchUpdate }) => {
  const { updateMatch } = useData();
  const t = {
    matchInfo: language === 'CN' ? '比赛信息' : 'Match Info',
    court: language === 'CN' ? '中央玻璃球场' : 'Central Glass Court',
    game: language === 'CN' ? '局' : 'Game',
    finalize: language === 'CN' ? '结束比赛 & 签名' : 'Finalize & Sign',
    warmup: language === 'CN' ? '热身 (4min)' : 'WARMUP (4min)',
    rest: language === 'CN' ? '局间休息 (90s)' : 'REST (90s)',
    match: language === 'CN' ? '比赛' : 'MATCH',
    settings: language === 'CN' ? '比赛设置' : 'Match Settings',
    tvMode: language === 'CN' ? '大屏模式' : 'TV Mode',
    streamOverlay: language === 'CN' ? '直播推流模式' : 'Stream Overlay',
    winner: language === 'CN' ? '获胜者' : 'Winner',
    print: language === 'CN' ? '打印成绩单' : 'Print Score Sheet',
    referee: language === 'CN' ? '裁判' : 'Referee',
    undo: language === 'CN' ? '撤销' : 'Undo',
    let: language === 'CN' ? '和球 (Yes Let)' : 'Yes Let',
    stroke: language === 'CN' ? '判得分 (Stroke)' : 'Stroke',
    noLet: language === 'CN' ? '无和球 (No Let)' : 'No Let',
    decision: language === 'CN' ? '裁判判罚' : 'Referee Decision',
    resume: language === 'CN' ? '恢复比赛' : 'Resume Match',
    swap: language === 'CN' ? '交换选手' : 'Swap Sides',
    server: language === 'CN' ? '发球方' : 'Server',
    stats: language === 'CN' ? '数据统计' : 'Match Stats',
    log: language === 'CN' ? '比赛日志' : 'Event Log',
    voiceOn: language === 'CN' ? '语音控制开启' : 'Voice Control ON',
    voiceOff: language === 'CN' ? '语音控制关闭' : 'Voice Control OFF',
    listening: language === 'CN' ? '正在聆听...' : 'Listening...',
    shortcuts: language === 'CN' ? '键盘快捷键' : 'Keyboard Shortcuts',
    gameBall: language === 'CN' ? '局点' : 'GAME BALL',
    matchBall: language === 'CN' ? '赛点' : 'MATCH BALL',
    conductWarning: language === 'CN' ? '行为警告' : 'Conduct Warning',
  };

  // Default mock if no match passed
  const defaultPlayer: Player = { id: '0', name: 'TBD', rank: 0, club: '', gender: 'M', status: 'APPROVED', points: 0 };
  
  const [match, setMatch] = useState<Match>(initialMatch || {
    id: 'LIVE-001',
    tournamentId: 'T1',
    roundName: 'Friendly',
    player1: { ...defaultPlayer, name: 'Player 1' },
    player2: { ...defaultPlayer, name: 'Player 2' },
    scores: [],
    status: MatchStatus.IN_PROGRESS,
    events: []
  });

  // FIX: Prevent infinite loop. Only update from props if it is a NEW match (different ID).
  useEffect(() => {
      if (initialMatch && initialMatch.id !== match.id) {
          setMatch(initialMatch);
      }
  }, [initialMatch, match.id]);

  // Sync with parent whenever match state changes locally
  useEffect(() => {
     if (onMatchUpdate && match.id !== 'LIVE-001') {
         onMatchUpdate(match);
     }
  }, [match.scores, match.status, match.winnerId, match.events]);

  // Settings State
  const [scoringType, setScoringType] = useState<ScoringType>(ScoringType.PAR_11);
  const [gameFormat, setGameFormat] = useState<GameFormat>(GameFormat.BEST_OF_5);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [tvMode, setTvMode] = useState(false);
  const [streamMode, setStreamMode] = useState(false); // NEW STREAM STATE
  const [showReport, setShowReport] = useState(false); 

  // Scoring State
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [p1Games, setP1Games] = useState(0); 
  const [p2Games, setP2Games] = useState(0);
  const [server, setServer] = useState<1 | 2>(1); // 1 = Player 1 serving, 2 = Player 2 serving
  
  // Game Ball Logic
  const [gameBallState, setGameBallState] = useState<{player: 1 | 2, type: 'GAME' | 'MATCH'} | null>(null);

  // Undo History Stack
  const [history, setHistory] = useState<any[]>([]);

  // Timer State
  const [time, setTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'MATCH' | 'WARMUP' | 'REST'>('MATCH');
  const [showRestPopup, setShowRestPopup] = useState(false);
  
  const [analysis, setAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [signatureImg, setSignatureImg] = useState<string | null>(null);

  // Voice Control State
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [lastVoiceCommand, setLastVoiceCommand] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if modals are open or typing in input
      if (showSettings || showStats || showSignature || showShortcuts || showReport || (e.target as HTMLElement).tagName === 'INPUT') return;

      switch(e.key) {
        case '1':
        case 'ArrowLeft':
            handleScore(1);
            break;
        case '2':
        case 'ArrowRight':
            handleScore(2);
            break;
        case ' ':
        case 'Spacebar':
            e.preventDefault(); // prevent scroll
            setIsTimerRunning(prev => !prev);
            break;
        case 'z':
        case 'Z':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                handleUndo();
            }
            break;
        case 'l':
        case 'L':
            handleDecision('LET', 1);
            break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [p1Score, p2Score, showSettings, showStats, showSignature, showShortcuts, showReport, match.status]); 

  // --- GAME BALL CHECK ---
  useEffect(() => {
      const target = scoringType === ScoringType.PAR_11 ? 11 : scoringType === ScoringType.PAR_15 ? 15 : 9;
      const gamesToWin = gameFormat === GameFormat.BEST_OF_5 ? 3 : 2;
      
      let state = null;

      // Check P1
      if (p1Score >= target - 1 && p1Score > p2Score) {
          const isMatchBall = p1Games === gamesToWin - 1;
          state = { player: 1, type: isMatchBall ? 'MATCH' : 'GAME' };
      }
      // Check P2
      else if (p2Score >= target - 1 && p2Score > p1Score) {
          const isMatchBall = p2Games === gamesToWin - 1;
          state = { player: 2, type: isMatchBall ? 'MATCH' : 'GAME' };
      }

      setGameBallState(state as any);

  }, [p1Score, p2Score, p1Games, p2Games, scoringType, gameFormat]);

  // --- VOICE CONTROL LOGIC ---
  const processVoiceCommand = (cmd: string) => {
      console.log("Voice Command:", cmd);
      // Simple keyword matching
      const keywords = {
          p1Score: ['player 1 point', 'point player 1', 'point left', 'score player 1', 'one scores', '得分', '一号得分'],
          p2Score: ['player 2 point', 'point player 2', 'point right', 'score player 2', 'two scores', '二号得分'],
          yesLet: ['yes let', 'let', 'replay', '和球'],
          noLet: ['no let', 'play on', '无和球'],
          strokeP1: ['stroke player 1', 'stroke to player 1', '判给一号', 'stroke left'],
          strokeP2: ['stroke player 2', 'stroke to player 2', '判给二号', 'stroke right'],
      };

      if (keywords.p1Score.some(k => cmd.includes(k))) handleScore(1);
      else if (keywords.p2Score.some(k => cmd.includes(k))) handleScore(2);
      else if (keywords.yesLet.some(k => cmd.includes(k))) handleDecision('LET', 1);
      else if (keywords.noLet.some(k => cmd.includes(k))) handleDecision('NO_LET', 1); // Defaults
      else if (keywords.strokeP1.some(k => cmd.includes(k))) handleDecision('STROKE', 1);
      else if (keywords.strokeP2.some(k => cmd.includes(k))) handleDecision('STROKE', 2);
  };

  const toggleVoiceControl = () => {
    if (isVoiceEnabled) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsVoiceEnabled(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Voice control not supported in this browser. Please use Chrome/Edge.");
        return;
      }
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.lang = language === 'CN' ? 'zh-CN' : 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
          setIsVoiceEnabled(true);
      };

      recognition.onresult = (event: any) => {
        const last = event.results.length - 1;
        const command = event.results[last][0].transcript.trim().toLowerCase();
        setLastVoiceCommand(command);
        processVoiceCommand(command);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setIsVoiceEnabled(false);
            alert("Microphone access denied or service unavailable.");
        }
      };
      
      recognition.onend = () => {
          // Auto-restart if it wasn't manually stopped
          if (isVoiceEnabled && recognitionRef.current) {
              try {
                  recognition.start();
              } catch (e) {
                  // ignore
              }
          } else {
              setIsVoiceEnabled(false);
          }
      };

      recognitionRef.current = recognition;
      try {
          recognition.start();
      } catch (e) {
          console.error(e);
      }
    }
  };

  // Timer Logic
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => {
            if (timerMode === 'REST' || timerMode === 'WARMUP') {
                if (prevTime <= 1) {
                    setIsTimerRunning(false);
                    if (timerMode === 'REST') endRestPeriod();
                    return 0;
                }
                return prevTime - 1;
            }
            return prevTime + 1;
        });
      }, 1000);
    } else if (!isTimerRunning && time !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, time, timerMode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const saveHistory = () => {
    const snapshot = {
        p1Score, p2Score, p1Games, p2Games, server,
        matchScores: [...match.scores],
        matchStatus: match.status,
        matchWinnerId: match.winnerId,
        events: [...(match.events || [])]
    };
    setHistory(prev => [...prev, snapshot]);
  };

  const handleUndo = () => {
      if (history.length === 0) return;
      const lastState = history[history.length - 1];
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      setP1Score(lastState.p1Score);
      setP2Score(lastState.p2Score);
      setP1Games(lastState.p1Games);
      setP2Games(lastState.p2Games);
      setServer(lastState.server);
      setMatch(prev => ({
          ...prev,
          scores: lastState.matchScores,
          status: lastState.matchStatus,
          winnerId: lastState.matchWinnerId,
          events: lastState.events
      }));
  };

  const addEvent = (type: MatchEvent['type'], detail: MatchEvent['detail'], player?: 1 | 2, desc?: string) => {
      const newEvent: MatchEvent = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          timeString: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          type, detail, player, description: desc || detail, scoreSnapshot: `${p1Score}-${p2Score}`
      };
      setMatch(prev => ({ ...prev, events: [...(prev.events || []), newEvent] }));
  };

  const handleScore = (player: 1 | 2, method: 'NORMAL' | 'STROKE' | 'NO_LET' = 'NORMAL') => {
      if (match.status === MatchStatus.COMPLETED) return;
      saveHistory();
      if (player !== server) setServer(player);
      if (player === 1) setP1Score(prev => prev + 1);
      else setP2Score(prev => prev + 1);
      let desc = method === 'NORMAL' ? 'Point' : method === 'STROKE' ? 'Stroke Awarded' : 'No Let Awarded';
      addEvent('SCORE', method, player, desc);
  };

  const handleConductWarning = (player: 1 | 2) => {
      saveHistory();
      addEvent('DECISION', 'CONDUCT_WARNING', player, 'Conduct Warning');
      alert(`Conduct Warning recorded for ${player === 1 ? match.player1?.name : match.player2?.name}`);
  }

  const handleSwapSides = () => {
      saveHistory();
      const tempScore = p1Score; setP1Score(p2Score); setP2Score(tempScore);
      const tempGames = p1Games; setP1Games(p2Games); setP2Games(tempGames);
      setServer(prev => prev === 1 ? 2 : 1);
      setMatch(prev => ({
          ...prev,
          player1: prev.player2,
          player2: prev.player1,
          partner1Name: prev.partner2Name,
          partner2Name: prev.partner1Name,
          scores: prev.scores.map(s => ({ p1: s.p2, p2: s.p1 })),
      }));
      addEvent('INFO', 'START', undefined, 'Sides Swapped');
  };

  const handleDecision = (type: 'STROKE' | 'NO_LET' | 'LET', appealer: 1 | 2) => {
      if (type === 'LET') {
          saveHistory();
          addEvent('DECISION', 'LET', appealer, 'Yes Let (Replay)');
          return;
      }
      let winner = 0;
      if (type === 'STROKE') winner = appealer;
      else if (type === 'NO_LET') winner = appealer === 1 ? 2 : 1;
      handleScore(winner as 1 | 2, type);
  };

  const checkGameWin = () => {
    if (match.status === MatchStatus.COMPLETED) return;
    let targetScore = scoringType === ScoringType.PAR_15 ? 15 : scoringType === ScoringType.HIHO_9 ? 9 : 11;
    const diff = Math.abs(p1Score - p2Score);
    
    if ((p1Score >= targetScore || p2Score >= targetScore) && diff >= 2) {
      let newP1Games = p1Games;
      let newP2Games = p2Games;
      if (p1Score > p2Score) newP1Games++; else newP2Games++;
      setP1Games(newP1Games);
      setP2Games(newP2Games);
      
      const updatedScores = [...match.scores, { p1: p1Score, p2: p2Score }];
      const gamesNeeded = gameFormat === GameFormat.BEST_OF_5 ? 3 : 2;
      let newStatus = match.status;
      let winnerId = undefined;

      addEvent('GAME_END', 'GAME_WIN', p1Score > p2Score ? 1 : 2, `Game ${updatedScores.length} Finished`);

      if (newP1Games === gamesNeeded) {
          newStatus = MatchStatus.COMPLETED;
          winnerId = match.player1?.id;
          setIsTimerRunning(false);
          addEvent('MATCH_END', 'GAME_WIN', 1, 'Match Won by P1');
          setTimeout(() => setShowReport(true), 1500); // Show report automatically on match end
      } else if (newP2Games === gamesNeeded) {
          newStatus = MatchStatus.COMPLETED;
          winnerId = match.player2?.id;
          setIsTimerRunning(false);
          addEvent('MATCH_END', 'GAME_WIN', 2, 'Match Won by P2');
          setTimeout(() => setShowReport(true), 1500);
      } else {
          startRestPeriod();
      }

      setMatch(prev => ({ ...prev, scores: updatedScores, status: newStatus, winnerId: winnerId }));
      setP1Score(0);
      setP2Score(0);
    }
  };

  const startWarmup = () => { setTimerMode('WARMUP'); setTime(240); setIsTimerRunning(true); addEvent('INFO', 'START', undefined, 'Warmup Started'); };
  const startMatchTimer = () => { if (timerMode !== 'MATCH') { setTimerMode('MATCH'); setTime(0); } setIsTimerRunning(true); addEvent('INFO', 'START', undefined, 'Match Timer Started'); };
  const startRestPeriod = () => { setTimerMode('REST'); setTime(90); setIsTimerRunning(true); setShowRestPopup(true); addEvent('INFO', 'START', undefined, 'Rest Period Started'); };
  const endRestPeriod = () => { setShowRestPopup(false); setTimerMode('MATCH'); setTime(0); setIsTimerRunning(false); };

  useEffect(() => { checkGameWin(); }, [p1Score, p2Score]);

  const handleAnalysis = async () => { setIsAnalyzing(true); const result = await analyzeMatch(match); setAnalysis(result); setIsAnalyzing(false); };
  
  // Drawing logic
  const startDrawing = (e: any) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    isDrawing.current = true;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.strokeStyle = "#000"; ctx.lineWidth = 2;
  }
  const draw = (e: any) => {
      if (!isDrawing.current || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX || e.touches[0].clientX) - rect.left;
      const y = (e.clientY || e.touches[0].clientY) - rect.top;
      ctx.lineTo(x, y); ctx.stroke();
  }
  const stopDrawing = () => { isDrawing.current = false; }
  const clearSignature = () => { const canvas = canvasRef.current; if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height); setSignatureImg(null); }
  const saveSignature = () => { const canvas = canvasRef.current; if (canvas) { const sig = canvas.toDataURL(); setSignatureImg(sig); const updatedMatch = { ...match, signatureP1: sig, signatureP2: sig, signatureRef: sig }; setMatch(updatedMatch); updateMatch(updatedMatch); } setShowSignature(false); }
  const handlePrintScoreSheet = () => { window.print(); }

  // TV View Render (Same as before, abbreviated)
  if (tvMode) {
      return (
          <div className="fixed inset-0 bg-black z-50 text-white flex flex-col items-center justify-center p-10">
              <button onClick={() => setTvMode(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><Minimize2/></button>
              <div className="text-4xl font-bold mb-12 uppercase tracking-widest text-slate-400">{match.roundName}</div>
              <div className="flex w-full items-center justify-between gap-10">
                  <div className="flex-1 text-center relative">
                      {server === 1 && <div className="absolute top-0 right-10 w-6 h-6 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_15px_rgba(250,204,21,0.6)]"></div>}
                      <div className="text-6xl font-black mb-4">{match.player1?.name || 'Player 1'}</div>
                      <div className="text-9xl font-bold text-yellow-400">{p1Score}</div>
                      <div className="text-4xl mt-4 font-mono text-slate-400">Games: {p1Games}</div>
                  </div>
                  <div className="text-center w-40">
                      <div className="text-4xl font-bold bg-slate-800 px-6 py-2 rounded mb-4">{p1Games} - {p2Games}</div>
                      <div className="text-2xl text-slate-400">{formatTime(time)}</div>
                  </div>
                  <div className="flex-1 text-center relative">
                      {server === 2 && <div className="absolute top-0 left-10 w-6 h-6 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_15px_rgba(250,204,21,0.6)]"></div>}
                      <div className="text-6xl font-black mb-4">{match.player2?.name || 'Player 2'}</div>
                      <div className="text-9xl font-bold text-yellow-400">{p2Score}</div>
                      <div className="text-4xl mt-4 font-mono text-slate-400">Games: {p2Games}</div>
                  </div>
              </div>
              <div className="mt-20 flex gap-4">
                  {match.scores.map((s, i) => ( <div key={i} className="bg-slate-800 px-6 py-4 rounded text-2xl font-mono"><span className="text-slate-400 mr-4">G{i+1}</span>{s.p1} - {s.p2}</div> ))}
              </div>
          </div>
      )
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto h-full flex flex-col relative">
      
      {showRestPopup && (
          <div className="fixed inset-0 z-[60] bg-slate-900/95 flex flex-col items-center justify-center text-white">
               <h2 className="text-4xl font-bold mb-8 text-yellow-400 animate-pulse">{t.rest}</h2>
               <div className="text-[12rem] font-black font-mono leading-none mb-12">{formatTime(time)}</div>
               <button onClick={endRestPeriod} className="mt-12 px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-xl hover:bg-slate-200">{t.resume}</button>
          </div>
      )}
      
      {/* Analytics Modal */}
      {showReport && <MatchReportModal match={match} onClose={() => setShowReport(false)} />}

      {/* Stream Overlay */}
      {streamMode && <StreamOverlay match={match} p1Score={p1Score} p2Score={p2Score} p1Games={p1Games} p2Games={p2Games} server={server} onClose={() => setStreamMode(false)} />}

      {/* Signature Modal */}
      {showSignature && (
        <div className="absolute inset-0 z-50 bg-slate-900/90 flex items-center justify-center p-4 overflow-y-auto print:fixed print:inset-0 print:bg-white print:z-[100] print:block">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 print:shadow-none print:w-full print:max-w-full print:h-full">
                {/* Canvas Logic Same As Before */}
                <h3 className="text-xl font-bold mb-4">{t.finalize}</h3>
                <div className="print:hidden"><canvas ref={canvasRef} width={600} height={150} className="bg-slate-100 border-2 border-dashed border-slate-300 rounded touch-none w-full" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} /><button onClick={clearSignature} className="text-xs text-red-500 underline mt-1">Clear</button></div>
                <div className="flex gap-3 pt-4 print:hidden"><button onClick={() => setShowSignature(false)} className="flex-1 py-3 border rounded-lg">Cancel</button><button onClick={saveSignature} className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold">Submit</button></div>
            </div>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-slate-900 text-white rounded-t-xl p-4 flex flex-col md:flex-row justify-between items-center shadow-lg gap-4 print:hidden">
        <div className="flex items-center gap-4 w-full md:w-auto">
             <button onClick={() => setShowSettings(true)} className="p-2 bg-slate-800 rounded hover:bg-slate-700"><Settings size={20} className="text-slate-300"/></button>
             <div>
                <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">{match.tournamentId} • {match.roundName}</div>
                <div className="font-bold text-lg">{t.court}</div>
                {match.referee && <div className="text-xs text-yellow-500 font-medium flex items-center gap-1"><Flag size={10}/> {t.referee}: {match.referee}</div>}
             </div>
        </div>
        <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${timerMode === 'REST' ? 'bg-red-500 animate-pulse' : timerMode === 'WARMUP' ? 'bg-orange-500' : 'bg-green-500'}`}>{timerMode === 'WARMUP' ? t.warmup : timerMode === 'REST' ? t.rest : t.match}</div>
            <div className="font-mono text-2xl font-bold w-20 text-center">{formatTime(time)}</div>
            {timerMode !== 'MATCH' && !isTimerRunning ? ( <button onClick={startMatchTimer} className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-xs">START MATCH</button> ) : ( <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600">{isTimerRunning ? <Pause size={20} /> : <Play size={20} />}</button> )}
            <button onClick={() => setTime(0)} className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600"><RefreshCw size={20} /></button>
        </div>
      </div>

      {/* Main Scoreboard */}
      <div className="flex-1 bg-white border-x border-b border-slate-200 shadow-sm flex flex-col md:flex-row print:hidden">
        {/* Player 1 Section */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-slate-100 relative bg-blue-50/30">
            {match.winnerId === match.player1?.id && <div className="absolute top-4 right-4 bg-yellow-400 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"><Trophy size={12}/> WINNER</div>}
            
            {/* Game/Match Ball Indicator P1 */}
            {gameBallState?.player === 1 && (
                <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white shadow-lg animate-pulse flex items-center gap-2 ${gameBallState.type === 'MATCH' ? 'bg-red-500' : 'bg-orange-500'}`}>
                    <AlertTriangle size={12}/> {gameBallState.type === 'MATCH' ? t.matchBall : t.gameBall}
                </div>
            )}

            <button onClick={() => setServer(1)} className={`absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full transition-all ${server === 1 ? 'bg-yellow-100 ring-2 ring-yellow-400' : 'bg-transparent opacity-50 hover:opacity-100'}`}>
                 <span className="text-xs font-bold text-slate-700">{t.server}</span>
                 {server === 1 ? <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-sm animate-pulse"></div> : <div className="w-3 h-3 rounded-full bg-slate-300"></div>}
            </button>
            
            <div className="text-center mb-6">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900">{match.player1?.name || 'Player 1'}</h2>
                <p className="text-slate-500">{match.player1?.club || 'Club'}</p>
                {match.partner1Name && <p className="text-sm text-slate-400 font-medium">& {match.partner1Name}</p>}
            </div>
            
            <div className="flex items-center gap-4">
                <button onClick={() => handleDecision('STROKE', 1)} className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded hover:bg-blue-200 hover:text-blue-800 font-bold mb-2">STROKE</button>
                <button onClick={() => handleScore(1)} className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-blue-600 text-white flex flex-col items-center justify-center shadow-xl hover:bg-blue-700 transition-transform active:scale-95 disabled:opacity-50 disabled:scale-100 relative overflow-hidden" disabled={match.status === MatchStatus.COMPLETED}>
                    {/* Visual cue for server on button */}
                    {server === 1 && <div className="absolute top-0 w-full h-2 bg-yellow-400/50"></div>}
                    <span className="text-6xl md:text-8xl font-black leading-none">{p1Score}</span>
                </button>
            </div>
            
            <div className="mt-8 flex gap-4">
                <div className="text-center">
                    <div className="text-xs text-slate-500 font-bold uppercase mb-1">{t.game}</div>
                    <div className="text-4xl font-bold text-blue-900 bg-white px-4 py-2 rounded-lg border border-blue-100">{p1Games}</div>
                </div>
            </div>
        </div>

        {/* Referee Decision Panel */}
        <div className="hidden md:flex flex-col justify-center gap-4 p-4 bg-slate-50 border-x border-slate-200 w-48 z-10">
            <div className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t.decision}</div>
            <button onClick={() => handleDecision('LET', 1)} className="py-4 bg-white border-2 border-green-200 text-green-700 rounded-lg font-bold hover:bg-green-50 shadow-sm flex flex-col items-center">
                <AlertTriangle size={20} className="mb-1"/>
                YES LET
            </button>
            <button onClick={() => handleDecision('NO_LET', 1)} className="py-4 bg-white border-2 border-red-200 text-red-700 rounded-lg font-bold hover:bg-red-50 shadow-sm flex flex-col items-center">
                <XCircle size={20} className="mb-1"/>
                NO LET
            </button>
            <div className="h-px bg-slate-200 my-2"></div>
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleConductWarning(1)} className="p-2 bg-orange-100 text-orange-700 rounded text-[10px] font-bold text-center hover:bg-orange-200" title="Warning P1">WARN L</button>
                <button onClick={() => handleConductWarning(2)} className="p-2 bg-orange-100 text-orange-700 rounded text-[10px] font-bold text-center hover:bg-orange-200" title="Warning P2">WARN R</button>
            </div>
            <button onClick={startRestPeriod} className="py-2 bg-slate-200 text-slate-600 rounded font-medium text-xs flex items-center justify-center gap-1 hover:bg-slate-300">
                <TimerIcon size={14}/> 90s Rest
            </button>
        </div>

        {/* Player 2 Section */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative bg-red-50/30">
            {match.winnerId === match.player2?.id && <div className="absolute top-4 left-4 bg-yellow-400 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"><Trophy size={12}/> WINNER</div>}
            
            {/* Game/Match Ball Indicator P2 */}
            {gameBallState?.player === 2 && (
                <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white shadow-lg animate-pulse flex items-center gap-2 ${gameBallState.type === 'MATCH' ? 'bg-red-500' : 'bg-orange-500'}`}>
                    <AlertTriangle size={12}/> {gameBallState.type === 'MATCH' ? t.matchBall : t.gameBall}
                </div>
            )}

            <button onClick={() => setServer(2)} className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-1 rounded-full transition-all ${server === 2 ? 'bg-yellow-100 ring-2 ring-yellow-400' : 'bg-transparent opacity-50 hover:opacity-100'}`}>
                 {server === 2 ? <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-sm animate-pulse"></div> : <div className="w-3 h-3 rounded-full bg-slate-300"></div>}
                 <span className="text-xs font-bold text-slate-700">{t.server}</span>
            </button>

            <div className="text-center mb-6">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900">{match.player2?.name || 'Player 2'}</h2>
                <p className="text-slate-500">{match.player2?.club || 'Club'}</p>
                {match.partner2Name && <p className="text-sm text-slate-400 font-medium">& {match.partner2Name}</p>}
            </div>
            
            <div className="flex items-center gap-4">
                <button onClick={() => handleScore(2)} className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-red-600 text-white flex flex-col items-center justify-center shadow-xl hover:bg-red-700 transition-transform active:scale-95 disabled:opacity-50 disabled:scale-100 relative overflow-hidden" disabled={match.status === MatchStatus.COMPLETED}>
                    {/* Visual cue for server on button */}
                    {server === 2 && <div className="absolute top-0 w-full h-2 bg-yellow-400/50"></div>}
                    <span className="text-6xl md:text-8xl font-black leading-none">{p2Score}</span>
                </button>
                <button onClick={() => handleDecision('STROKE', 2)} className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded hover:bg-red-200 hover:text-red-800 font-bold mb-2">STROKE</button>
            </div>

            <div className="mt-8 flex gap-4">
                <div className="text-center">
                    <div className="text-xs text-slate-500 font-bold uppercase mb-1">{t.game}</div>
                    <div className="text-4xl font-bold text-red-900 bg-white px-4 py-2 rounded-lg border border-red-100">{p2Games}</div>
                </div>
            </div>
        </div>
      </div>
      
      {/* Mobile Referee Actions (visible only on small screens) */}
      <div className="md:hidden grid grid-cols-4 gap-2 p-2 bg-slate-50 border-b border-slate-200">
            <button onClick={() => handleDecision('LET', 1)} className="p-2 bg-white border border-green-200 text-green-700 rounded font-bold text-xs shadow-sm">YES LET</button>
            <button onClick={() => handleDecision('NO_LET', 1)} className="p-2 bg-white border border-red-200 text-red-700 rounded font-bold text-xs shadow-sm">NO LET</button>
            <button onClick={() => handleConductWarning(1)} className="p-2 bg-orange-100 text-orange-700 rounded text-[10px] font-bold">WARN L</button>
            <button onClick={() => handleConductWarning(2)} className="p-2 bg-orange-100 text-orange-700 rounded text-[10px] font-bold">WARN R</button>
      </div>

      {/* Controls Footer */}
      <div className="bg-slate-100 p-4 rounded-b-xl flex flex-col md:flex-row gap-4 items-center justify-between border border-slate-200 mt-4 print:hidden">
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
             <button onClick={() => setTvMode(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white border border-slate-800 rounded-lg font-medium hover:bg-slate-900 whitespace-nowrap">
                <Monitor size={16} /> {t.tvMode}
             </button>
             <button onClick={() => setStreamMode(true)} className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 whitespace-nowrap">
                <Cast size={16} /> {t.streamOverlay}
             </button>
             <button onClick={() => setShowReport(true)} className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 whitespace-nowrap">
                <BarChart3 size={16} /> {t.stats}
             </button>
             <button onClick={handleUndo} disabled={history.length === 0} className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 whitespace-nowrap disabled:opacity-50">
                <RotateCcw size={16} /> {t.undo}
             </button>
             <button onClick={toggleVoiceControl} className={`flex items-center gap-2 px-4 py-2 border rounded-lg font-medium whitespace-nowrap transition-colors ${isVoiceEnabled ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-300'}`}>
                {isVoiceEnabled ? <Mic size={16}/> : <MicOff size={16}/>} {isVoiceEnabled ? t.voiceOn : t.voiceOff}
             </button>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
            <button onClick={handleAnalysis} disabled={isAnalyzing} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 shadow-sm disabled:opacity-50">
                {isAnalyzing ? <RefreshCw className="animate-spin" size={18} /> : <Mic size={18} />}
                AI Analysis
            </button>
            <button onClick={() => setShowSignature(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 shadow-sm">
                <CheckCircle size={18} />
                {t.finalize}
            </button>
        </div>
      </div>
      
      {analysis && (
        <div className="mt-4 p-4 bg-purple-50 border border-purple-100 rounded-lg print:hidden">
            <h4 className="text-purple-900 font-bold flex items-center gap-2 mb-2"><Mic size={16} /> AI Summary</h4>
            <p className="text-purple-800 text-sm italic">"{analysis}"</p>
        </div>
      )}
    </div>
  );
};

export default ScoringPage;
