import { useEffect, useState } from 'react';

export function TopBar() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-6 bg-[rgba(4,14,20,0.92)] border-b border-[var(--bg-border)] backdrop-blur-md z-[1000]">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <span className="text-2xl font-rajdhani font-bold text-[var(--accent-green)] tracking-widest">
          AEGIS
        </span>
        <span className="hidden md:inline text-[0.7rem] text-[var(--text-muted)] font-mono tracking-widest">
          AI-ENHANCED GUARDIAN INTERFACE SYSTEM
        </span>
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
