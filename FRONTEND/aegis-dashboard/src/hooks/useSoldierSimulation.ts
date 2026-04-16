import { useState, useEffect, useRef } from 'react';
import type { Soldier } from '../data/soldiers';
import { getVitalsStatus, INITIAL_SOLDIERS } from '../data/soldiers';
import { useESP32Pulse } from './useESP32Pulse';

export interface MovementState {
  lat: number;
  lng: number;
  stationaryTicks: number;
}

export function useSoldierSimulation() {
  const [soldiers, setSoldiers] = useState<Soldier[]>(INITIAL_SOLDIERS);
  const intervalRef = useRef<number | undefined>(undefined);
  const movementRef = useRef<Record<string, MovementState>>({});

  // Init movement state from initial soldiers
  useEffect(() => {
    const init: Record<string, MovementState> = {};
    INITIAL_SOLDIERS.forEach(s => {
      init[s.id] = { lat: s.lat, lng: s.lng, stationaryTicks: 0 };
    });
    movementRef.current = init;
  }, []);

  // Real ESP32 device feed
  const realVitals = useESP32Pulse(true);
  useEffect(() => {
    setSoldiers(prev => prev.map(soldier => {
      if (!soldier.isRealDevice) return soldier;
      
      // If BPM evaluates to 0, it means the sensor is offline or below 2500 IR limit
      if (realVitals.bpm === 0) {
        return {
          ...soldier,
          bpm: 0,
          spo2: 0,
          status: 'NOMINAL', // Prevent it from throwing a false 'WOUNDED' due to hitting the < 45 BPM threshold
          lastUpdated: 'OFFLINE / NO PULSE',
        };
      }

      const newHistory = [...soldier.bpmHistory.slice(1), realVitals.bpm];
      return {
        ...soldier,
        bpm: realVitals.bpm,
        spo2: realVitals.spo2,
        bpmHistory: newHistory,
        status: getVitalsStatus(realVitals.bpm, realVitals.spo2),
        lastUpdated: 'LIVE',
      };
    }));
  }, [realVitals]);

  // Simulation loop — movementRef updated OUTSIDE the setSoldiers updater to avoid React Strict Mode double-call issues
  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setSoldiers(prev => {
        // --- Compute next state for all soldiers first ---
        const updates = prev.map(soldier => {
          if (soldier.isRealDevice) return null; // skip real device

          const drift = (Math.random() - 0.5) * 14; // ±7 BPM
          const newBpm = Math.max(30, Math.min(185, Math.round(soldier.bpm + drift)));
          const newHistory = [...soldier.bpmHistory.slice(1), newBpm];

          let newSpo2 = soldier.spo2;
          if (Math.random() > 0.55) {
            newSpo2 = Math.max(80, Math.min(100, Math.round(soldier.spo2 + (Math.random() - 0.5) * 3)));
          }

          const newStatus = getVitalsStatus(newBpm, newSpo2);
          const isCasualty = newStatus === 'WOUNDED' || newStatus === 'CRITICAL';

          // Position: stop moving if casualty
          let newLat = soldier.lat;
          let newLng = soldier.lng;
          if (!isCasualty) {
            newLat = soldier.lat + (Math.random() - 0.5) * 0.0005;
            newLng = soldier.lng + (Math.random() - 0.5) * 0.0005;
          }

          return {
            id: soldier.id,
            newLat, newLng,
            isCasualty,
            updated: {
              ...soldier,
              bpm: newBpm,
              bpmHistory: newHistory,
              spo2: newSpo2,
              status: newStatus,
              lat: newLat,
              lng: newLng,
              lastUpdated: `${Math.floor(Math.random() * 5) + 1}s ago`,
            } as Soldier,
          };
        });

        // --- Update movementRef OUTSIDE the updater return (side effect safe here since we're inside setInterval) ---
        // 1. Process simulated updates
        updates.forEach(u => {
          if (!u) return;
          const prevMove = movementRef.current[u.id] || { lat: u.newLat, lng: u.newLng, stationaryTicks: 0 };
          const displacement = Math.abs(u.newLat - prevMove.lat) + Math.abs(u.newLng - prevMove.lng);
          const moved = displacement > 0.00008;
          movementRef.current[u.id] = {
            lat: u.newLat,
            lng: u.newLng,
            stationaryTicks: moved ? 0 : prevMove.stationaryTicks + 1,
          };
        });

        // 2. Process real devices (they are stationary by default unless GPS is hooked up)
        prev.forEach(soldier => {
          if (soldier.isRealDevice) {
            const prevMove = movementRef.current[soldier.id] || { lat: soldier.lat, lng: soldier.lng, stationaryTicks: 0 };
            movementRef.current[soldier.id] = {
              lat: prevMove.lat,
              lng: prevMove.lng,
              stationaryTicks: prevMove.stationaryTicks + 1
            };
          }
        });

        return prev.map((s, i) => updates[i]?.updated ?? s);
      });
    }, 700);

    return () => clearInterval(intervalRef.current);
  }, []);

  return { soldiers, movementRef };
}
