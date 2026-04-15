import React, { useEffect, useState } from 'react';
import type { Soldier } from '../../data/soldiers';

interface SmsToastProps {
  soldier: Soldier;
  onClose: () => void;
}

export function SmsToast({ soldier, onClose }: SmsToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show toast with slide-in animation
    const showTimer = setTimeout(() => setVisible(true), 100);
    
    // Auto-dismiss after 4 seconds
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 500); // Wait for slide-out animation
    }, 4100); // 4 seconds + animation buffer

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [onClose]);

  return (
    <div 
      className={`fixed bottom-8 right-8 z-[2000] transition-all duration-500 transform ${visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
      style={{ width: '340px' }}
    >
      <div className="bg-[#1c1c1e]/70 backdrop-blur-xl text-white rounded-2xl shadow-2xl border border-white/10 overflow-hidden ring-1 ring-white/5">
        {/* iOS-style header */}
        <div className="bg-black/20 px-4 py-2 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 pulse-dot-fast"></span>
            <span className="font-sans text-[0.65rem] uppercase tracking-wider text-gray-300 font-bold">SIM800L Module</span>
          </div>
          <span className="font-sans text-[0.6rem] text-gray-400">JUST NOW</span>
        </div>
        
        {/* Message body */}
        <div className="p-4 bg-transparent">
          <div className="bg-[#0b84ff]/80 backdrop-blur-md text-white p-4 rounded-2xl rounded-tl-sm text-sm font-sans shadow-lg inline-block w-full border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold font-rajdhani text-lg uppercase tracking-widest text-[#ffffff]">MASCAL ALERT</p>
              <div className="h-5 w-5 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-[10px]">📡</span>
              </div>
            </div>
            
            <div className="space-y-1.5 border-l-2 border-white/30 pl-3">
              <p className="text-sm font-mono font-bold">{soldier.rank} {soldier.name}</p>
              <p className="text-[0.65rem] text-white/80 font-mono tracking-tight">GPS: {soldier.lat.toFixed(5)}, {soldier.lng.toFixed(5)}</p>
              
              <div className="mt-2 py-1 px-2 bg-red-500/30 border border-red-500/40 rounded inline-block">
                <p className="text-[0.6rem] font-bold text-red-100 uppercase tracking-tighter">TRIAGE: RED (IMMEDIATE)</p>
              </div>
              
              <p className="text-[0.7rem] font-mono mt-1 pt-1 border-t border-white/10">
                HR: <span className="font-bold">{soldier.bpm}</span> | SpO2: <span className="font-bold">{soldier.spo2}%</span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-2 flex justify-end bg-black/10 border-t border-white/10">
          <button 
            onClick={() => {
              setVisible(false);
              setTimeout(onClose, 500);
            }}
            className="text-[#58a6ff] hover:text-white transition-colors text-[0.7rem] font-bold uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-white/5"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}
