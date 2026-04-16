import type { Soldier } from '../../data/soldiers';
import {PulseChart} from './PulseChart';
import { useState } from 'react';
import { evaluateTriage, type TriageResult } from '../../utils/triageRules';

interface Props {
  soldier: Soldier;
  onShowMap: (soldier: Soldier) => void;
}

const STATUS_COLORS = {
  NOMINAL:  'var(--accent-green)',
  ELEVATED: 'var(--warn-yellow)',
  CRITICAL: '#ff8800',
  WOUNDED:  'var(--critical-red)',
};

export function SoldierCard({ soldier, onShowMap }: Props) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<TriageResult | null>(null);

  const triage = diagnosis || evaluateTriage(soldier.bpm, soldier.spo2);
  const color = triage.hudColor || STATUS_COLORS[soldier.status];
  const isWounded = soldier.status === 'WOUNDED';
  const isExtreme = triage.category === 'Extreme';

  const handleRuleTriage = () => {
    setIsAnalyzing(true);
    // Simulate a tiny delay for effect
    setTimeout(() => {
      const res = evaluateTriage(soldier.bpm, soldier.spo2);
      setDiagnosis(res);
      setIsAnalyzing(false);
    }, 400);
  };

  return (
    <div
      className={`relative p-3.5 bg-[var(--bg-panel)] border rounded backdrop-blur-[10px] transition-all duration-200 
        ${isWounded ? 'border-[var(--critical-red)] shadow-[0_0_20px_var(--critical-red-dim)]' : 'border-[var(--bg-border)]'}`}
      style={{
        borderLeft: `3px solid ${color}`,
        animation: isExtreme ? 'card-critical-pulse 0.6s ease-in-out infinite' : (isWounded ? 'card-critical-pulse 1.2s ease-in-out infinite' : 'none'),
      }}
    >
      {/* WOUNDED alert badge */}
      {isWounded && (
        <div className="absolute top-2 right-2 bg-[var(--critical-red)] text-white text-[0.55rem] font-rajdhani font-bold tracking-[0.15em] px-1.5 py-0.5 rounded animate-[blink_0.6s_step-start_infinite]">
          ⚠ WOUNDED
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[0.7rem]" style={{ color }}>{soldier.id}</span>
          {soldier.isRealDevice && (
            <span className="text-[0.55rem] bg-[var(--accent-green-dim)] text-[var(--accent-green)] px-1.5 py-0.5 rounded font-rajdhani tracking-[0.1em] border border-[var(--accent-green)]">
              ◉ REAL
            </span>
          )}
        </div>
        {/* Status dot */}
        <span 
          className={`w-2 h-2 rounded-full shadow-[0_0_8px] inline-block
            ${isWounded || isExtreme ? 'pulse-dot-fast' : 'pulse-dot'}`} 
          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
        />
      </div>

      {/* Name & Unit */}
      <div className="font-rajdhani font-semibold text-[var(--text-primary)] text-sm tracking-wide leading-tight">
        {soldier.rank} {soldier.name}
      </div>
      <div className="font-rajdhani text-[0.65rem] text-[var(--text-secondary)] tracking-widest mb-2.5">
        {soldier.unit}
      </div>

      {/* Vitals */}
      <div className="flex gap-5 mb-2.5">
        <div>
          <div className="text-[0.55rem] text-[var(--text-muted)] font-rajdhani tracking-[0.12em]">HEART RATE</div>
          <div className="font-mono text-2xl leading-none flex items-baseline gap-1" style={{ color, textShadow: `0 0 10px ${color}66` }}>
            {soldier.bpm}
            <span className="text-[0.65rem] text-[var(--text-secondary)]">BPM</span>
          </div>
        </div>
        <div>
          <div className="text-[0.55rem] text-[var(--text-muted)] font-rajdhani tracking-[0.12em]">SpO₂</div>
          <div className="font-mono text-2xl leading-none flex items-baseline gap-1" style={{ color: soldier.spo2 < 94 ? 'var(--critical-red)' : 'var(--accent-blue)' }}>
            {soldier.spo2}
            <span className="text-[0.65rem] text-[var(--text-secondary)]">%</span>
          </div>
        </div>
      </div>

      {/* Sparkline Chart */}
      <PulseChart data={soldier.bpmHistory} status={soldier.status} />

      {/* GPS Button */}
      <button
        onClick={() => onShowMap(soldier)}
        className="mt-2.5 w-full bg-transparent border rounded text-[0.65rem] font-rajdhani font-semibold tracking-[0.15em] py-1.5 cursor-pointer transition-all hover:bg-[rgba(255,255,255,0.05)]"
        style={{ border: `1px solid ${color}44`, color: color }}
      >
        ◎ VIEW GPS LOCATION
      </button>

      {/* AI Triage Section */}
      <div className="mt-3 pt-3 border-t border-[var(--bg-border)]">
        {diagnosis ? (
          <div className="bg-[rgba(0,0,0,0.2)] p-2 rounded border border-[var(--bg-border)]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[0.6rem] font-rajdhani tracking-widest text-[var(--accent-blue)]">⬡ AEGIS RULE ENGINE</span>
              <span className="text-[0.6rem] text-[var(--text-muted)]">DETRMINISTIC</span>
            </div>
            <div className={`font-mono text-[0.65rem] leading-tight mb-1 ${diagnosis.isTrauma ? 'text-[var(--critical-red)]' : 'text-[var(--accent-green)]'}`}>
              STATUS: <span className="font-bold">{diagnosis.statusName}</span>
            </div>
            <div className={`font-mono text-sm leading-tight mb-1 ${diagnosis.isTrauma ? 'text-[var(--critical-red)]' : 'text-[var(--accent-green)]'}`}>
              DIAGNOSIS: <span className="font-bold uppercase tracking-tighter">{diagnosis.condition}</span>
            </div>
            <div className="text-[0.65rem] font-rajdhani text-[var(--text-secondary)]">
              ACTION: <span className="text-[var(--text-primary)]">{diagnosis.action}</span>
            </div>
          </div>
        ) : (
          <button
            onClick={handleRuleTriage}
            disabled={isAnalyzing}
            className="w-full bg-[rgba(255,255,255,0.05)] border border-[var(--bg-border)] rounded text-[0.65rem] font-rajdhani font-semibold tracking-[0.15em] py-1.5 cursor-pointer transition-all hover:bg-[rgba(255,255,255,0.1)] hover:text-[#00d0ff] disabled:opacity-50"
          >
            {isAnalyzing ? '⚡ PROCESSING...' : '⬡ RUN RULE-BASED TRIAGE'}
          </button>
        )}
      </div>

      {/* Last updated */}
      <div className="text-[0.55rem] text-[var(--text-muted)] font-mono mt-2 text-right">
        {soldier.lastUpdated === 'LIVE' || soldier.lastUpdated === 'NOW'
          ? <span className="text-[var(--accent-green)]">● {soldier.lastUpdated}</span>
          : soldier.lastUpdated
        }
      </div>
    </div>
  );
}
