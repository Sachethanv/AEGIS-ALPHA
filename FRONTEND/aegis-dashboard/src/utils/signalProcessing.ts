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
  if (buffer.length < 40) return 0; // Need at least 2 seconds (40 frames * 50ms = 2s) to attempt calculation

  // 1. Calculate DC mean to normalize the signal
  const mean = buffer.reduce((a, b) => a + b, 0) / buffer.length;
  
  // 2. Subtract DC to get pure AC signal (centered around 0 for amplitude checking)
  const acSignal = buffer.map(val => val - mean);

  // 3. Smooth the noise out using a small sliding window (e.g., 5 frames = 250ms smoothing)
  const smoothed = movingAverage(acSignal, 5);

  // 4. Calculate dynamic threshold based on signal variance (half of max peak to avoid dicrotic notches)
  const maxAc = Math.max(...smoothed);
  const minAc = Math.min(...smoothed);
  const amplitude = maxAc - minAc;
  
  // If amplitude is too small, sensor is likely off-finger or pure noise
  if (amplitude < 50) return 0; 

  const dynamicThreshold = maxAc * 0.5;

  // 5. Find peaks
  // minDistance: max allowable BPM is roughly 200, which is over 3 beats per sec, or ~300ms per beat.
  // 300ms / 50ms = 6 frames minimum distance
  const peaks = findPeaks(smoothed, dynamicThreshold, 6);

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
  const bpm = 60000 / avgTimeBetweenBeatsMs;

  // Clamp insane values (e.g., from massive artifacts)
  if (bpm < 30 || bpm > 220) return 0;

  return Math.round(bpm);
}
