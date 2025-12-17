
import React, { useState } from 'react';
import { Users, Building2, UserPlus, CheckCircle, XCircle, Search, X, Calendar, ClipboardList, Plus, BadgeCheck, Gavel, BarChart2, Filter, Wand2, Clock, MapPin, MoreHorizontal, LayoutGrid, List as ListIcon, GraduationCap, UploadCloud, FileText, Trash2 } from 'lucide-react';
import { Language, Player, Club, Official } from '../types';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface Props {
  language: Language;
}

// Club Stats Modal
const ClubStatsModal: React.FC<{ clubName: string, players: Player[], onClose: () => void }> = ({ clubName, players, onClose }) => {
    const clubMembers = players.filter(p => p.club === clubName);
    
    // Stats Logic
    const totalPoints = clubMembers.reduce((sum, p) => sum + p.points, 0);
    const avgPoints = clubMembers.length > 0 ? Math.round(totalPoints / clubMembers.length) : 0;
    
    // Points Range Data
    const rangeData = [
        { range: '0-500', count: clubMembers.filter(p => p.points <= 500).length },
        { range: '501-1000', count: clubMembers.filter(p => p.points > 500 && p.points <= 1000).length },
        { range: '1000+', count: clubMembers.filter(p => p.points > 1000).length },
    ];

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Building2 className="text-blue-600"/> {clubName} Analytics</h2>
                        <p className="text-sm text-slate-500">{clubMembers.length} Registered Members</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X size={20}/></button>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                            <div className="text-xs text-blue-600 font-bold uppercase">Total Points</div>
                            <div className="text-2xl font-black text-blue-900">{totalPoints}</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg text-center">
                            <div className="text-xs text-purple-600 font-bold uppercase">Average Score</div>
                            <div className="text-2xl font-black text-purple-900">{avgPoints}</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                            <div className="text-xs text-green-600 font-bold uppercase">Top Player</div>
                            <div className="text-lg font-bold text-green-900 truncate">{clubMembers.sort((a,b) => b.points - a.points)[0]?.name || '-'}</div>
                        </div>
                    </div>

                    <div className="h-64 w-full bg-white border border-slate-100 rounded-xl p-4">
                        <h3 className="text-sm font-bold text-slate-500 mb-4">Points Distribution</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={rangeData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="range" tick={{fontSize: 12}} />
                                <YAxis allowDecimals={false} />
                                <Tooltip cursor={{fill: '#f1f5f9'}} />
                                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

const MembersPage: React.FC<Props> = ({ language }) => {
  const { players, setPlayers, clubs, addClub, officials, addOfficial } = useData();
  const { permissions } = useAuth();

  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'CLUBS' | 'COURSES' | 'BOOKINGS' | 'OFFICIALS'>('MEMBERS');
  const [memberFilter, setMemberFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const [viewMode, setViewMode] = useState<'LIST' | 'CARD'>('LIST');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showOfficialModal, setShowOfficialModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedClubForStats, setSelectedClubForStats] = useState<string | null>(null);
  
  const [newMember, setNewMember] = useState({ name: '', gender: 'M', club: '' });
  const [newCourse, setNewCourse] = useState({ name: '', coach: '', time: '', max: 10 });
  const [newOfficial, setNewOfficial] = useState({ name: '', level: 'National Level 1' });
  const [newClub, setNewClub] = useState({ name: '', location: '', manager: '' });
  const [showClubModal, setShowClubModal] = useState(false);
  const [importText, setImportText] = useState('');

  const t = {
    members: language === 'CN' ? '运动员管理' : 'Athlete Management',
    clubs: language === 'CN' ? '俱乐部管理' : 'Club Management',
    courses: language === 'CN' ? '课程与考勤' : 'Courses & Attendance',
    bookings: language === 'CN' ? '场地预定' : 'Court Bookings',
    officials: language === 'CN' ? '技术官员' : 'Officials',
    register: language === 'CN' ? '注册新会员' : 'Register New Member',
    addClub: language === 'CN' ? '添加俱乐部' : 'Add Club',
    addCourse: language === 'CN' ? '发布课程' : 'Add Course',
    addOfficial: language === 'CN' ? '添加裁判' : 'Add Official',
    approve: language === 'CN' ? '审核通过' : 'Approve',
    reject: language === 'CN' ? '驳回' : 'Reject',
    status: language === 'CN' ? '状态' : 'Status',
    pending: language === 'CN' ? '待审核' : 'Pending',
    approved: language === 'CN' ? '已认证' : 'Approved',
    all: language === 'CN' ? '全部' : 'All',
    name: language === 'CN' ? '姓名' : 'Name',
    club: language === 'CN' ? '所属俱乐部' : 'Club',
    level: language === 'CN' ? '级别' : 'Level',
    save: language === 'CN' ? '保存' : 'Save',
    cancel: language === 'CN' ? '取消' : 'Cancel',
    generateDemo: language === 'CN' ? '生成演示数据' : 'Generate Demo',
    import: language === 'CN' ? '批量导入' : 'Bulk Import',
  };

  const [courses, setCourses] = useState([
      { id: 1, name: 'Junior Squash Basic Level 1', coach: 'Alex Chen', time: 'Mon/Wed 18:00', students: 12, max: 20, description: 'Introduction to grip, swing, and basic movement.' },
      { id: 2, name: 'Elite Performance Training', coach: 'Sarah Wu', time: 'Sat 10:00', students: 8, max: 10, description: 'High intensity drills for ranked juniors.' },
      { id: 3, name: 'Adult Fitness Squash', coach: 'Mike Ross', time: 'Tue/Thu 19:00', students: 15, max: 16, description: 'Cardio focused group session.' },
  ]);

  type BookingType = 'MEMBER' | 'EVENT' | 'MAINTENANCE' | 'COACHING';
  interface BookingSlot {
      id: string;
      type: BookingType;
      title: string;
      user?: string;
  }
  
  const [bookings, setBookings] = useState<Record<string, BookingSlot>>({
      '09:00-1': { id: 'b1', type: 'MEMBER', title: 'Private Practice', user: 'James W.' },
      '10:00-2': { id: 'b2', type: 'EVENT', title: 'Tournament Match', user: 'System' },
      '11:00-3': { id: 'b3', type: 'MAINTENANCE', title: 'Floor Repair', user: 'Staff' },
      '18:00-1': { id: 'b4', type: 'COACHING', title: 'Junior Squad', user: 'Coach Alex' },
  });

  const handleAddMember = () => {
    if (!newMember.name) return;
    const player: Player = {
        id: Date.now().toString(),
        name: newMember.name,
        gender: newMember.gender as 'M'|'F',
        club: newMember.club || 'Unattached',
        rank: 999,
        points: 0,
        status: 'PENDING'
    };
    setPlayers([...players, player]);
    setShowAddModal(false);
    setNewMember({ name: '', gender: 'M', club: '' });
  };

  const handleBulkImport = () => {
      if (!importText) return;
      const lines = importText.split('\n');
      const newPlayers: Player[] = [];
      lines.forEach((line, index) => {
          const parts = line.split(',').map(s => s.trim());
          if (parts.length >= 2) {
              newPlayers.push({
                  id: `IMPORT-${Date.now()}-${index}`,
                  name: parts[0],
                  gender: (parts[1].toUpperCase() === 'F' ? 'F' : 'M'),
                  club: parts[2] || 'Unattached',
                  rank: parseInt(parts[3]) || 999,
                  points: 0,
                  status: 'APPROVED'
              });
          }
      });
      if (newPlayers.length > 0) {
          setPlayers([...players, ...newPlayers]);
          setShowImportModal(false);
          setImportText('');
      }
  };

  const handleGenerateDemoPlayers = () => {
      const demoNames = [ "James Willstrop", "Nick Matthew", "Ramy Ashour", "Gregory Gaultier", "Amr Shabana", "Mohamed ElShorbagy", "Karim Darwish", "Peter Nicol" ];
      const newDemoPlayers: Player[] = demoNames.map((name, i) => ({
          id: `DEMO-${Date.now()}-${i}`,
          name: name,
          club: "PSA Legend",
          rank: i + 10,
          gender: 'M',
          status: 'APPROVED',
          points: 2000 - (i * 50)
      }));
      setPlayers([...players, ...newDemoPlayers]);
  };

  const updateMemberStatus = (id: string, status: 'APPROVED' | 'REJECTED') => {
      setPlayers(players.map(p => p.id === id ? { ...p, status } : p));
  };

  const handleBulkApprove = () => {
      if (selectedMemberIds.length === 0) return;
      setPlayers(players.map(p => selectedMemberIds.includes(p.id) ? { ...p, status: 'APPROVED' } : p));
      setSelectedMemberIds([]);
  };

  const handleBulkReject = () => {
      if (selectedMemberIds.length === 0) return;
      setPlayers(players.map(p => selectedMemberIds.includes(p.id) ? { ...p, status: 'REJECTED' } : p));
      setSelectedMemberIds([]);
  };

  const toggleMemberSelection = (id: string) => {
      setSelectedMemberIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleAddCourse = () => {
      if(!newCourse.name) return;
      setCourses([...courses, { id: Date.now(), name: newCourse.name, coach: newCourse.coach, time: newCourse.time, students: 0, max: newCourse.max, description: 'New course' }]);
      setShowCourseModal(false);
      setNewCourse({ name: '', coach: '', time: '', max: 10 });
  };

  const handleAddOfficial = () => {
      if(!newOfficial.name) return;
      addOfficial({ id: Date.now().toString(), name: newOfficial.name, level: newOfficial.level, status: 'ACTIVE' });
      setShowOfficialModal(false);
      setNewOfficial({ name: '', level: 'National Level 1' });
  };

  const handleAddClub = () => {
      if (!newClub.name) return;
      addClub({ id: Date.now().toString(), name: newClub.name, location: newClub.location, manager: newClub.manager });
      setShowClubModal(false);
      setNewClub({ name: '', location: '', manager: '' });
  }

  const toggleBooking = (key: string) => {
      if (!permissions.canManageClub) return; 
      setBookings(prev => {
          if (prev[key]) {
              const newState = { ...prev };
              delete newState[key];
              return newState;
          }
          return { ...prev, [key]: { id: Date.now().toString(), type: 'MEMBER', title: 'Reserved', user: 'Admin' } };
      });
  };

  const filteredMembers = players.filter(m => {
      const matchesFilter = memberFilter === 'ALL' || m.status === memberFilter;
      const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.club.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 relative">
       {selectedClubForStats && <ClubStatsModal clubName={selectedClubForStats} players={players} onClose={() => setSelectedClubForStats(null)} />}
       {showAddModal && (
           <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
               <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                   <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold">{t.register}</h3><button onClick={() => setShowAddModal(false)}><X /></button></div>
                   <div className="space-y-4">
                       <div><label className="block text-sm font-medium mb-1">{t.name}</label><input className="w-full border rounded p-2" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} /></div>
                       <div><label className="block text-sm font-medium mb-1">Gender</label><select className="w-full border rounded p-2" value={newMember.gender} onChange={e => setNewMember({...newMember, gender: e.target.value})}><option value="M">Male</option><option value="F">Female</option></select></div>
                       <div><label className="block text-sm font-medium mb-1">{t.club}</label><input className="w-full border rounded p-2" value={newMember.club} onChange={e => setNewMember({...newMember, club: e.target.value})} /></div>
                       <button onClick={handleAddMember} className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">{t.save}</button>
                   </div>
               </div>
           </div>
       )}
       {showImportModal && (
           <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
               <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
                   <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold flex items-center gap-2"><UploadCloud size={20}/> {t.import}</h3><button onClick={() => setShowImportModal(false)}><X /></button></div>
                   <p className="text-sm text-slate-500 mb-4">Paste CSV data below. Format: <code className="bg-slate-100 px-1 rounded text-slate-700">Name, Gender, Club, Rank</code></p>
                   <textarea className="w-full border border-slate-300 rounded p-3 text-sm font-mono h-48 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="John Doe, M, Squash Club, 10&#10;Jane Smith, F, City Gym, 5" value={importText} onChange={(e) => setImportText(e.target.value)}/>
                   <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowImportModal(false)} className="px-4 py-2 border rounded text-sm font-medium hover:bg-slate-50">{t.cancel}</button><button onClick={handleBulkImport} className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700">{t.import}</button></div>
               </div>
           </div>
       )}
       {showClubModal && (
           <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
               <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                   <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold">{t.addClub}</h3><button onClick={() => setShowClubModal(false)}><X /></button></div>
                   <div className="space-y-4">
                       <div><label className="block text-sm font-medium mb-1">Name</label><input className="w-full border rounded p-2" value={newClub.name} onChange={e => setNewClub({...newClub, name: e.target.value})} /></div>
                       <div><label className="block text-sm font-medium mb-1">Location</label><input className="w-full border rounded p-2" value={newClub.location} onChange={e => setNewClub({...newClub, location: e.target.value})} /></div>
                       <div><label className="block text-sm font-medium mb-1">Manager</label><input className="w-full border rounded p-2" value={newClub.manager} onChange={e => setNewClub({...newClub, manager: e.target.value})} /></div>
                       <button onClick={handleAddClub} className="w-full bg-blue-600 text-white py-2 rounded font-bold">{t.save}</button>
                   </div>
               </div>
           </div>
       )}
       {showOfficialModal && (
           <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
               <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                   <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold">{t.addOfficial}</h3><button onClick={() => setShowOfficialModal(false)}><X /></button></div>
                   <div className="space-y-4">
                       <div><label className="block text-sm font-medium mb-1">{t.name}</label><input className="w-full border rounded p-2" value={newOfficial.name} onChange={e => setNewOfficial({...newOfficial, name: e.target.value})} /></div>
                       <div><label className="block text-sm font-medium mb-1">{t.level}</label><input className="w-full border rounded p-2" value={newOfficial.level} onChange={e => setNewOfficial({...newOfficial, level: e.target.value})} /></div>
                       <button onClick={handleAddOfficial} className="w-full bg-blue-600 text-white py-2 rounded font-bold">{t.save}</button>
                   </div>
               </div>
           </div>
       )}
       {showCourseModal && (
           <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
               <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                   <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold">{t.addCourse}</h3><button onClick={() => setShowCourseModal(false)}><X /></button></div>
                   <div className="space-y-4">
                       <div><label className="block text-sm font-medium mb-1">Course Name</label><input className="w-full border rounded p-2" value={newCourse.name} onChange={e => setNewCourse({...newCourse, name: e.target.value})} /></div>
                       <div><label className="block text-sm font-medium mb-1">Coach</label><input className="w-full border rounded p-2" value={newCourse.coach} onChange={e => setNewCourse({...newCourse, coach: e.target.value})} /></div>
                       <div><label className="block text-sm font-medium mb-1">Time</label><input className="w-full border rounded p-2" value={newCourse.time} onChange={e => setNewCourse({...newCourse, time: e.target.value})} placeholder="e.g. Mon 18:00" /></div>
                       <div><label className="block text-sm font-medium mb-1">Max Students</label><input type="number" className="w-full border rounded p-2" value={newCourse.max} onChange={e => setNewCourse({...newCourse, max: parseInt(e.target.value)})} /></div>
                       <button onClick={handleAddCourse} className="w-full bg-blue-600 text-white py-2 rounded font-bold">{t.save}</button>
                   </div>
               </div>
           </div>
       )}

       {/* Tabs Header */}
       <div className="flex justify-between items-center flex-wrap gap-4">
            <h2 className="text-2xl font-bold text-slate-900">{language === 'CN' ? '会员与俱乐部' : 'Members & Clubs'}</h2>
            <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm overflow-x-auto">
                {(['MEMBERS', 'CLUBS', 'OFFICIALS', 'COURSES', 'BOOKINGS'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>{t[tab.toLowerCase() as keyof typeof t] || tab}</button>
                ))}
            </div>
       </div>

       {/* MEMBERS TAB */}
       {activeTab === 'MEMBERS' && (
           <div className="space-y-4">
               <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                   <div className="flex items-center gap-2 w-full md:w-auto">
                       <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                       <div className="flex bg-slate-100 rounded-lg p-1">
                           <button onClick={() => setMemberFilter('ALL')} className={`px-3 py-1 text-xs rounded font-medium ${memberFilter === 'ALL' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>{t.all}</button>
                           <button onClick={() => setMemberFilter('PENDING')} className={`px-3 py-1 text-xs rounded font-medium ${memberFilter === 'PENDING' ? 'bg-white shadow-sm text-yellow-700' : 'text-slate-500'}`}>{t.pending}</button>
                           <button onClick={() => setMemberFilter('APPROVED')} className={`px-3 py-1 text-xs rounded font-medium ${memberFilter === 'APPROVED' ? 'bg-white shadow-sm text-green-700' : 'text-slate-500'}`}>{t.approved}</button>
                       </div>
                   </div>
                   <div className="flex gap-2">
                        <div className="bg-slate-100 rounded-lg p-1 flex">
                            <button onClick={() => setViewMode('LIST')} className={`p-1.5 rounded ${viewMode === 'LIST' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}><ListIcon size={16}/></button>
                            <button onClick={() => setViewMode('CARD')} className={`p-1.5 rounded ${viewMode === 'CARD' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}><LayoutGrid size={16}/></button>
                        </div>
                        {permissions.canManageClub && (<button onClick={handleGenerateDemoPlayers} className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-100 border border-indigo-200"><Wand2 size={16} /> {t.generateDemo}</button>)}
                        {permissions.canManageClub && (<button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"><UserPlus size={16} /> {t.register}</button>)}
                        {permissions.canManageClub && (<button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 border border-slate-200"><UploadCloud size={16} /> {t.import}</button>)}
                   </div>
               </div>
               
               {viewMode === 'LIST' ? (
                 <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-6 py-3 w-10">
                                    <input 
                                        type="checkbox" 
                                        onChange={(e) => setSelectedMemberIds(e.target.checked ? filteredMembers.map(m => m.id) : [])}
                                        checked={selectedMemberIds.length === filteredMembers.length && filteredMembers.length > 0}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                                <th className="px-6 py-3">{t.name}</th><th className="px-6 py-3">{t.club}</th><th className="px-6 py-3">Gender</th><th className="px-6 py-3">Points</th><th className="px-6 py-3">{t.status}</th><th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredMembers.map(m => (
                                <tr key={m.id} className={`hover:bg-slate-50 ${selectedMemberIds.includes(m.id) ? 'bg-blue-50/50' : ''}`}>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedMemberIds.includes(m.id)} 
                                            onChange={() => toggleMemberSelection(m.id)}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="px-6 py-4 font-medium flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${m.gender === 'M' ? 'bg-blue-400' : 'bg-pink-400'}`}>{m.name.charAt(0)}</div>{m.name}</td>
                                    <td className="px-6 py-4 text-slate-500">{m.club}</td>
                                    <td className="px-6 py-4 text-slate-500">{m.gender}</td>
                                    <td className="px-6 py-4 text-slate-500 font-mono">{m.points}</td>
                                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold ${m.status === 'APPROVED' ? 'bg-green-100 text-green-700' : m.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{m.status}</span></td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        {m.status === 'PENDING' && permissions.canVerify && (<><button onClick={() => updateMemberStatus(m.id, 'APPROVED')} className="p-1 text-green-600 hover:bg-green-50 rounded"><CheckCircle size={18}/></button><button onClick={() => updateMemberStatus(m.id, 'REJECTED')} className="p-1 text-red-600 hover:bg-red-50 rounded"><XCircle size={18}/></button></>)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     {filteredMembers.map(m => (
                         <div key={m.id} onClick={() => toggleMemberSelection(m.id)} className={`bg-white p-6 rounded-xl shadow-sm border ${selectedMemberIds.includes(m.id) ? 'border-blue-400 ring-1 ring-blue-400' : 'border-slate-100'} flex flex-col items-center text-center relative cursor-pointer`}>
                             <div className="absolute top-2 left-2"><input type="checkbox" checked={selectedMemberIds.includes(m.id)} onChange={() => toggleMemberSelection(m.id)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" /></div>
                             {m.status === 'PENDING' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-yellow-400"></div>}
                             <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 ${m.gender === 'M' ? 'bg-blue-500' : 'bg-pink-500'}`}>{m.name.charAt(0)}</div>
                             <h3 className="font-bold text-slate-900">{m.name}</h3>
                             <p className="text-sm text-slate-500 mb-1">{m.club}</p>
                             <div className="bg-slate-50 px-3 py-1 rounded-full text-xs font-mono font-bold text-slate-600 mb-4">{m.points} pts</div>
                             {m.status === 'PENDING' && permissions.canVerify && (<div className="flex gap-2 w-full mt-auto"><button onClick={(e) => {e.stopPropagation(); updateMemberStatus(m.id, 'APPROVED')}} className="flex-1 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded">Approve</button><button onClick={(e) => {e.stopPropagation(); updateMemberStatus(m.id, 'REJECTED')}} className="flex-1 py-1.5 bg-red-50 text-red-700 text-xs font-bold rounded">Reject</button></div>)}
                         </div>
                     ))}
                 </div>
               )}
               {/* Bulk Actions Bar */}
               {selectedMemberIds.length > 0 && permissions.canVerify && (
                   <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4 z-50">
                       <span className="text-sm font-bold">{selectedMemberIds.length} Selected</span>
                       <div className="h-6 w-px bg-slate-700"></div>
                       <button onClick={handleBulkApprove} className="flex items-center gap-2 text-sm font-bold hover:text-green-400"><CheckCircle size={16}/> Approve</button>
                       <button onClick={handleBulkReject} className="flex items-center gap-2 text-sm font-bold hover:text-red-400"><XCircle size={16}/> Reject</button>
                       <div className="h-6 w-px bg-slate-700"></div>
                       <button onClick={() => setSelectedMemberIds([])} className="text-sm hover:text-slate-300">Cancel</button>
                   </div>
               )}
           </div>
       )}

       {/* CLUBS TAB */}
       {activeTab === 'CLUBS' && (
           <div className="space-y-4">
               <div className="flex justify-end">
                   {permissions.canManageClub && <button onClick={() => setShowClubModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"><Building2 size={16} /> {t.addClub}</button>}
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {clubs.map(club => {
                       const membersCount = players.filter(p => p.club === club.name).length;
                       return (
                           <div key={club.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 relative hover:shadow-md transition-shadow group">
                               <div className="flex justify-between items-start mb-4">
                                   <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center"><Building2 size={24}/></div>
                                   <button onClick={() => setSelectedClubForStats(club.name)} className="text-slate-400 hover:text-blue-600"><BarChart2 size={20}/></button>
                               </div>
                               <h3 className="text-lg font-bold text-slate-900">{club.name}</h3>
                               <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><MapPin size={14}/> {club.location}</p>
                               <div className="mt-6 flex items-center justify-between text-sm">
                                   <div className="font-medium text-slate-700">Manager: {club.manager}</div>
                                   <div className="bg-slate-50 px-2 py-1 rounded text-slate-600 font-bold">{membersCount} Members</div>
                               </div>
                           </div>
                       )
                   })}
               </div>
           </div>
       )}

       {/* OFFICIALS TAB */}
       {activeTab === 'OFFICIALS' && (
           <div className="space-y-4">
               <div className="flex justify-end">
                   {permissions.canManageEvent && <button onClick={() => setShowOfficialModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"><BadgeCheck size={16} /> {t.addOfficial}</button>}
               </div>
               <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                   <table className="w-full text-left text-sm">
                       <thead className="bg-slate-50 text-slate-500 font-medium"><tr><th className="px-6 py-3">{t.name}</th><th className="px-6 py-3">{t.level}</th><th className="px-6 py-3">{t.status}</th></tr></thead>
                       <tbody className="divide-y divide-slate-100">
                           {officials.map(o => (
                               <tr key={o.id} className="hover:bg-slate-50">
                                   <td className="px-6 py-4 font-medium flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">{o.name.charAt(0)}</div>{o.name}</td>
                                   <td className="px-6 py-4 text-slate-500">{o.level}</td>
                                   <td className="px-6 py-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">{o.status}</span></td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
           </div>
       )}

       {/* COURSES TAB */}
       {activeTab === 'COURSES' && (
           <div className="space-y-6">
               {permissions.canManageClub && (
                   <div className="flex justify-end">
                        <button onClick={() => setShowCourseModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Plus size={16}/> {t.addCourse}</button>
                   </div>
               )}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {courses.map(course => (
                       <div key={course.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden group">
                           <div className="h-32 bg-slate-100 relative">
                               <div className="absolute inset-0 flex items-center justify-center text-slate-300"><GraduationCap size={48}/></div>
                               <div className="absolute top-4 right-4 bg-white/90 px-2 py-1 rounded text-xs font-bold shadow-sm">{course.students}/{course.max} Enrolled</div>
                           </div>
                           <div className="p-6">
                               <h3 className="font-bold text-lg text-slate-900 mb-1">{course.name}</h3>
                               <p className="text-sm text-slate-500 mb-4">{course.description}</p>
                               <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                                   <div className="flex items-center gap-1"><Clock size={14}/> {course.time}</div>
                                   <div className="flex items-center gap-1"><UserPlus size={14}/> {course.coach}</div>
                               </div>
                               <button className="w-full py-2 bg-slate-50 text-slate-700 rounded font-bold hover:bg-slate-100 transition-colors">View Roster</button>
                           </div>
                       </div>
                   ))}
               </div>
           </div>
       )}

       {/* BOOKINGS TAB */}
       {activeTab === 'BOOKINGS' && (
           <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 overflow-x-auto">
               <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Calendar size={20}/> Court Schedule (Today)</h3>
               <div className="min-w-[800px]">
                   <div className="grid grid-cols-5 gap-4 mb-4 border-b border-slate-100 pb-2">
                       <div className="w-20"></div>
                       {['Court 1', 'Court 2', 'Court 3', 'Center'].map(c => <div key={c} className="font-bold text-center text-slate-600">{c}</div>)}
                   </div>
                   {Array.from({length: 12}, (_, i) => 9 + i).map(hour => (
                       <div key={hour} className="grid grid-cols-5 gap-4 h-20 mb-2">
                           <div className="text-right text-sm text-slate-400 font-mono pt-2 w-20">{hour}:00</div>
                           {[1,2,3,4].map(courtIdx => {
                               const key = `${hour}:00-${courtIdx}`;
                               const booking = bookings[key];
                               return (
                                   <div 
                                       key={courtIdx} 
                                       onClick={() => toggleBooking(key)}
                                       className={`rounded-lg border p-2 text-xs cursor-pointer transition-all hover:shadow-md
                                       ${booking 
                                           ? booking.type === 'MEMBER' ? 'bg-blue-50 border-blue-200 text-blue-800' 
                                           : booking.type === 'EVENT' ? 'bg-purple-50 border-purple-200 text-purple-800' 
                                           : booking.type === 'COACHING' ? 'bg-green-50 border-green-200 text-green-800'
                                           : 'bg-slate-100 border-slate-200 text-slate-500'
                                           : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                                   >
                                       {booking ? (
                                           <>
                                               <div className="font-bold truncate">{booking.title}</div>
                                               <div className="truncate opacity-75">{booking.user}</div>
                                           </>
                                       ) : <span className="opacity-0 hover:opacity-100 text-slate-400 flex items-center justify-center h-full"><Plus size={16}/></span>}
                                   </div>
                               );
                           })}
                       </div>
                   ))}
               </div>
           </div>
       )}
    </div>
  );
};

export default MembersPage;
