import { useState, useEffect, useRef } from 'react';
import type { Soldier } from '../data/soldiers';
import { getVitalsStatus, INITIAL_SOLDIERS } from '../data/soldiers';
import { useESP32Pulse } from './useESP32Pulse';

// Simulates real-time BPM fluctuation for dummy soldiers
export function useSoldierSimulation() {
  const [soldiers, setSoldiers] = useState<Soldier[]>(INITIAL_SOLDIERS);
  const intervalRef = useRef<number | undefined>(undefined);
  
  // Fetch real data from ESP32 for Sachethan
  const realBpm = useESP32Pulse(true);

  // Update Sachethan whenever realBpm changes from the hardware
  useEffect(() => {
    if (realBpm > 0) {
      setSoldiers(prev => prev.map(soldier => {
        if (soldier.isRealDevice) {
           const newHistory = [...soldier.bpmHistory.slice(1), realBpm];
           return {
             ...soldier,
             bpm: realBpm,
             bpmHistory: newHistory,
             status: getVitalsStatus(realBpm, soldier.spo2),
             lastUpdated: 'LIVE'
           };
        }
        return soldier;
      }));
    }
  }, [realBpm]);

  // Dummy device simulation
  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setSoldiers(prev => prev.map(soldier => {
        if (soldier.isRealDevice) return soldier; // real data — don't simulate

        // Random BPM drift ±3 per tick, clamped
        const drift = (Math.random() - 0.5) * 6;
        const newBpm = Math.max(30, Math.min(180, Math.round(soldier.bpm + drift)));
        const newHistory = [...soldier.bpmHistory.slice(1), newBpm];
        
        // Random SpO2 drift 
        let newSpo2 = soldier.spo2;
        if (Math.random() > 0.8) {
           newSpo2 = Math.max(80, Math.min(100, Math.round(soldier.spo2 + (Math.random() - 0.5) * 2)));
        }

        const newStatus = getVitalsStatus(newBpm, newSpo2);

        return {
          ...soldier,
          bpm: newBpm,
          bpmHistory: newHistory,
          spo2: newSpo2,
          status: newStatus,
          lastUpdated: `${Math.floor(Math.random() * 5) + 1}s ago`,
        };
      }));
    }, 1500); // update every 1.5s

    return () => clearInterval(intervalRef.current);
  }, []);

  return soldiers;
}
