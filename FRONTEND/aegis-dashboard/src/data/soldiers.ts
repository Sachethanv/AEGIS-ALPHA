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
}

// BPM Thresholds
export const BPM_THRESHOLDS = {
  LOW_CRITICAL: 40,   // below this = unconscious/critical
  NOMINAL_MIN: 55,
  NOMINAL_MAX: 100,
  ELEVATED_MAX: 130,
  CRITICAL_HIGH: 150,  // above this = wounded/shock
};

export function getBpmStatus(bpm: number): SoldierStatus {
  if (bpm < BPM_THRESHOLDS.LOW_CRITICAL) return 'WOUNDED';
  if (bpm > BPM_THRESHOLDS.CRITICAL_HIGH) return 'WOUNDED';
  if (bpm > BPM_THRESHOLDS.ELEVATED_MAX) return 'CRITICAL';
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
  {
    id: 'CHARLIE-01', name: 'Pradeep N.', rank: 'SGT', unit: 'Charlie Squad',
    bpm: 68, bpmHistory: [65, 66, 67, 68, 69, 68, 67, 68, 69, 68, 67, 68, 69, 68, 67, 66, 68, 69, 68, 68],
    lat: 12.6701, lng: 77.5196, status: 'NOMINAL', isRealDevice: false, lastUpdated: '2s ago', spo2: 98,
  },
  {
    id: 'CHARLIE-02', name: 'Manoj P.', rank: 'CPL', unit: 'Charlie Squad',
    bpm: 125, bpmHistory: [100, 105, 110, 115, 118, 120, 122, 124, 125, 126, 125, 124, 125, 126, 125, 124, 123, 125, 126, 125],
    lat: 12.7301, lng: 77.4696, status: 'CRITICAL', isRealDevice: false, lastUpdated: '1s ago', spo2: 93,
  },
  {
    id: 'CHARLIE-03', name: 'Suresh B.', rank: 'PFC', unit: 'Charlie Squad',
    bpm: 80, bpmHistory: [78, 79, 80, 81, 80, 79, 80, 81, 82, 80, 79, 80, 81, 80, 79, 78, 80, 81, 80, 80],
    lat: 12.6301, lng: 77.4696, status: 'NOMINAL', isRealDevice: false, lastUpdated: '3s ago', spo2: 97,
  },
  {
    id: 'DELTA-01', name: 'Vikram H.', rank: 'SGT', unit: 'Delta Squad',
    bpm: 88, bpmHistory: [85, 86, 87, 88, 89, 88, 87, 88, 89, 90, 88, 87, 88, 89, 88, 87, 86, 88, 89, 88],
    lat: 12.7101, lng: 77.4996, status: 'NOMINAL', isRealDevice: false, lastUpdated: '2s ago', spo2: 96,
  },
  {
    id: 'DELTA-02', name: 'Anand L.', rank: 'CPL', unit: 'Delta Squad',
    bpm: 35, bpmHistory: [75, 60, 50, 42, 38, 36, 35, 34, 35, 36, 35, 34, 35, 36, 35, 34, 35, 36, 35, 35],
    lat: 12.6501, lng: 77.4396, status: 'WOUNDED', isRealDevice: false, lastUpdated: 'NOW', spo2: 88,
  },
];
