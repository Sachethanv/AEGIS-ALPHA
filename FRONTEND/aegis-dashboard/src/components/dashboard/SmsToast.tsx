import React, { useEffect, useState } from 'react';
import type { Soldier } from '../../data/soldiers';

interface SmsToastProps {
  soldier: Soldier;
  onClose: () => void;
}

export function SmsToast({ soldier, onClose }: SmsToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slight delay to simulate transmission
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`fixed top-4 right-4 z-50 transition-all duration-500 transform ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
      style={{ width: '320px' }}
    >
      <div className="bg-[#1c1c1e] text-white rounded-2xl shadow-2xl border border-[#38383a] overflow-hidden">
        {/* iOS-style header */}
        <div className="bg-[#2c2c2e] px-4 py-2 flex items-center justify-between border-b border-[#38383a]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 pulse-dot-fast"></span>
            <span className="font-sans text-xs text-gray-300">SIM800L Module</span>
          </div>
          <span className="font-sans text-xs text-gray-400">Just now</span>
        </div>
        
        {/* Message body */}
        <div className="p-4 bg-[#1c1c1e]">
          <div className="bg-[#0b84ff] text-white p-3 rounded-2xl rounded-tl-sm text-sm font-sans shadow-lg inline-block w-full">
            <p className="mb-2 font-bold font-rajdhani text-lg uppercase tracking-wide">MASCAL ALERT</p>
            <p className="mb-1 text-sm font-mono">{soldier.rank} {soldier.name}</p>
            <p className="mb-1 text-xs">GPS: {soldier.lat.toFixed(5)}, {soldier.lng.toFixed(5)}</p>
            <p className="mb-1 text-xs font-bold text-red-200">TRIAGE: RED (IMMEDIATE)</p>
            <p className="text-xs">HR: {soldier.bpm} | SpO2: {soldier.spo2}%</p>
          </div>
        </div>
        
        <div className="p-2 flex justify-end bg-[#1c1c1e] border-t border-[#38383a]">
          <button 
            onClick={() => {
              setVisible(false);
              setTimeout(onClose, 500);
            }}
            className="text-[#0b84ff] text-xs font-semibold px-3 py-1"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}
