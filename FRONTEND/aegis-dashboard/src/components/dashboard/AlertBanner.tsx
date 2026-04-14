import type { Soldier } from '../../data/soldiers';

interface Props {
  woundedSoldiers: Soldier[];
  allSoldiers: Soldier[];
  onShowMap: (s: Soldier) => void;
}

// Find geographically nearest soldier to a wounded one
function findNearest(wounded: Soldier, others: Soldier[]): Soldier | null {
  const candidates = others.filter(
    s => s.id !== wounded.id && s.status === 'NOMINAL'
  );
  if (!candidates.length) return null;

  return candidates.reduce((closest, s) => {
    const dCurrent = Math.hypot(s.lat - wounded.lat, s.lng - wounded.lng);
    const dClosest = Math.hypot(closest.lat - wounded.lat, closest.lng - wounded.lng);
    return dCurrent < dClosest ? s : closest;
  });
}

export function AlertBanner({ woundedSoldiers, allSoldiers, onShowMap }: Props) {
  if (!woundedSoldiers.length) return null;

  return (
    <div className="bg-[rgba(255,30,30,0.12)] border-y border-[var(--critical-red)] py-2 px-6 backdrop-blur-md mb-4">
      {woundedSoldiers.map(wounded => {
        const nearest = findNearest(wounded, allSoldiers);
        return (
          <div key={wounded.id} className="flex flex-wrap items-center gap-4 py-1">
            {/* Blinking alert */}
            <span className="font-mono text-[0.7rem] text-[var(--critical-red)] animate-[blink_0.5s_step-start_infinite] font-bold">
              ⚠ CRITICAL CASE:
            </span>

            {/* Wounded soldier info — clickable to show map */}
            <button
              onClick={() => onShowMap(wounded)}
              className="bg-transparent border-none cursor-pointer font-rajdhani text-sm font-bold text-white tracking-widest underline underline-offset-4 hover:text-[var(--critical-red)] transition-colors"
            >
              {wounded.rank} {wounded.name} ({wounded.id})
            </button>

            <span className="text-[var(--text-secondary)] text-[0.7rem] font-rajdhani">
              BPM: <span className="text-[var(--critical-red)] font-mono">{wounded.bpm}</span>
              &nbsp;· SpO₂: <span className="text-[var(--critical-red)] font-mono">{wounded.spo2}%</span>
            </span>

            {/* Nearest helper */}
            {nearest && (
              <span className="font-rajdhani text-[0.75rem] text-[var(--warn-yellow)] bg-[rgba(245,197,24,0.1)] border border-[var(--warn-yellow)] px-2 py-0.5 rounded">
                → NEAREST UNIT: {nearest.rank} {nearest.name} ({nearest.id})
              </span>
            )}

            {/* View on map */}
            <button
              onClick={() => onShowMap(wounded)}
              className="bg-[var(--critical-red)] border-none text-white font-rajdhani font-bold text-[0.65rem] tracking-widest px-3 py-1 rounded cursor-pointer ml-auto hover:grayscale-[0.2] transition-all"
            >
              LOCATE ◎
            </button>
          </div>
        );
      })}
    </div>
  );
}
