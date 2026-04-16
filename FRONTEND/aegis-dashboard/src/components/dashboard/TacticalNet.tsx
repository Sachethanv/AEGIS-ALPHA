import React, { useEffect, useRef } from 'react';
import type { TacticalMessage } from '../../App';

interface Props {
  messages: TacticalMessage[];
}

const CRITICALITY_COLOR: Record<string, string> = {
  CRITICAL: '#ff3c3c',
  HIGH: '#ff8800',
  MODERATE: '#f5c518',
  LOW: '#00e87a',
};

export function TacticalNet({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-4rem)] pt-16 px-4 pb-6"
         style={{ fontFamily: "'Share Tech Mono', monospace", background: 'transparent' }}>
      
      {/* Header */}
      <div className="flex items-center gap-4 py-4 border-b border-[var(--bg-border)] mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse shadow-[0_0_8px_var(--accent-green)]" />
          <span className="text-[var(--accent-green)] font-bold tracking-[0.2em] text-sm">TACTICAL NET</span>
        </div>
        <span className="text-[var(--text-muted)] text-xs">// SECURE CHANNEL · AES-256 · FREQ 148.000 MHz</span>
        <div className="ml-auto text-[var(--text-muted)] text-xs">{messages.length} MSG{messages.length !== 1 ? 'S' : ''}</div>
      </div>

      {/* Message feed */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-[var(--text-muted)]">
            <span className="text-4xl opacity-20">📡</span>
            <p className="text-xs tracking-widest">CHANNEL CLEAR — NO ALERTS TRANSMITTED</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const critColor = CRITICALITY_COLOR[msg.criticality] || '#00e87a';
            return (
              <div
                key={msg.id}
                className="rounded border bg-[rgba(8,22,32,0.85)] backdrop-blur-md overflow-hidden"
                style={{ borderColor: `${critColor}44` }}
              >
                {/* Message header bar */}
                <div
                  className="flex items-center justify-between px-4 py-1.5 border-b"
                  style={{ borderColor: `${critColor}33`, background: `${critColor}10` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[0.6rem] tracking-[0.2em]" style={{ color: critColor }}>
                      ⬤ {msg.criticality}
                    </span>
                    <span className="text-[0.6rem] text-[var(--text-muted)]">MSG #{String(i + 1).padStart(3, '0')}</span>
                  </div>
                  <span className="text-[0.6rem] text-[var(--text-muted)]">{msg.timestamp}</span>
                </div>

                {/* Body */}
                <div className="px-4 py-3 space-y-2">
                  {/* FROM line */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-[0.6rem] text-[var(--text-muted)] w-12 shrink-0">FROM</span>
                    <span className="text-xs text-[var(--accent-blue)]">AEGIS-RULES // DETERMINISTIC ENGINE</span>
                  </div>

                  {/* TO line */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-[0.6rem] text-[var(--text-muted)] w-12 shrink-0">TO</span>
                    <span className="text-xs text-[var(--text-primary)]">
                      {msg.recipients.map(r => `${r.rank} ${r.name}`).join('  ·  ')}
                    </span>
                  </div>

                  {/* RE line */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-[0.6rem] text-[var(--text-muted)] w-12 shrink-0">RE</span>
                    <span className="text-xs" style={{ color: critColor }}>
                      MASCAL ALERT — {msg.casualty.rank} {msg.casualty.name} ({msg.casualty.id})
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-[var(--bg-border)] my-1" />

                  {/* Condition block */}
                  <div className="flex flex-wrap gap-3 items-center">
                    <div
                      className="px-3 py-1 rounded font-bold text-sm tracking-widest"
                      style={{ background: `${critColor}20`, color: critColor, border: `1px solid ${critColor}55` }}
                    >
                      {msg.condition}
                    </div>
                    <div className="text-[0.65rem] text-[var(--text-secondary)]">
                      TIME TO TREAT: <span className="text-[var(--warn-yellow)] font-bold">{msg.timeToTreat}</span>
                    </div>
                    <div className="text-[0.65rem] text-[var(--text-secondary)]">
                      STATUS: <span className="text-[var(--text-primary)]">DETERMINISTIC</span>
                    </div>
                  </div>

                  {/* Vitals */}
                  <div className="text-[0.65rem] text-[var(--text-muted)]">
                    HR <span className="text-[var(--text-primary)] font-bold">{msg.casualty.bpm} BPM</span>
                    {'  '}SpO₂ <span className="text-[var(--text-primary)] font-bold">{msg.casualty.spo2}%</span>
                    {'  '}GPS <span className="text-[var(--text-secondary)]">{msg.casualty.lat.toFixed(5)}, {msg.casualty.lng.toFixed(5)}</span>
                  </div>

                  {/* Action */}
                  <div className="text-[0.65rem]">
                    <span className="text-[var(--text-muted)]">ACTION: </span>
                    <span className="text-[var(--text-primary)]">{msg.action}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
