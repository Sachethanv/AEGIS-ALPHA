import type { Soldier } from '../data/soldiers';

/**
 * Calculates the rough distance between two geographic coordinates in meters.
 * Using the equirectangular approximation since the distances are small.
 */
export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const x = (lon2 - lon1) * Math.cos((lat1 + lat2) / 2 * Math.PI / 180);
  const y = lat2 - lat1;
  const d = Math.sqrt(x * x + y * y) * R * Math.PI / 180;
  return d;
}

/**
 * Finds the nearest N soldiers to a given target soldier.
 */
export function getNearestSoldiers(targetId: string, allSoldiers: Soldier[], count = 2): Soldier[] {
  const target = allSoldiers.find(s => s.id === targetId);
  if (!target) return [];

  const others = allSoldiers.filter(s => s.id !== targetId);
  
  // Sort by distance
  others.sort((a, b) => {
    const distA = getDistanceMeters(target.lat, target.lng, a.lat, a.lng);
    const distB = getDistanceMeters(target.lat, target.lng, b.lat, b.lng);
    return distA - distB;
  });

  return others.slice(0, count);
}
