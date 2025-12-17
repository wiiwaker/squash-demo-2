
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Trophy, 
  Users, 
  Timer, 
  Menu, 
  X, 
  BarChart3,
  Database,
  Globe,
  User as UserIcon,
  ChevronUp,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { Language, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, language, setLanguage }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, login, role } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const t = {
    title: language === 'CN' ? '壁球赛事管理系统' : 'ProSquash Manager',
    dashboard: language === 'CN' ? '仪表盘' : 'Dashboard',
    tournaments: language === 'CN' ? '赛事编排' : 'Tournaments',
    scoring: language === 'CN' ? '计时记分' : 'Scoring Console',
    rankings: language === 'CN' ? '积分排名' : 'Rankings',
    members: language === 'CN' ? '会员与俱乐部' : 'Members & Clubs',
    repository: language === 'CN' ? '资料库' : 'Repository',
  };

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'tournaments', label: t.tournaments, icon: Trophy },
    { id: 'scoring', label: t.scoring, icon: Timer },
    { id: 'rankings', label: t.rankings, icon: BarChart3 },
    { id: 'members', label: t.members, icon: Users },
    { id: 'repository', label: t.repository, icon: Database },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar - Hidden on Print */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0 print:hidden flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/50">
                S
              </div>
              <span className="font-bold text-lg tracking-tight">{t.title}</span>
            </div>
            <button className="md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                    ${activeTab === item.id 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 scale-105' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                >
                  <Icon size={20} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800 space-y-4">
            <button 
              onClick={() => setLanguage(language === 'CN' ? 'EN' : 'CN')}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-slate-800 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors border border-slate-700 hover:border-slate-600"
            >
              <Globe size={14} />
              {language === 'CN' ? 'Switch to English' : '切换中文'}
            </button>

            {/* User Role Switcher */}
            <div className="relative">
                <button 
                    onClick={() => setShowRoleMenu(!showRoleMenu)}
                    className="flex items-center gap-3 w-full px-3 py-2 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors text-left border border-slate-700/50"
                >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                        {user?.username.charAt(0) || 'G'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{user?.username || 'Guest'}</div>
                        <div className="text-xs text-slate-500 truncate capitalize">{role.replace('_', ' ').toLowerCase()}</div>
                    </div>
                    {showRoleMenu ? <ChevronDown size={14} className="text-slate-500"/> : <ChevronUp size={14} className="text-slate-500"/>}
                </button>

                {showRoleMenu && (
                    <div className="absolute bottom-full left-0 w-full mb-2 bg-slate-800 rounded-lg border border-slate-700 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                        <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Switch Role</div>
                        {[UserRole.SUPER_ADMIN, UserRole.REFEREE, UserRole.PLAYER].map((r) => (
                            <button 
                                key={r} 
                                onClick={() => { login(r); setShowRoleMenu(false); }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 flex items-center gap-2 ${role === r ? 'text-blue-400 bg-slate-700/50' : 'text-slate-300'}`}
                            >
                                <div className={`w-2 h-2 rounded-full ${role === r ? 'bg-blue-400' : 'bg-transparent'}`}></div>
                                {r.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                )}
            </div>
          </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 md:hidden print:hidden">
          <span className="font-bold text-lg">{navItems.find(i => i.id === activeTab)?.label}</span>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600">
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 overflow-auto relative scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
