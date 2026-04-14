import { useEffect, useState } from 'react';

export function TopBar() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (s: number) => {
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  return (
    <header className="flex items-center justify-between px-6 py-2 bg-[rgba(4,14,20,0.9)] border-b border-[var(--bg-border)] backdrop-blur-md relative z-10">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <span className="text-2xl font-rajdhani font-bold text-[var(--accent-green)] tracking-widest">
          AEGIS
        </span>
        <span className="hidden md:inline text-[0.7rem] text-[var(--text-muted)] font-mono tracking-widest">
          AI-ENHANCED GUARDIAN INTERFACE SYSTEM
        </span>
      </div>

      {/* Mission Clock */}
      <div className="text-center">
        <div className="text-[0.6rem] text-[var(--text-secondary)] tracking-widest font-rajdhani">MISSION ELAPSED</div>
        <div className="text-2xl font-mono text-[var(--accent-green)]">{fmt(elapsed)}</div>
      </div>

      {/* Status Indicators */}
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
