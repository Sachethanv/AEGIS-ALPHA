export type SoldierStatus = 'NOMINAL' | 'ELEVATED' | 'CRITICAL' | 'WOUNDED';

export interface Soldier {
  id: string;
  name: string;
  rank: string;
  unit: string;
  bpm: number;              // current heart rate
  bpmHistory: number[];     // last 20 readings for sparkline
  lat: number;
  lng: number;
  status: SoldierStatus;
  isRealDevice: boolean;    // true for your actual ESP32 unit
  lastUpdated: string;
  spo2: number;             // blood oxygen %
  aiDiagnosis?: {
    condition: string;
    confidence: number;
    action: string;
    isTrauma: boolean;
  };
}

// Medical Vitals Thresholds
export const BPM_THRESHOLDS = {
  LOW_CRITICAL: 50,   // Below 50 indicates severe bradycardia / shock
  NOMINAL_MIN: 60,    // 60-100 is normal resting heart rate
  NOMINAL_MAX: 100,   // Above 100 is tachycardia (normal during combat/exertion)
  ELEVATED_MAX: 140,  // 100-140 indicates high exertion or combat stress
  CRITICAL_HIGH: 170, // Above 170 indicates extreme physical trauma or panic
};

export const SPO2_THRESHOLDS = {
  CRITICAL_LOW: 90,   // Below 90% is severe hypoxia (requires immediate medical evac)
  ELEVATED_LOW: 95,   // 90-94% is mild hypoxia
};

export function getVitalsStatus(bpm: number, spo2: number): SoldierStatus {
  // Extreme cases -> WOUNDED
  if (bpm <= BPM_THRESHOLDS.LOW_CRITICAL || spo2 <= SPO2_THRESHOLDS.CRITICAL_LOW) return 'WOUNDED';
  if (bpm >= BPM_THRESHOLDS.CRITICAL_HIGH) return 'WOUNDED';
  
  // Severe cases -> CRITICAL
  if (bpm > BPM_THRESHOLDS.ELEVATED_MAX || spo2 < SPO2_THRESHOLDS.ELEVATED_LOW) return 'CRITICAL';
  
  // High exertion cases -> ELEVATED
  if (bpm > BPM_THRESHOLDS.NOMINAL_MAX) return 'ELEVATED';
  
  return 'NOMINAL';
}

// 11 soldiers — index 0 is the real hardware unit, rest are dummy simulations
export const INITIAL_SOLDIERS: Soldier[] = [
  {
    id: 'ALPHA-01',
    name: 'Sachethan v.',
    rank: 'SGT',
    unit: 'Alpha Squad',
    bpm: 78,
    bpmHistory: [72, 74, 76, 75, 78, 80, 79, 78, 77, 76, 78, 79, 80, 78, 77, 76, 75, 78, 79, 78],
    lat: 12.6801,
    lng: 77.4696,
    status: 'NOMINAL',
    isRealDevice: true,      // ← REAL ESP32 UNIT
    lastUpdated: 'LIVE',
    spo2: 98,
  },
  {
    id: 'ALPHA-02', name: 'Shreyas v.', rank: 'CPL', unit: 'Alpha Squad',
    bpm: 85, bpmHistory: [80, 82, 83, 85, 86, 84, 85, 87, 85, 84, 83, 85, 86, 85, 84, 83, 85, 86, 85, 85],
    lat: 12.7001, lng: 77.4896, status: 'NOMINAL', isRealDevice: false, lastUpdated: '2s ago', spo2: 97,
  },
  {
    id: 'ALPHA-03', name: 'Sampreeth K.', rank: 'PFC', unit: 'Alpha Squad',
    bpm: 92, bpmHistory: [88, 89, 90, 91, 92, 93, 92, 91, 92, 93, 94, 92, 91, 92, 93, 92, 91, 90, 92, 92],
    lat: 12.6601, lng: 77.4496, status: 'NOMINAL', isRealDevice: false, lastUpdated: '3s ago', spo2: 96,
  },
  {
    id: 'BRAVO-01', name: 'Arjun V.', rank: 'SGT', unit: 'Bravo Squad',
    bpm: 110, bpmHistory: [95, 98, 102, 105, 108, 110, 112, 110, 109, 110, 111, 110, 112, 113, 110, 109, 110, 111, 110, 110],
    lat: 12.7201, lng: 77.4296, status: 'ELEVATED', isRealDevice: false, lastUpdated: '1s ago', spo2: 95,
  },
  {
    id: 'BRAVO-02', name: 'Ravi S.', rank: 'CPL', unit: 'Bravo Squad',
    bpm: 158, bpmHistory: [90, 100, 115, 125, 135, 142, 148, 152, 155, 158, 160, 158, 157, 158, 159, 158, 157, 158, 159, 158],
    lat: 12.6401, lng: 77.5096, status: 'WOUNDED', isRealDevice: false, lastUpdated: 'NOW', spo2: 91,
  },
  {
    id: 'BRAVO-03', name: 'Kiran D.', rank: 'PFC', unit: 'Bravo Squad',
    bpm: 72, bpmHistory: [70, 71, 72, 73, 72, 71, 72, 73, 72, 71, 72, 73, 74, 72, 71, 70, 72, 73, 72, 72],
    lat: 12.6901, lng: 77.4196, status: 'NOMINAL', isRealDevice: false, lastUpdated: '4s ago', spo2: 99,
  },
];

