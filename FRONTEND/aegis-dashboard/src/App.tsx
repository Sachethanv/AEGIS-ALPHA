import { useState, useEffect, useRef } from 'react';
import { TopBar } from './components/layout/TopBar';
import { StatusSummary } from './components/dashboard/StatusSummary';
import { AlertBanner } from './components/dashboard/AlertBanner';
import { SoldierGrid } from './components/dashboard/SoldierGrid';
import { SmsToast } from './components/dashboard/SmsToast';
import { MapModal } from './components/map/MapModal';
import { TacticalNet } from './components/dashboard/TacticalNet';
import { ARVision } from './components/dashboard/ARVision';
import { useSoldierSimulation } from './hooks/useSoldierSimulation';
import { getNearestSoldiers } from './utils/geoUtils';
import { evaluateTriage } from './utils/triageRules';
import { sendTwilioAlert } from './utils/sendAlert';
import type { Soldier } from './data/soldiers';

export interface TacticalMessage {
  id: string;
  timestamp: string;
  casualty: Soldier;
  recipients: Soldier[];
  condition: string;
  criticality: string;
  timeToTreat: string;
  confidence: number;
  action: string;
  smsSent?: boolean;
  smsError?: string;
}

// How many stationary ticks (× 700ms) before alert fires
const STATIONARY_THRESHOLD = 4; // ~2.8s — fast enough to see in demo

export default function App() {
  const { soldiers, movementRef } = useSoldierSimulation();
  const [mapSoldier, setMapSoldier] = useState<Soldier | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'tactical_net' | 'ar_vision'>('dashboard');
  const [tacticalMessages, setTacticalMessages] = useState<TacticalMessage[]>([]);
  const [activeToast, setActiveToast] = useState<TacticalMessage | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // IDs currently being processed — prevents duplicate fires
  const processingIds = useRef<Set<string>>(new Set());
  // IDs already alerted — cleared when soldier recovers
  const alertedIds = useRef<Set<string>>(new Set());
  // Previous status per soldier
  const prevStatusRef = useRef<Record<string, string>>({});

  const woundedSoldiers = soldiers.filter(s => s.status === 'WOUNDED');

  // ── Auto-SMS trigger logic ────────────────────────────────────────────────
  useEffect(() => {
    soldiers.forEach(soldier => {
      const isCasualty = soldier.status === 'WOUNDED' || soldier.status === 'CRITICAL';
      const prevStatus = prevStatusRef.current[soldier.id];
      const wasAlreadyAbnormal = prevStatus === 'WOUNDED' || prevStatus === 'CRITICAL';
      const stationaryTicks = movementRef.current[soldier.id]?.stationaryTicks ?? 0;
      const isStationary = stationaryTicks >= STATIONARY_THRESHOLD;

      if (
        isCasualty &&
        isStationary &&
        !alertedIds.current.has(soldier.id) &&
        !processingIds.current.has(soldier.id)
      ) {
        // Lock to prevent re-entry
        processingIds.current.add(soldier.id);
        alertedIds.current.add(soldier.id);

        const nearest = getNearestSoldiers(soldier.id, soldiers, 2);
        const snapCasualty = { ...soldier };

        // Run Rule-based triage + send SMS
        const result = evaluateTriage(soldier.bpm, soldier.spo2);
        
        const msg: TacticalMessage = {
          id: `${soldier.id}-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-GB', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          }),
          casualty: snapCasualty,
          recipients: nearest,
          condition: result.condition,
          criticality: result.criticality,
          timeToTreat: result.timeToTreat,
          confidence: result.confidence,
          action: result.action,
        };

        // Fire the real Twilio SMS
        sendTwilioAlert({
          casualty: snapCasualty,
          recipients: nearest,
          condition: result.condition,
          criticality: result.criticality,
          timeToTreat: result.timeToTreat,
          action: result.action,
        }).then(smsResult => {
          msg.smsSent = smsResult.success;
          msg.smsError = smsResult.error;
          
          setTacticalMessages(prev => [...prev, msg]);
          setActiveToast(msg);
          setUnreadCount(prev => (activeView === 'tactical_net' || activeView === 'ar_vision') ? prev : prev + 1);
        }).finally(() => {
          processingIds.current.delete(soldier.id);
        });
      }

      // Recover: clear alert lock when soldier goes back to normal
      if (!isCasualty && wasAlreadyAbnormal) {
        alertedIds.current.delete(soldier.id);
      }

      prevStatusRef.current[soldier.id] = soldier.status;
    });
  }, [soldiers, activeView]);

  const handleViewChange = (v: 'dashboard' | 'tactical_net' | 'ar_vision') => {
    setActiveView(v);
    if (v === 'tactical_net' || v === 'ar_vision') setUnreadCount(0);
  };

  return (
    <div className="dashboard-root min-h-screen bg-[var(--bg-base)]">
      <div className="bg-overlay" />
      <div className="bg-scanlines" />

      <div className="dashboard-content flex flex-col min-h-screen">
        <TopBar
          activeView={activeView}
          onViewChange={handleViewChange}
          unreadCount={unreadCount}
        />

        <main className="flex-1 overflow-y-auto">
          {activeView === 'dashboard' ? (
            <div className="pt-16">
              <AlertBanner
                woundedSoldiers={woundedSoldiers}
                allSoldiers={soldiers}
                onShowMap={setMapSoldier}
                onSendSms={() => {}}
              />
              <StatusSummary soldiers={soldiers} />
              <SoldierGrid soldiers={soldiers} onShowMap={setMapSoldier} />
            </div>
          ) : activeView === 'tactical_net' ? (
            <TacticalNet messages={tacticalMessages} />
          ) : (
            <ARVision />
          )}
        </main>
      </div>

      <MapModal
        soldier={mapSoldier}
        allSoldiers={soldiers}
        onClose={() => setMapSoldier(null)}
      />

      {activeToast && (
        <SmsToast
          message={activeToast}
          onClose={() => setActiveToast(null)}
        />
      )}
    </div>
  );
}
