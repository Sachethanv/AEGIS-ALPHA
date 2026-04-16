export type SoldierStatus = 'NOMINAL' | 'ELEVATED' | 'CRITICAL' | 'WOUNDED';

export interface Soldier {
  id: string;
  name: string;
  rank: string;
  unit: string;
  bpm: number;
  bpmHistory: number[];
  lat: number;
  lng: number;
  status: SoldierStatus;
  isRealDevice: boolean;
  lastUpdated: string;
  spo2: number;
  phone?: string;   // mobile number for SMS routing
  aiDiagnosis?: {
    condition: string;
    confidence: number;
    action: string;
    isTrauma: boolean;
  };
}

// AEGIS Medical Classification Thresholds
export const BPM_THRESHOLDS = {
  EXTREME_LOW: 45,    // < 45 or > 150
  STABLE_MIN: 60,     // 60 - 100
  STABLE_MAX: 100,
  STRESSED_MAX: 120,  // 101 - 120
  CRITICAL_MAX: 150,  // 121 - 150
};

export const SPO2_THRESHOLDS = {
  STABLE_MIN: 95,     // 95 - 100
  STRESSED_MIN: 92,   // 92 - 94
  CRITICAL_MIN: 85,   // 85 - 91
  // < 85 is Extreme
};

export function getVitalsStatus(bpm: number, spo2: number): SoldierStatus {
  // Extreme: > 150 or < 45 BPM, or < 85% SpO2
  if (bpm > 150 || bpm < 45 || spo2 < 85) return 'WOUNDED';
  
  // Critical: 121 - 150 BPM, or 85 - 91% SpO2
  if (bpm > 120 || spo2 < 92) return 'CRITICAL';
  
  // Stressed: 101 - 120 BPM, or 92 - 94% SpO2
  if (bpm > 100 || spo2 < 95) return 'ELEVATED';
  
  // Stable: 60 - 100 BPM, 95 - 100% SpO2
  return 'NOMINAL';
}

export const INITIAL_SOLDIERS: Soldier[] = [
  {
    id: 'ALPHA-01', name: 'Sachethan v.', rank: 'SGT', unit: 'Alpha Squad',
    bpm: 78, bpmHistory: [72,74,76,75,78,80,79,78,77,76,78,79,80,78,77,76,75,78,79,78],
    lat: 12.6801, lng: 77.4696, status: 'NOMINAL', isRealDevice: true,
    lastUpdated: 'LIVE', spo2: 98, phone: '+91XXXXXXXXXX',
  },
  {
    id: 'ALPHA-02', name: 'Shreyas v.', rank: 'CPL', unit: 'Alpha Squad',
    bpm: 85, bpmHistory: [80,82,83,85,86,84,85,87,85,84,83,85,86,85,84,83,85,86,85,85],
    lat: 12.7001, lng: 77.4896, status: 'NOMINAL', isRealDevice: false,
    lastUpdated: '2s ago', spo2: 97, phone: '+91XXXXXXXXXX',
  },
  {
    id: 'ALPHA-03', name: 'Sampreeth K.', rank: 'PFC', unit: 'Alpha Squad',
    bpm: 92, bpmHistory: [88,89,90,91,92,93,92,91,92,93,94,92,91,92,93,92,91,90,92,92],
    lat: 12.6601, lng: 77.4496, status: 'NOMINAL', isRealDevice: false,
    lastUpdated: '3s ago', spo2: 96, phone: '+91XXXXXXXXXX',
  },
  {
    id: 'BRAVO-01', name: 'Arjun V.', rank: 'SGT', unit: 'Bravo Squad',
    bpm: 110, bpmHistory: [95,98,102,105,108,110,112,110,109,110,111,110,112,113,110,109,110,111,110,110],
    lat: 12.7201, lng: 77.4296, status: 'ELEVATED', isRealDevice: false,
    lastUpdated: '1s ago', spo2: 95, phone: '+91XXXXXXXXXX',
  },
  {
    id: 'BRAVO-02', name: 'Ravi S.', rank: 'CPL', unit: 'Bravo Squad',
    bpm: 158, bpmHistory: [90,100,115,125,135,142,148,152,155,158,160,158,157,158,159,158,157,158,159,158],
    lat: 12.6401, lng: 77.5096, status: 'WOUNDED', isRealDevice: false,
    lastUpdated: 'NOW', spo2: 91, phone: '+91XXXXXXXXXX',
  },
  {
    id: 'BRAVO-03', name: 'Kiran D.', rank: 'PFC', unit: 'Bravo Squad',
    bpm: 72, bpmHistory: [70,71,72,73,72,71,72,73,72,71,72,73,74,72,71,70,72,73,72,72],
    lat: 12.6901, lng: 77.4196, status: 'NOMINAL', isRealDevice: false,
    lastUpdated: '4s ago', spo2: 99, phone: '+91XXXXXXXXXX',
  },
];
