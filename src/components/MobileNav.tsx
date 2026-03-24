import React, { useState, useEffect, useRef } from 'react';

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
  /** How many non-logout items to pin in the bottom bar. Default: 3 */
  pinCount?: number;
}

const MobileNav: React.FC<MobileNavProps> = ({
  items,
  activeTab,
  onTabChange,
  pinCount = 3,
}) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Separate logout — it always lives in the sheet
  const logoutItem = items.find((i) => i.id === 'logout');
  const navItems = items.filter((i) => i.id !== 'logout');

  // Pin first 3, rest go to overflow sheet
  const pinned = navItems.slice(0, pinCount);
  const overflow = navItems.slice(pinCount);

  // Is the current active tab inside the overflow list?
  const overflowIsActive = overflow.some((i) => i.id === activeTab);

  // Close sheet on Escape
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSheetOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sheetOpen]);

  const handleTabChange = (id: string) => {
    setSheetOpen(false);
    onTabChange(id);
  };

  // ─── Pinned tab button ───
  const PinnedTab = ({ item }: { item: MobileNavItem }) => {
    const isActive = activeTab === item.id;
    return (
      <button
        onClick={() => handleTabChange(item.id)}
        aria-label={item.label}
        className="relative flex flex-col items-center justify-center flex-1 py-2 px-1 min-w-0 transition-all duration-200"
      >
        {/* Active top-line indicator */}
        <span
          className={`absolute top-0 inset-x-2 h-0.5 rounded-full transition-all duration-300 ${
            isActive ? 'opacity-100' : 'opacity-0'
          }`}
          style={isActive ? { background: 'linear-gradient(90deg, #0d9488, #10b981)' } : {}}
        />

        {/* Icon */}
        <span
          className={`relative flex items-center justify-center w-9 h-8 rounded-xl transition-all duration-200 ${
            isActive ? 'text-teal-600' : 'text-slate-400'
          }`}
          style={isActive ? {
            filter: 'drop-shadow(0 0 8px rgba(13,148,136,0.35))',
            transform: 'translateY(-1px)',
          } : {}}
        >
          {item.icon}
          {item.badge ? (
            <span className="absolute -top-1 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white shadow-sm">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          ) : null}
        </span>

        {/* Label */}
        <span
          className={`text-[10px] font-bold tracking-tight leading-none mt-1 truncate max-w-full px-0.5 transition-colors duration-200 ${
            isActive ? 'text-teal-600' : 'text-slate-400'
          }`}
        >
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <>
      {/* ══════ BOTTOM BAR — always: 3 pinned + 1 More button ══════ */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div
          className="mx-3 mb-3 rounded-2xl flex items-stretch"
          style={{
            background: 'rgba(255,255,255,0.94)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow:
              '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
          }}
        >
          {/* 3 pinned tabs */}
          <div className="flex flex-1 items-center">
            {pinned.map((item) => (
              <PinnedTab key={item.id} item={item} />
            ))}
          </div>

          {/* Divider */}
          <div className="w-px my-3 bg-slate-100 shrink-0" />

          {/* "More" button — always visible */}
          <button
            onClick={() => setSheetOpen((o) => !o)}
            aria-label="Menu lainnya"
            className="relative flex flex-col items-center justify-center px-4 py-2 min-w-[64px] shrink-0 transition-all duration-200"
          >
            {overflowIsActive && !sheetOpen && (
              <span
                className="absolute top-0 inset-x-2 h-0.5 rounded-full"
                style={{ background: 'linear-gradient(90deg, #0d9488, #10b981)' }}
              />
            )}
            <span
              className={`flex items-center justify-center w-9 h-8 rounded-xl transition-all duration-200 ${
                sheetOpen || overflowIsActive
                  ? 'text-teal-600 bg-teal-50'
                  : 'text-slate-400'
              }`}
            >
              <svg
                className={`w-5 h-5 transition-transform duration-200 ${sheetOpen ? 'rotate-45' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {sheetOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h.01M12 12h.01M19 12h.01" />
                }
              </svg>
            </span>
            <span
              className={`text-[10px] font-bold tracking-tight mt-1 leading-none transition-colors ${
                sheetOpen || overflowIsActive ? 'text-teal-600' : 'text-slate-400'
              }`}
            >
              {sheetOpen ? 'Tutup' : 'Lainnya'}
            </span>
          </button>
        </div>
      </nav>

      {/* ══════ BOTTOM SHEET ══════ */}
      <>
        {/* Backdrop */}
        <div
          className={`md:hidden fixed inset-0 z-40 transition-all duration-300 ${
            sheetOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          style={{
            background: 'rgba(15,23,42,0.40)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
          }}
          onClick={() => setSheetOpen(false)}
        />

        {/* Sheet panel */}
        <div
          ref={sheetRef}
          className={`md:hidden fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-out ${
            sheetOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div
            className="rounded-t-3xl"
            style={{
              background: 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-9 h-1 rounded-full bg-slate-200" />
            </div>

            {/* Sheet header */}
            <div className="px-5 py-2.5 flex items-center gap-2 border-b border-slate-100">
              <div className="w-2 h-2 rounded-full bg-teal-500" />
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Menu</p>
            </div>

            {/* Overflow nav items (if any) */}
            {overflow.length > 0 && (
              <div className="grid grid-cols-2 gap-2.5 p-4 pb-2">
                {overflow.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`
                        relative flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-200 text-left active:scale-95
                        ${isActive
                          ? 'bg-teal-50 border-teal-200 shadow-sm'
                          : 'bg-slate-50 border-slate-100 hover:bg-slate-100 hover:border-slate-200'
                        }
                      `}
                    >
                      <span className={`shrink-0 transition-colors ${isActive ? 'text-teal-600' : 'text-slate-500'}`}>
                        {item.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-bold leading-tight block truncate ${isActive ? 'text-teal-700' : 'text-slate-700'}`}>
                          {item.label}
                        </span>
                      </div>
                      {item.badge ? (
                        <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      ) : null}
                      {isActive && (
                        <svg className="w-4 h-4 text-teal-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <circle cx="10" cy="10" r="4" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Logout — always in sheet */}
            {logoutItem && (
              <div className={`px-4 pb-5 ${overflow.length > 0 ? 'pt-2' : 'pt-4'}`}>
                <button
                  onClick={() => handleTabChange('logout')}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-gradient-to-r from-rose-50 to-red-50 border border-rose-100 text-rose-500 hover:from-rose-100 hover:to-red-100 active:scale-[0.98] transition-all duration-200"
                >
                  {logoutItem.icon}
                  <span className="text-sm font-bold">Akhiri Sesi</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </>
    </>
  );
};

export default MobileNav;
