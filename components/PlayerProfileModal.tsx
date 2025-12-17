
import React, { useMemo } from 'react';
import { X, Trophy, TrendingUp, Activity, Calendar, MapPin, Medal } from 'lucide-react';
import { Player, Match, MatchStatus } from '../types';
import { useData } from '../contexts/DataContext';

interface Props {
  playerId: string;
  onClose: () => void;
}

const PlayerProfileModal: React.FC<Props> = ({ playerId, onClose }) => {
  const { players, matches } = useData();
  
  const player = players.find(p => p.id === playerId);
  
  // Calculate Stats
  const playerStats = useMemo(() => {
      if (!player) return null;
      
      const playerMatches = matches.filter(m => 
          (m.player1?.id === player.id || m.player2?.id === player.id) && 
          m.status === MatchStatus.COMPLETED
      );
      
      const totalPlayed = playerMatches.length;
      const wins = playerMatches.filter(m => m.winnerId === player.id).length;
      const losses = totalPlayed - wins;
      const winRate = totalPlayed > 0 ? Math.round((wins / totalPlayed) * 100) : 0;
      
      // Recent Form (Last 5)
      const recentMatches = [...playerMatches]
          .sort((a, b) => (b.events?.[b.events.length-1]?.timestamp || 0) - (a.events?.[a.events.length-1]?.timestamp || 0)) // Sort mainly by match end time approx
          .slice(0, 5);
          
      const form = recentMatches.map(m => m.winnerId === player.id ? 'W' : 'L').reverse(); // Oldest to newest for display usually? Or Newest first. Let's do list.

      return { totalPlayed, wins, losses, winRate, recentMatches, form };
  }, [player, matches]);

  if (!player || !playerStats) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Avatar placeholder */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 p-2 rounded-full"><X size={20}/></button>
            <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-white text-blue-600 flex items-center justify-center text-3xl font-black border-4 border-blue-400/30 shadow-xl">
                    {player.name.charAt(0)}
                </div>
                <div>
                    <h2 className="text-3xl font-bold">{player.name}</h2>
                    <div className="flex items-center gap-4 mt-2 text-blue-100 text-sm font-medium">
                        <span className="flex items-center gap-1"><MapPin size={14}/> {player.club}</span>
                        <span className="flex items-center gap-1"><Trophy size={14}/> Rank #{player.rank}</span>
                        <span className="bg-blue-500/50 px-2 py-0.5 rounded text-xs border border-blue-400/50">Points: {player.points}</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="p-6 overflow-y-auto">
            {/* Key Stats Grid */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                    <div className="text-slate-400 text-xs font-bold uppercase mb-1">Matches</div>
                    <div className="text-2xl font-black text-slate-800">{playerStats.totalPlayed}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-xl text-center border border-green-100">
                    <div className="text-green-600/70 text-xs font-bold uppercase mb-1">Wins</div>
                    <div className="text-2xl font-black text-green-700">{playerStats.wins}</div>
                </div>
                <div className="bg-red-50 p-4 rounded-xl text-center border border-red-100">
                    <div className="text-red-600/70 text-xs font-bold uppercase mb-1">Losses</div>
                    <div className="text-2xl font-black text-red-700">{playerStats.losses}</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-100">
                    <div className="text-blue-600/70 text-xs font-bold uppercase mb-1">Win Rate</div>
                    <div className="text-2xl font-black text-blue-700">{playerStats.winRate}%</div>
                </div>
            </div>

            {/* Form Guide */}
            <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Activity size={16}/> Recent Form
                </h3>
                <div className="flex items-center gap-2">
                    {playerStats.form.length > 0 ? playerStats.form.map((res, i) => (
                        <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${res === 'W' ? 'bg-green-500' : 'bg-slate-300'}`}>
                            {res}
                        </div>
                    )) : <span className="text-slate-400 italic text-sm">No matches played yet.</span>}
                </div>
            </div>

            {/* Match History List */}
            <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Calendar size={16}/> Match History
                </h3>
                <div className="space-y-2">
                    {playerStats.recentMatches.length > 0 ? playerStats.recentMatches.map(m => {
                        const isWinner = m.winnerId === player.id;
                        const opponent = m.player1?.id === player.id ? m.player2 : m.player1;
                        const score = m.scores.map(s => m.player1?.id === player.id ? `${s.p1}-${s.p2}` : `${s.p2}-${s.p1}`).join(', ');
                        
                        return (
                            <div key={m.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3">
                                    <div className={`w-1.5 h-1.5 rounded-full ${isWinner ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                            {isWinner ? <span className="text-green-600">Won vs</span> : <span className="text-red-500">Lost to</span>}
                                            {opponent?.name || 'Bye'}
                                        </div>
                                        <div className="text-xs text-slate-400">{m.roundName} • {m.tournamentId}</div>
                                    </div>
                                </div>
                                <div className="font-mono text-sm font-medium bg-slate-50 px-2 py-1 rounded text-slate-600">
                                    {score}
                                </div>
                            </div>
                        )
                    }) : (
                        <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            No match history available.
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfileModal;
