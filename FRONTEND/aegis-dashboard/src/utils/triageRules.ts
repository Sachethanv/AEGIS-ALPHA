/**
 * Rule-based triage engine — replaces the Gemini AI call.
 * Based on the AEGIS Medical Classification Table.
 *
 * | Category | BPM           | SpO2       | Status Name             | HUD Color     |
 * |----------|---------------|------------|-------------------------|---------------|
 * | Stable   | 60 – 100      | 95 – 100%  | STATUS_NORMAL           | Green         |
 * | Stressed | 101 – 120     | 92 – 94%   | STATUS_EXERTION         | Yellow        |
 * | Critical | 121 – 150     | 85 – 91%   | STATUS_HEMORRHAGE_RISK  | Red           |
 * | Extreme  | >150 or <45   | < 85%      | STATUS_SHOCK_IMMINENT   | Flashing Red  |
 */

export type TriageCategory = 'Stable' | 'Stressed' | 'Critical' | 'Extreme';

export interface TriageResult {
  category: TriageCategory;
  statusName: string;         // e.g. "STATUS_SHOCK_IMMINENT"
  condition: string;          // 2-word human label, e.g. "Shock Imminent"
  criticality: string;        // "LOW" | "MODERATE" | "HIGH" | "CRITICAL"
  hudColor: string;           // CSS color string
  flashing: boolean;
  timeToTreat: string;        // e.g. "Immediate", "< 10 min", "< 30 min", "Monitor"
  action: string;
  confidence: number;         // always 100 for rule-based
  isTrauma: boolean;
}

export function evaluateTriage(bpm: number, spo2: number): TriageResult {
  // Extreme: BPM > 150 or BPM < 45, OR SpO2 < 85%
  if (bpm > 150 || bpm < 45 || spo2 < 85) {
    return {
      category: 'Extreme',
      statusName: 'STATUS_SHOCK_IMMINENT',
      condition: 'Shock Imminent',
      criticality: 'CRITICAL',
      hudColor: '#ff3c3c',
      flashing: true,
      timeToTreat: 'Immediate',
      action: 'Medevac NOW — apply tourniquet, push fluids',
      confidence: 100,
      isTrauma: true,
    };
  }

  // Critical: BPM 121–150, SpO2 85–91%
  // Either condition alone is enough to flag Critical
  if (bpm >= 121 || spo2 <= 91) {
    return {
      category: 'Critical',
      statusName: 'STATUS_HEMORRHAGE_RISK',
      condition: 'Hemorrhage Risk',
      criticality: 'HIGH',
      hudColor: '#ff3c3c',
      flashing: false,
      timeToTreat: '< 10 min',
      action: 'Apply pressure dressing, prepare for extraction',
      confidence: 100,
      isTrauma: true,
    };
  }

  // Stressed: BPM 101–120, SpO2 92–94%
  if (bpm >= 101 || spo2 <= 94) {
    return {
      category: 'Stressed',
      statusName: 'STATUS_EXERTION',
      condition: 'Combat Exertion',
      criticality: 'MODERATE',
      hudColor: '#f5c518',
      flashing: false,
      timeToTreat: '< 30 min',
      action: 'Monitor closely, reduce exertion if possible',
      confidence: 100,
      isTrauma: false,
    };
  }

  // Stable: BPM 60–100, SpO2 95–100%
  return {
    category: 'Stable',
    statusName: 'STATUS_NORMAL',
    condition: 'Vitals Stable',
    criticality: 'LOW',
    hudColor: '#00e87a',
    flashing: false,
    timeToTreat: 'Monitor',
    action: 'No action required',
    confidence: 100,
    isTrauma: false,
  };
}
