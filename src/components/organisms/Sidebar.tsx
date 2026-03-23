import React from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SidebarProps {
  appName?: string;
  userName?: string;
  userRole?: string;
  userInitials?: string;
  items: NavItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  onLogout: () => void;
  brandGradient?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  appName = 'SIMABOY',
  userName,
  userRole,
  userInitials,
  items,
  activeTab,
  onTabChange,
  onLogout,
  brandGradient = 'from-indigo-600 to-purple-600',
}) => {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl z-20 hidden md:flex">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-8 border-b border-slate-800 bg-slate-950/50">
        <h1 className={`text-2xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r ${brandGradient}`}>
          {appName}
        </h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-4">Menu Utama</p>
        {items.filter(item => item.id !== 'logout').map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 relative overflow-hidden group
                ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}
              `}
            >
              {isActive && <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>}
              <span className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} transition-colors`}>
                {tab.icon}
              </span>
              <span className="font-semibold tracking-wide text-sm">{tab.label}</span>
              {tab.badge ? (
                <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">{tab.badge}</span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Footer / User Info */}
      <div className="p-4 border-t border-slate-800 mt-auto bg-slate-950/30">
        {userName && (
          <div className="flex items-center gap-3 px-4 mb-5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${brandGradient} flex items-center justify-center text-white font-bold shadow-md`}>
              {userInitials || userName.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{userName}</p>
              <p className="text-xs text-slate-500 truncate font-mono uppercase tracking-wider mt-0.5">{userRole}</p>
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          className="w-full bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 group border border-transparent hover:border-rose-400"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
          Akhiri Sesi
        </button>
      </div>
    </aside>
  );
};
