import React from 'react';

export interface MobileNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface MobileNavProps {
  items: MobileNavItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ items, activeTab, onTabChange }) => {
  return (
    <div className="md:hidden fixed bottom-6 inset-x-4 z-50 animate-fade-in-up pb-[env(safe-area-inset-bottom)]">
      <div className="bg-white/90 backdrop-blur-3xl border border-white/40 shadow-2xl rounded-3xl flex justify-around items-center px-2 py-3">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="relative flex flex-col items-center justify-center w-16 h-12 transition-all duration-300"
            >
              <div 
                className={`
                  p-2 rounded-2xl transition-all duration-300 transform
                  ${isActive ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/30 scale-110 -translate-y-2' : 'text-slate-400 hover:text-teal-500 hover:bg-slate-50'}
                `}
              >
                {item.icon}
                {item.badge ? (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span 
                className={`
                  text-[10px] font-bold tracking-wide transition-all duration-300
                  ${isActive ? 'text-teal-600 translate-y-0 opacity-100' : 'text-transparent opacity-0 absolute bottom-0 translate-y-4'}
                `}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNav;
