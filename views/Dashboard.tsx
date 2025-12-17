
import React, { useMemo, useState, useEffect } from 'react';
import { Calendar, Users, Activity, Trophy, ArrowUpRight, Clock, MapPin, Trash2, AlertTriangle, ShieldAlert, Monitor, Maximize2, Minimize2, CheckCircle2, TrendingUp } from 'lucide-react';
import { Language, Match, Player } from '../types';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  language: Language;
}

const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden group">
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${color} opacity-5 group-hover:scale-110 transition-transform duration-500`}></div>
    <div className="flex justify-between items-start relative z-10">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-2">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${color} bg-opacity-10 text-white`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
    <div className="mt-4 flex items-center text-sm relative z-10">
      <span className="text-green-500 flex items-center gap-1 font-medium bg-green-50 px-1.5 py-0.5 rounded">
        <ArrowUpRight size={14} /> {change}
      </span>
      <span className="text-slate-400 ml-2 text-xs">vs last month</span>
    </div>
  </div>
);

// --- COURT STATUS COMPONENT ---
const CourtStatusWidget: React.FC<{ matches: Match[] }> = ({ matches }) => {
    const courts = ['Center', 'Court 1', 'Court 2', 'Court 3'];
    
    // Find active match for each court
    const getStatus = (courtName: string) => {
        const activeMatch = matches.find(m => m.court === courtName && m.status === 'IN_PROGRESS');
        if (activeMatch) return { status: 'BUSY', match: activeMatch };
        
        // Find next match
        const nextMatch = matches
            .filter(m => m.court === courtName && m.status === 'SCHEDULED' && m.startTime)
            .sort((a,b) => (a.startTime || '').localeCompare(b.startTime || ''))[0];
            
        return { status: 'FREE', next: nextMatch };
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <MapPin size={20} className="text-slate-400"/> Court Status
            </h3>
            <div className="space-y-4">
                {courts.map(court => {
                    const info = getStatus(court);
                    return (
                        <div key={court} className="flex items-center gap-4 p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                            <div className="w-24 font-bold text-slate-700 flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${info.status === 'BUSY' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                {court}
                            </div>
                            <div className="flex-1">
                                {info.status === 'BUSY' ? (
                                    <div className="flex items-center gap-2 text-sm text-slate-800 font-bold">
                                        <span className="relative flex h-2.5 w-2.5">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                        </span>
                                        {info.match?.player1?.name} vs {info.match?.player2?.name}
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-400 flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                                        {info.next ? `Next: ${info.next.startTime} (${info.next.roundName})` : 'Available'}
                                    </div>
                                )}
                            </div>
                            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${info.status === 'BUSY' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {info.status === 'BUSY' ? 'Live' : 'Open'}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- VENUE TV MODE COMPONENT ---
// (Kept same as provided in previous turns, simplified here for brevity of the file update focus)
const VenueTVMode: React.FC<{ matches: Match[], onClose: () => void }> = ({ matches, onClose }) => {
    const activeMatches = matches.filter(m => m.status === 'IN_PROGRESS');
    const nextMatches = matches.filter(m => m.status === 'SCHEDULED' && m.startTime).sort((a,b) => (a.startTime || '').localeCompare(b.startTime || '')).slice(0, 4);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900 text-white flex flex-col p-8 overflow-hidden animate-in fade-in duration-300">
             <div className="flex justify-between items-center mb-10 border-b border-slate-700 pb-4">
                 <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-2xl shadow-lg shadow-blue-500/50">S</div>
                     <div>
                         <h1 className="text-3xl font-black uppercase tracking-wider">ProSquash Open 2024</h1>
                         <p className="text-slate-400 text-lg">Live Venue Display</p>
                     </div>
                 </div>
                 <div className="flex items-center gap-6">
                     <div className="text-4xl font-mono font-bold text-blue-400">{currentTime}</div>
                     <button onClick={onClose} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-500 hover:text-white transition-colors"><Minimize2 size={24}/></button>
                 </div>
             </div>
             <div className="flex-1 grid grid-cols-3 gap-8">
                 <div className="col-span-2 flex flex-col gap-6">
                     <h2 className="text-2xl font-bold flex items-center gap-3 text-red-500 animate-pulse"><Activity /> ON COURT NOW</h2>
                     {activeMatches.length === 0 ? (
                         <div className="flex-1 flex flex-col items-center justify-center bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-700 text-slate-500">
                             <Clock size={64} className="mb-4 opacity-20"/>
                             <p className="text-2xl">No matches currently in progress</p>
                         </div>
                     ) : (
                         <div className="grid grid-cols-1 gap-4 overflow-y-auto">
                             {activeMatches.map(m => {
                                  const p1G = m.scores.filter(s => s.p1 > s.p2).length;
                                  const p2G = m.scores.filter(s => s.p2 > s.p1).length;
                                  return (
                                     <div key={m.id} className="bg-slate-800 rounded-2xl p-6 border-l-8 border-green-500 shadow-xl flex items-center justify-between">
                                         <div className="flex flex-col items-center min-w-[100px]">
                                             <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">COURT</div>
                                             <div className="text-3xl font-black">{m.court?.replace('Court ', '') || 'C1'}</div>
                                         </div>
                                         <div className="flex-1 flex justify-between items-center px-10">
                                             <div className="text-left w-1/3">
                                                 <div className="text-3xl font-bold truncate">{m.player1?.name}</div>
                                             </div>
                                             <div className="flex flex-col items-center px-6 bg-black/30 rounded-lg py-2">
                                                 <div className="text-5xl font-mono font-black text-yellow-400 tracking-widest">{p1G}-{p2G}</div>
                                             </div>
                                             <div className="text-right w-1/3">
                                                 <div className="text-3xl font-bold truncate">{m.player2?.name}</div>
                                             </div>
                                         </div>
                                         <div className="text-right">
                                             <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">{m.roundName}</div>
                                         </div>
                                     </div>
                                  )
                             })}
                         </div>
                     )}
                 </div>
                 <div className="col-span-1 bg-slate-800/30 border border-slate-700 rounded-2xl p-6 flex flex-col">
                     <h2 className="text-2xl font-bold flex items-center gap-3 text-blue-400 mb-6"><Calendar /> UP NEXT</h2>
                     <div className="space-y-4 overflow-y-auto">
                         {nextMatches.length === 0 ? <p className="text-slate-500 text-center mt-10">No upcoming matches scheduled.</p> : 
                             nextMatches.map(m => (
                                 <div key={m.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col gap-2">
                                     <div className="flex justify-between items-center text-sm font-bold text-slate-400">
                                         <span className="flex items-center gap-2"><Clock size={14}/> {m.startTime}</span>
                                         <span className="flex items-center gap-2 text-blue-300"><MapPin size={14}/> {m.court}</span>
                                     </div>
                                     <div className="flex justify-between items-center text-lg font-bold">
                                         <span className="truncate w-5/12 text-right">{m.player1?.name || 'TBD'}</span>
                                         <span className="text-slate-600 px-2">vs</span>
                                         <span className="truncate w-5/12">{m.player2?.name || 'TBD'}</span>
                                     </div>
                                 </div>
                             ))
                         }
                     </div>
                 </div>
             </div>
        </div>
    );
};

const Dashboard: React.FC<Props> = ({ language }) => {
  const { matches, players, resetSystem } = useData();
  const { permissions } = useAuth();
  const [venueMode, setVenueMode] = useState(false);

  const activeMatches = matches.filter(m => m.status === 'IN_PROGRESS');
  const scheduledMatches = matches.filter(m => m.status === 'SCHEDULED');
  const registeredPlayers = players.length;

  const activityFeed = useMemo(() => {
      const matchEvents = matches
          .filter(m => m.status === 'COMPLETED')
          .map(m => ({
              id: m.id,
              type: 'MATCH',
              title: 'Match Result',
              desc: `${m.player1?.name} def. ${m.player2?.name} (${m.scores.map(s => `${s.p1}-${s.p2}`).join(', ')})`,
              time: 'Recently',
              icon: Trophy,
              color: 'text-yellow-600',
              bg: 'bg-yellow-100'
          }));
      
      const newPlayers = players.slice(-5).reverse().map(p => ({
          id: p.id,
          type: 'PLAYER',
          title: 'New Member',
          desc: `${p.name} joined ${p.club}`,
          time: 'Recently',
          icon: Users,
          color: 'text-blue-600',
          bg: 'bg-blue-100'
      }));

      return [...matchEvents, ...newPlayers]; 
  }, [matches, players]);

  const t = {
    overview: language === 'CN' ? '赛事概览' : 'Tournament Overview',
    welcome: language === 'CN' ? '欢迎回来，管理员。' : 'Welcome back, Administrator.',
    activeTournaments: language === 'CN' ? '进行中赛事' : 'Active Tournaments',
    registeredAthletes: language === 'CN' ? '注册运动员' : 'Registered Athletes',
    matchesScheduled: language === 'CN' ? '已排赛程' : 'Matches Scheduled',
    liveCourts: language === 'CN' ? '直播场地' : 'Live Courts',
    liveMatches: language === 'CN' ? '实时比分' : 'Live Matches',
    systemMgmt: language === 'CN' ? '系统管理' : 'System Management',
    resetData: language === 'CN' ? '重置所有数据' : 'Factory Reset Data',
    resetDesc: language === 'CN' ? '警告：此操作将清空所有比赛、球员和设置数据，无法撤销。' : 'Warning: This will delete all matches, players, and settings. Irreversible.',
    venueMode: language === 'CN' ? '现场大屏模式' : 'Venue TV Mode',
    activity: language === 'CN' ? '动态' : 'Activity Feed',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {venueMode && <VenueTVMode matches={matches} onClose={() => setVenueMode(false)} />}
      
      <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{t.overview}</h2>
            <p className="text-slate-500 mt-1">{t.welcome}</p>
          </div>
          <button onClick={() => setVenueMode(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800 shadow-lg transition-transform hover:scale-105 active:scale-95">
              <Monitor size={18} /> {t.venueMode}
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t.activeTournaments} value="3" change="+1" icon={Trophy} color="bg-blue-500" />
        <StatCard title={t.registeredAthletes} value={registeredPlayers} change="+12%" icon={Users} color="bg-emerald-500" />
        <StatCard title={t.matchesScheduled} value={scheduledMatches.length} change={`+${scheduledMatches.length}`} icon={Calendar} color="bg-purple-500" />
        <StatCard title={t.liveCourts} value={activeMatches.length > 0 ? activeMatches.length : '0'} change={activeMatches.length > 0 ? "Busy" : "Quiet"} icon={Activity} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-8">
            {/* LIVE MATCHES */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Activity className="text-red-500 animate-pulse" size={20}/> {t.liveMatches}
            </h3>
            <div className="overflow-x-auto">
                {activeMatches.length > 0 ? (
                    <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                        <tr>
                        <th className="px-4 py-3">Round</th>
                        <th className="px-4 py-3">Players</th>
                        <th className="px-4 py-3">Score</th>
                        <th className="px-4 py-3">Court</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {activeMatches.map(m => {
                            const p1Games = m.scores.filter(s => s.p1 > s.p2).length;
                            const p2Games = m.scores.filter(s => s.p2 > s.p1).length;
                            return (
                                <tr key={m.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-900">{m.roundName}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col">
                                        <span className="font-bold text-slate-900">{m.player1?.name || 'P1'} {m.partner1Name ? `& ${m.partner1Name}` : ''}</span>
                                        <span className="text-slate-500">{m.player2?.name || 'P2'} {m.partner2Name ? `& ${m.partner2Name}` : ''}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-700 font-mono text-lg font-bold">
                                        {p1Games} - {p2Games}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 flex items-center gap-1">
                                        <MapPin size={14}/> {m.court || 'Center'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    </table>
                ) : (
                    <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        <Clock size={32} className="mx-auto mb-2 opacity-50"/>
                        <p>No matches currently live.</p>
                    </div>
                )}
            </div>
            </div>

            {/* COURT STATUS WIDGET */}
            <CourtStatusWidget matches={matches} />
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col h-[400px]">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><TrendingUp size={18}/> {t.activity}</h3>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                     {activityFeed.length === 0 ? (
                         <p className="text-slate-400 text-center mt-10 text-sm">No recent activity.</p>
                     ) : (
                         activityFeed.map((act, i) => (
                             <div key={i} className="flex gap-3">
                                 <div className={`${act.bg} p-2 rounded-full h-fit ${act.color} flex-shrink-0`}>
                                     <act.icon size={16}/>
                                 </div>
                                 <div>
                                     <p className="text-sm font-bold text-slate-800">{act.title}</p>
                                     <p className="text-xs text-slate-500">{act.desc}</p>
                                     <p className="text-[10px] text-slate-400 mt-1">{act.time}</p>
                                 </div>
                             </div>
                         ))
                     )}
                </div>
            </div>

            {permissions.canManageSystem && (
                <div className="bg-red-50 rounded-xl shadow-sm border border-red-100 p-6">
                    <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
                        <ShieldAlert size={20}/> {t.systemMgmt}
                    </h3>
                    <p className="text-xs text-red-700 mb-4">{t.resetDesc}</p>
                    <button 
                        onClick={resetSystem}
                        className="w-full flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-600 hover:text-white transition-colors"
                    >
                        <Trash2 size={16}/> {t.resetData}
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
    