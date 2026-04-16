import { useEffect, useState } from 'react';
import type { TacticalMessage } from '../../App';

interface SmsToastProps {
  message: TacticalMessage;
  onClose: () => void;
}

const CRITICALITY_COLOR: Record<string, string> = {
  CRITICAL: '#ff3c3c',
  HIGH: '#ff8800',
  MODERATE: '#f5c518',
  LOW: '#00e87a',
};

export function SmsToast({ message, onClose }: SmsToastProps) {
  const [visible, setVisible] = useState(false);
  const critColor = CRITICALITY_COLOR[message.criticality] || '#ff3c3c';

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 100);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 500);
    }, 6000);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-8 right-8 z-[2000] transition-all duration-500 transform ${visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
      style={{ width: '360px' }}
    >
      <div className="rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10"
           style={{ background: 'rgba(10,18,26,0.92)', backdropFilter: 'blur(20px)', border: `1px solid ${critColor}55` }}>

        {/* Header */}
        <div className="px-4 py-2 flex items-center justify-between border-b border-white/10"
             style={{ background: `${critColor}18` }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full animate-ping absolute" style={{ background: critColor, opacity: 0.6 }} />
            <span className="w-2 h-2 rounded-full relative" style={{ background: critColor }} />
            <span className="font-mono text-[0.65rem] uppercase tracking-wider font-bold" style={{ color: critColor }}>
              AUTO-SMS · SIM800L
            </span>
          </div>
          <span className="font-mono text-[0.6rem] text-gray-400">{message.timestamp}</span>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Condition badge */}
          <div className="flex items-center gap-2">
            <div
              className="px-3 py-1 rounded font-rajdhani font-bold text-base tracking-widest"
              style={{ background: `${critColor}20`, color: critColor, border: `1px solid ${critColor}55` }}
            >
              {message.condition}
            </div>
            <div
              className="px-2 py-1 rounded text-[0.6rem] font-mono font-bold tracking-widest"
              style={{ background: `${critColor}20`, color: critColor }}
            >
              {message.criticality}
            </div>
          </div>

          {/* Casualty */}
          <div className="border-l-2 pl-3 space-y-1" style={{ borderColor: `${critColor}88` }}>
            <p className="font-mono text-sm font-bold text-white">
              {message.casualty.rank} {message.casualty.name}
            </p>
            <p className="font-mono text-[0.65rem] text-gray-400">
              HR: <span className="text-white font-bold">{message.casualty.bpm}</span> BPM  ·  SpO₂: <span className="text-white font-bold">{message.casualty.spo2}%</span>
            </p>
            <p className="font-mono text-[0.65rem] text-gray-400">
              GPS: {message.casualty.lat.toFixed(5)}, {message.casualty.lng.toFixed(5)}
            </p>
            <div className="flex gap-3 items-center pt-1">
              <span className="text-[0.6rem] text-gray-500">TIME TO TREAT</span>
              <span className="font-mono text-[0.65rem] font-bold text-[#f5c518]">{message.timeToTreat}</span>
            </div>
          </div>

          {/* Recipients */}
          <div>
            <p className="text-[0.58rem] text-gray-500 uppercase tracking-widest mb-1">Alerting nearest units</p>
            <div className="flex gap-2">
              {message.recipients.map(r => (
                <div key={r.id} className="bg-[rgba(0,200,130,0.1)] border border-[rgba(0,200,130,0.3)] rounded px-2 py-1">
                  <span className="text-[0.65rem] text-[var(--accent-green)] font-mono font-bold">{r.rank} {r.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action */}
          <p className="text-[0.65rem] font-mono text-gray-300 border-t border-white/10 pt-2">
            <span className="text-gray-500">ACTION: </span>{message.action}
          </p>
        </div>

        {/* Footer */}
        <div className="px-4 pb-3 flex justify-end">
          <button
            onClick={() => { setVisible(false); setTimeout(onClose, 500); }}
            className="text-[0.7rem] font-bold uppercase tracking-widest px-4 py-1.5 rounded-lg transition-all"
            style={{ color: critColor, border: `1px solid ${critColor}44` }}
          >
            ACKNOWLEDGE
          </button>
        </div>
      </div>
    </div>
  );
}
