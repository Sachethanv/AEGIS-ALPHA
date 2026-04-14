import type { Soldier } from '../../data/soldiers';
import { SoldierMap } from './SoldierMap';

interface Props {
  soldier: Soldier | null;
  allSoldiers: Soldier[];
  onClose: () => void;
}

export function MapModal({ soldier, allSoldiers, onClose }: Props) {
  if (!soldier) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[1000] bg-[rgba(2,8,12,0.92)] backdrop-blur-sm flex items-center justify-center p-4 md:p-10"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-5xl h-[80vh] bg-[var(--bg-panel)] border border-[var(--bg-border)] rounded-lg overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Modal header */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-[var(--bg-border)] bg-[rgba(4,14,20,0.95)]">
          <div>
            <span className="font-rajdhani font-bold text-[var(--accent-green)] text-lg tracking-widest uppercase">
              GPS TRACKING — {soldier.rank} {soldier.name}
            </span>
            <span className="hidden sm:inline ml-4 font-mono text-[0.65rem] text-[var(--text-secondary)]">
              UID: {soldier.id} · COORDS: {soldier.lat.toFixed(4)}°N {soldier.lng.toFixed(4)}°E
            </span>
          </div>
          <button
            onClick={onClose}
            className="bg-transparent border border-[var(--bg-border)] text-[var(--text-secondary)] cursor-pointer font-rajdhani text-[0.75rem] px-3 py-1 rounded tracking-[0.1em] hover:bg-[var(--accent-green-dim)] hover:text-[var(--accent-green)] transition-all"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <SoldierMap
            focusSoldier={soldier}
            allSoldiers={allSoldiers}
          />
        </div>
      </div>
    </div>
  );
}
