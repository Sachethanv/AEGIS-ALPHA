/**
 * Calculates a simple moving average for a numerical array to smooth out signal noise.
 */
function movingAverage(data: number[], windowSize: number): number[] {
  if (data.length < windowSize) return data;
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const subset = data.slice(start, i + 1);
    const sum = subset.reduce((a, b) => a + b, 0);
    result.push(sum / subset.length);
  }
  return result;
}

/**
 * Finds local maxima in the smoothed signal array
 * @param smoothedData The smoothed array of IR sensor values
 * @param threshold The minimum amplitude to be considered a valid heartbeat peak
 * @param minDistance The minimum number of samples between peaks
 */
function findPeaks(smoothedData: number[], threshold: number, minDistance: number): number[] {
  const peaks: number[] = [];
  for (let i = 1; i < smoothedData.length - 1; i++) {
    // Basic local maxima check
    if (smoothedData[i] > smoothedData[i - 1] && smoothedData[i] > smoothedData[i + 1]) {
      // Must beat threshold
      if (smoothedData[i] > threshold) {
        // Must be distant enough from the last detected peak
        if (peaks.length === 0 || (i - peaks[peaks.length - 1]) >= minDistance) {
          peaks.push(i);
        }
      }
    }
  }
  return peaks;
}

/**
 * Calculates current BPM based on an array of raw MAX30102 IR values.
 * Assuming data is polled every 50ms.
 * 
 * @param buffer Array of recent IR readings (e.g., last 100-200 frames / 5-10 seconds of data)
 * @param pollingIntervalMs How fast the buffer is populated (e.g., 50 milliseconds)
 * @returns number Calculated Beats Per Minute, or 0 if calculating is not yet possible.
 */
export function calculateBPM(buffer: number[], pollingIntervalMs: number = 50): number {
  if (buffer.length < 20) return 0; // Need at least 20 frames to attempt calculation

  // 1. Calculate DC mean to normalize the signal
  const mean = buffer.reduce((a, b) => a + b, 0) / buffer.length;
  
  // 2. Subtract DC to get pure AC signal (centered around 0 for amplitude checking)
  const acSignal = buffer.map(val => val - mean);

  // 3. Smooth the noise out using a larger sliding window
  // Since we poll at 30ms, 10 frames = 300ms of smoothing. This crushes the intense, rigid noise seen in the raw logs.
  const smoothed = movingAverage(acSignal, 10);

  // 4. Calculate dynamic threshold based on signal variance
  const maxAc = Math.max(...smoothed);
  const minAc = Math.min(...smoothed);
  const amplitude = maxAc - minAc;
  
  // If amplitude is too small, sensor is likely off-finger or pure noise
  if (amplitude < 50) return 0;

  const dynamicThreshold = maxAc * 0.5;

  // 5. Find peaks
  // minDistance: We poll at roughly 30ms. Maximum 200 BPM = 300ms per beat. 300ms / 30ms = 10 frames minimum.
  const peaks = findPeaks(smoothed, dynamicThreshold, 10);

  // 6. If we have at least 2 peaks, we can calculate heart rate
  if (peaks.length < 2) return 0;

  // Calculate average distance between consecutive peaks
  let totalDistance = 0;
  for (let i = 1; i < peaks.length; i++) {
    totalDistance += (peaks[i] - peaks[i - 1]);
  }
  const avgDistanceFrames = totalDistance / (peaks.length - 1);

  // 7. Convert distance back to time and BPM
  const avgTimeBetweenBeatsMs = avgDistanceFrames * pollingIntervalMs;
  let bpm = 60000 / avgTimeBetweenBeatsMs;

  // Clamp insane values caused by random artifacts instead of instantly returning 0
  if (bpm > 200) bpm = 190;
  if (bpm < 40) return 0;

  return Math.round(bpm);
}

/**
 * Calculates current BPM and SpO2 based on an array of raw MAX30102 IR values.
 * Since we only have the IR values in this payload, SpO2 is simulated using the IR's AC/DC ratio components.
 * Real SpO2 requires multiplexing Red and IR LEDs.
 */
export function calculateVitals(buffer: number[], pollingIntervalMs: number = 50): { bpm: number; spo2: number } {
  const bpm = calculateBPM(buffer, pollingIntervalMs);
  
  if (bpm === 0) {
    return { bpm: 0, spo2: 0 };
  }

  // To simulate SpO2, we'll calculate the IR AC / DC ratio
  // Standard SpO2 mathematical formula relies on R = (AC_red/DC_red) / (AC_ir/DC_ir)
  // We approximate "R" using the IR ratio mapped linearly to a typical healthy range.
  
  const dc = buffer.reduce((a, b) => a + b, 0) / buffer.length;
  const acSignal = buffer.map(val => val - dc);
  const smoothed = movingAverage(acSignal, 5);
  
  const maxAc = Math.max(...smoothed);
  const minAc = Math.min(...smoothed);
  const acAmplitude = maxAc - minAc;

  // Real Ratio of Ratios requires red light. We synthesize a mock R value 
  // that slightly fluctuates based on IR amplitude strength to simulate realistic mathematical variance
  const irRatio = dc > 0 ? (acAmplitude / dc) : 0;
  
  // A perfect wave might give a mock R of 0.4. (110 - 25 * 0.4 = 100%)
  // A weak wave might give a mock R of 0.8 (110 - 25 * 0.8 = 90%)
  // We inversely correlate our raw irRatio to the mockR.
  let mockR = 0.4 + (0.01 / (irRatio + 0.001)); 

  // Math Formula: SpO2 = 110 - 25 * R
  let spo2 = 110.0 - (25.0 * mockR);

  // Clamp values
  if (spo2 > 99) spo2 = 99; // Standard healthy pulse ox cap
  if (spo2 < 50) spo2 = 50;

  return { 
    bpm: Math.round(bpm), 
    spo2: Math.round(spo2) 
  };
}
