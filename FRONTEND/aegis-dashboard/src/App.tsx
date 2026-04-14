import { useState } from 'react';
import { TopBar } from './components/layout/TopBar';
import { StatusSummary } from './components/dashboard/StatusSummary';
import { AlertBanner } from './components/dashboard/AlertBanner';
import { SoldierGrid } from './components/dashboard/SoldierGrid';
import { MapModal } from './components/map/MapModal';
import { useSoldierSimulation } from './hooks/useSoldierSimulation';
import type { Soldier } from './data/soldiers';

export default function App() {
  const soldiers = useSoldierSimulation();
  const [mapSoldier, setMapSoldier] = useState<Soldier | null>(null);

  const woundedSoldiers = soldiers.filter(s => s.status === 'WOUNDED');

  return (
    <div className="dashboard-root min-h-screen bg-[var(--bg-base)]">
      {/* Background: AR soldier image overlay */}
      <div className="bg-overlay" />
      {/* Scanline effect */}
      <div className="bg-scanlines" />

      {/* All real content */}
      <div className="dashboard-content flex flex-col min-h-screen">
        <TopBar />

        <main className="flex-1 overflow-y-auto">
          {/* Critical alert banner — only when wounded soldiers exist */}
          <AlertBanner
            woundedSoldiers={woundedSoldiers}
            allSoldiers={soldiers}
            onShowMap={setMapSoldier}
          />

          <StatusSummary soldiers={soldiers} />

          <SoldierGrid
            soldiers={soldiers}
            onShowMap={setMapSoldier}
          />
        </main>
      </div>

      {/* Map modal — shown when GPS clicked */}
      <MapModal
        soldier={mapSoldier}
        allSoldiers={soldiers}
        onClose={() => setMapSoldier(null)}
      />
    </div>
  );
}
