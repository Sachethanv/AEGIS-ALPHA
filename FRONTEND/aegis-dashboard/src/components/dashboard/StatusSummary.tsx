import type { Soldier } from '../../data/soldiers';

export function StatusSummary({ soldiers }: { soldiers: Soldier[] }) {
  const counts = {
    total:    soldiers.length,
    nominal:  soldiers.filter(s => s.status === 'NOMINAL').length,
    elevated: soldiers.filter(s => s.status === 'ELEVATED' || s.status === 'CRITICAL').length,
    wounded:  soldiers.filter(s => s.status === 'WOUNDED').length,
  };

  const cards = [
    { label: 'TOTAL ACTIVE',    value: counts.total,    color: 'var(--accent-blue)' },
    { label: 'NOMINAL',         value: counts.nominal,  color: 'var(--accent-green)' },
    { label: 'ELEVATED / CRIT', value: counts.elevated, color: 'var(--warn-yellow)' },
    { label: 'WOUNDED',         value: counts.wounded,  color: 'var(--critical-red)',
      pulse: counts.wounded > 0 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-4">
      {cards.map(card => (
        <div key={card.label} 
          className="bg-[var(--bg-panel)] rounded p-4 backdrop-blur-sm transition-all duration-300"
          style={{
            border: `1px solid ${card.pulse ? 'var(--critical-red)' : 'var(--bg-border)'}`,
            animation: card.pulse ? 'border-pulse 1s ease-in-out infinite' : 'none',
          }}
        >
          <div className="text-[0.6rem] text-[var(--text-muted)] font-rajdhani tracking-[0.15em]">{card.label}</div>
          <div className="text-4xl font-mono leading-tight" 
            style={{ 
              color: card.color,
              textShadow: `0 0 12px ${card.color}44` 
            }}
          >
            {String(card.value).padStart(2, '0')}
          </div>
        </div>
      ))}
    </div>
  );
}
