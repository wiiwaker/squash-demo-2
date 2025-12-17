
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from 'recharts';
import { Language, Player } from '../types';
import { Users, TrendingUp, Sword, Shuffle, Trophy, History, Activity, AlertCircle } from 'lucide-react';
import { useData } from '../contexts/DataContext';

interface Props {
  language: Language;
}

// Data Interface based on the PDF
interface RankingEntry {
  rank: number;
  name: string;
  totalPoints: number;
  rankingPoints: number;
  change: number; 
}

type RankingCategory = 'U19' | 'U17' | 'U15' | 'U13' | 'U11' | 'U9';
type Gender = 'Boys' | 'Girls';

// --- STATIC DATA ARCHIVE (Kept for reference) ---
const archiveData: Record<Gender, Record<RankingCategory, RankingEntry[]>> = {
  Boys: {
    U19: [
      { rank: 1, name: "胡哲", totalPoints: 1900, rankingPoints: 1900, change: 0 },
      { rank: 1, name: "杨倪瑞", totalPoints: 1900, rankingPoints: 1900, change: 0 },
      { rank: 3, name: "梁皓骢", totalPoints: 1940, rankingPoints: 1715, change: 0 },
      { rank: 4, name: "陈浩瑀", totalPoints: 1148, rankingPoints: 1148, change: 0 },
      { rank: 5, name: "张灵希", totalPoints: 1000, rankingPoints: 1000, change: 0 },
    ],
    U17: [], U15: [], U13: [], U11: [], U9: [] // Simplified for brevity in this view
  },
  Girls: {
    U19: [], U17: [], U15: [], U13: [], U11: [], U9: []
  }
};

const RankingsPage: React.FC<Props> = ({ language }) => {
  const { players } = useData(); // Connect to Live Data
  
  const [viewMode, setViewMode] = useState<'LIVE' | 'ARCHIVE'>('LIVE');
  const [gender, setGender] = useState<Gender>('Boys');
  const [ageGroup, setAgeGroup] = useState<RankingCategory>('U19');
  
  // Comparison State
  const [showComparison, setShowComparison] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]); // Player IDs for comparison

  const t = {
    title: language === 'CN' ? '积分排名系统' : 'Ranking System',
    live: language === 'CN' ? '实时排名' : 'Live Rankings',
    archive: language === 'CN' ? '历史归档 (2024)' : 'Archive (2024)',
    subtitle: language === 'CN' ? '全国壁球青少年积分系统' : 'National Junior Squash Points System',
    trend: language === 'CN' ? '积分趋势' : 'Points Trend',
    rank: language === 'CN' ? '排名' : 'Rank',
    name: language === 'CN' ? '姓名' : 'Name',
    points: language === 'CN' ? '总积分' : 'Total Points',
    club: language === 'CN' ? '俱乐部' : 'Club',
    compare: language === 'CN' ? '球员对比' : 'Compare',
    skills: language === 'CN' ? '技术六维图' : 'Skill Radar',
    noData: language === 'CN' ? '暂无该组别数据' : 'No data for this category',
  };

  // --- LIVE DATA LOGIC ---
  const liveRankings = useMemo(() => {
      // In a real app, we would filter by age group DOB. Here we just sort all by points.
      return [...players]
        .sort((a, b) => b.points - a.points)
        .map((p, index) => ({ ...p, calculatedRank: index + 1 }));
  }, [players]);

  // Transform top 5 for Chart Data
  const chartData = useMemo(() => {
      const source = viewMode === 'LIVE' ? liveRankings : archiveData[gender][ageGroup];
      return source.slice(0, 5).map((p: any) => ({
          name: p.name,
          points: p.points || p.totalPoints,
      }));
  }, [viewMode, liveRankings, gender, ageGroup]);

  // Generate Pseudo-Random Skill Stats
  const getPlayerStats = (name: string, rank: number) => {
      const seed = name.length; 
      const base = 60 + (100 - rank * 2); 
      return [
        { subject: 'Power', A: Math.min(99, Math.max(50, Math.round(base + (seed % 20)))) },
        { subject: 'Speed', A: Math.min(99, Math.max(50, Math.round(base + (seed * 2 % 20)))) },
        { subject: 'Tactics', A: Math.min(99, Math.max(50, Math.round(base + (seed * 3 % 25)))) },
        { subject: 'Technique', A: Math.min(99, Math.max(50, Math.round(base + (seed * 4 % 15)))) },
        { subject: 'Mentality', A: Math.min(99, Math.max(50, Math.round(base + (seed * 5 % 30)))) },
        { subject: 'Stamina', A: Math.min(99, Math.max(50, Math.round(base + (seed * 6 % 20)))) },
      ];
  };

  const comparisonData = useMemo(() => {
      if (compareIds.length < 2) return [];
      const p1 = liveRankings.find(p => p.id === compareIds[0]);
      const p2 = liveRankings.find(p => p.id === compareIds[1]);
      if (!p1 || !p2) return [];

      const p1Stats = getPlayerStats(p1.name, p1.calculatedRank);
      const p2Stats = getPlayerStats(p2.name, p2.calculatedRank);
      
      return p1Stats.map((stat, i) => ({
          subject: stat.subject,
          A: stat.A,
          B: p2Stats[i].A,
          fullMark: 100,
      }));
  }, [compareIds, liveRankings]);

  const p1 = liveRankings.find(p => p.id === compareIds[0]);
  const p2 = liveRankings.find(p => p.id === compareIds[1]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{t.title}</h2>
            <p className="text-slate-500 mt-1 flex items-center gap-2"><Trophy size={14} className="text-yellow-500"/> {t.subtitle}</p>
          </div>
          
          <div className="bg-slate-100 p-1 rounded-lg flex">
              <button 
                onClick={() => setViewMode('LIVE')} 
                className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'LIVE' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                  <Activity size={16}/> {t.live}
              </button>
              <button 
                onClick={() => setViewMode('ARCHIVE')} 
                className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'ARCHIVE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                  <History size={16}/> {t.archive}
              </button>
          </div>
      </div>

      {/* Comparison Modal Overlay */}
      {showComparison && viewMode === 'LIVE' && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowComparison(false)}>
               <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                   <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                       <h3 className="text-xl font-bold text-white flex items-center gap-2"><Sword className="text-purple-500"/> {t.compare}</h3>
                       <button onClick={() => setShowComparison(false)} className="text-slate-400 hover:text-white"><Shuffle size={20}/></button>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 items-center">
                        {/* Player 1 */}
                        <div className="text-center">
                            <div className="w-24 h-24 mx-auto bg-blue-600 rounded-full flex items-center justify-center text-4xl font-black text-white mb-4 shadow-lg shadow-blue-900/50">
                                {p1?.name.charAt(0)}
                            </div>
                            <h4 className="text-2xl font-bold text-white mb-1">{p1?.name}</h4>
                            <div className="text-blue-400 font-mono text-xl font-bold">{p1?.points} PTS</div>
                            <div className="mt-4 text-sm text-slate-400">Rank #{p1?.calculatedRank}</div>
                        </div>

                        {/* Chart */}
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={comparisonData}>
                                    <PolarGrid stroke="#334155" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name={p1?.name} dataKey="A" stroke="#3b82f6" strokeWidth={3} fill="#3b82f6" fillOpacity={0.3} />
                                    <Radar name={p2?.name} dataKey="B" stroke="#f472b6" strokeWidth={3} fill="#ec4899" fillOpacity={0.3} />
                                    <Legend />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Player 2 Select */}
                        <div className="text-center">
                             <select 
                                className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-2 mb-4 text-center font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                                value={compareIds[1]}
                                onChange={(e) => setCompareIds([compareIds[0], e.target.value])}
                             >
                                 {liveRankings.map(p => <option key={p.id} value={p.id}>{p.name} (#{p.calculatedRank})</option>)}
                             </select>
                             {p2 && (
                                 <>
                                    <div className="w-24 h-24 mx-auto bg-pink-600 rounded-full flex items-center justify-center text-4xl font-black text-white mb-4 shadow-lg shadow-pink-900/50">
                                        {p2.name.charAt(0)}
                                    </div>
                                    <div className="text-pink-400 font-mono text-xl font-bold">{p2.points} PTS</div>
                                 </>
                             )}
                        </div>
                   </div>
               </div>
          </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Charts & Highlights */}
          <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><TrendingUp size={18}/> Top 5 Leaders</h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{left: 0}}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 11, fill: '#64748b'}} />
                            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                            <Bar dataKey="points" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                  </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                  <h3 className="font-bold text-lg mb-2">Pro Stats</h3>
                  <p className="text-indigo-100 text-sm mb-4">Compare players head-to-head to see skill breakdowns.</p>
                  <button 
                    disabled={liveRankings.length < 2 || viewMode === 'ARCHIVE'}
                    onClick={() => { 
                        if(liveRankings.length >= 2) {
                            setCompareIds([liveRankings[0].id, liveRankings[1].id]);
                            setShowComparison(true);
                        }
                    }}
                    className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm py-2 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      Launch Comparison
                  </button>
              </div>
          </div>

          {/* Right: Ranking Table */}
          <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden min-h-[500px] flex flex-col">
                  {viewMode === 'ARCHIVE' && (
                      <div className="p-4 border-b border-slate-100 flex gap-2 overflow-x-auto bg-slate-50">
                          {(['U19', 'U17', 'U15'] as RankingCategory[]).map(cat => (
                              <button 
                                key={cat} 
                                onClick={() => setAgeGroup(cat)}
                                className={`px-3 py-1 text-xs font-bold rounded-full border ${ageGroup === cat ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}
                              >
                                  {cat}
                              </button>
                          ))}
                      </div>
                  )}

                  <table className="w-full text-left text-sm flex-1">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-xs sticky top-0">
                          <tr>
                              <th className="px-6 py-4 w-16 text-center">{t.rank}</th>
                              <th className="px-6 py-4">{t.name}</th>
                              <th className="px-6 py-4">{t.club}</th>
                              <th className="px-6 py-4 text-right">{t.points}</th>
                              {viewMode === 'LIVE' && <th className="px-6 py-4 text-center w-20">Trend</th>}
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {(viewMode === 'LIVE' ? liveRankings : archiveData[gender][ageGroup] || []).map((player: any, idx) => (
                              <tr key={player.id || idx} className="hover:bg-slate-50 group transition-colors">
                                  <td className="px-6 py-4 font-black text-slate-700 text-center">
                                      {viewMode === 'LIVE' ? player.calculatedRank : player.rank}
                                  </td>
                                  <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${idx < 3 ? 'bg-yellow-500' : 'bg-slate-300'}`}>
                                          {player.name.charAt(0)}
                                      </div>
                                      {player.name}
                                  </td>
                                  <td className="px-6 py-4 text-slate-500">{player.club || '-'}</td>
                                  <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">
                                      {player.points || player.rankingPoints}
                                  </td>
                                  {viewMode === 'LIVE' && (
                                      <td className="px-6 py-4 text-center">
                                          {/* Mock Trend Logic */}
                                          {idx % 3 === 0 ? <span className="text-green-500 text-xs">▲ 1</span> : 
                                           idx % 4 === 0 ? <span className="text-red-400 text-xs">▼ 1</span> : 
                                           <span className="text-slate-300 text-xs">-</span>}
                                      </td>
                                  )}
                              </tr>
                          ))}
                          {(viewMode === 'ARCHIVE' && (!archiveData[gender][ageGroup] || archiveData[gender][ageGroup].length === 0)) && (
                              <tr>
                                  <td colSpan={5} className="py-20 text-center text-slate-400 flex flex-col items-center justify-center">
                                      <AlertCircle size={32} className="mb-2 opacity-50"/>
                                      {t.noData}
                                  </td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
    </div>
  );
};

export default RankingsPage;
