export function TopBar({ activeView, onViewChange, unreadCount }: {
  activeView: 'dashboard' | 'tactical_net';
  onViewChange: (v: 'dashboard' | 'tactical_net') => void;
  unreadCount: number;
}) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-6 bg-[rgba(4,14,20,0.95)] border-b border-[var(--bg-border)] backdrop-blur-md z-[1000]">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <span className="text-2xl font-rajdhani font-bold text-[var(--accent-green)] tracking-widest">AEGIS</span>
        <span className="hidden md:inline text-[0.7rem] text-[var(--text-muted)] font-mono tracking-widest">
          AI-ENHANCED GUARDIAN INTERFACE SYSTEM
        </span>
      </div>

      {/* Nav tabs */}
      <div className="flex items-center gap-1 bg-[rgba(0,0,0,0.3)] border border-[var(--bg-border)] rounded-lg p-1">
        {(['dashboard', 'tactical_net'] as const).map(view => (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className="relative px-4 py-1.5 rounded-md text-[0.7rem] font-rajdhani font-bold tracking-[0.15em] uppercase transition-all duration-200"
            style={{
              background: activeView === view ? 'var(--accent-green-dim)' : 'transparent',
              color: activeView === view ? 'var(--accent-green)' : 'var(--text-muted)',
              border: activeView === view ? '1px solid var(--accent-green)' : '1px solid transparent',
            }}
          >
            {view === 'dashboard' ? '⬡ DASHBOARD' : '📡 TACTICAL NET'}
            {view === 'tactical_net' && unreadCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[0.5rem] font-bold"
                style={{ background: 'var(--critical-red)', color: '#fff' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Status indicators */}
      <div className="flex gap-5 items-center">
        {[
          { label: 'GPS LOCK', ok: true },
          { label: 'AI ENGINE', ok: true },
          { label: 'NETWORK', ok: true },
        ].map(({ label, ok }) => (
          <div key={label} className={`flex items-center gap-1.5 text-[0.65rem] font-rajdhani tracking-widest ${ok ? 'text-[var(--accent-green)]' : 'text-[var(--critical-red)]'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-[var(--accent-green)] shadow-[0_0_6px_var(--accent-green)]' : 'bg-[var(--critical-red)] shadow-[0_0_6px_var(--critical-red)]'} pulse-dot`} />
            <span className="hidden sm:inline">{label}</span>
          </div>
        ))}
      </div>
    </header>
  );
}
