import { useState, useEffect, useRef } from 'react';
import type { Soldier } from '../data/soldiers';
import { getBpmStatus, INITIAL_SOLDIERS } from '../data/soldiers';

// Simulates real-time BPM fluctuation for dummy soldiers
export function useSoldierSimulation() {
  const [soldiers, setSoldiers] = useState<Soldier[]>(INITIAL_SOLDIERS);
  const intervalRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setSoldiers(prev => prev.map(soldier => {
        if (soldier.isRealDevice) return soldier; // real data — don't simulate

        // Random BPM drift ±3 per tick, clamped
        const drift = (Math.random() - 0.5) * 6;
        const newBpm = Math.max(30, Math.min(180, Math.round(soldier.bpm + drift)));
        const newHistory = [...soldier.bpmHistory.slice(1), newBpm];
        const newStatus = getBpmStatus(newBpm);

        return {
          ...soldier,
          bpm: newBpm,
          bpmHistory: newHistory,
          status: newStatus,
          lastUpdated: `${Math.floor(Math.random() * 5) + 1}s ago`,
        };
      }));
    }, 1500); // update every 1.5s

    return () => clearInterval(intervalRef.current);
  }, []);

  return soldiers;
}
