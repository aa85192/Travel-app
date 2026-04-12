import { Spot, TransportMode, TransitEstimate, Transit, DayPlan } from '../types';

/**
 * 計算兩點間的直線距離 (Haversine formula)
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

/**
 * 估算交通時間與距離
 */
export function estimateTransit(from: Spot, to: Spot): { [key in TransportMode]?: TransitEstimate } {
  const distance = calculateDistance(from.lat, from.lng, to.lat, to.lng);
  
  // 簡單的估算邏輯 (僅供參考)
  const walkingSpeed = 1.2; // m/s
  const busSpeed = 5.5; // m/s (含停站)
  const subwaySpeed = 8.3; // m/s
  const taxiSpeed = 11.1; // m/s

  return {
    walking: {
      distance: Math.round(distance * 1.2), // 步行通常比直線遠
      duration: Math.round((distance * 1.2) / walkingSpeed / 60),
    },
    bus: {
      distance: Math.round(distance * 1.4),
      duration: Math.round((distance * 1.4) / busSpeed / 60) + 5, // 加 5 分鐘等車
    },
    subway: {
      distance: Math.round(distance * 1.3),
      duration: Math.round((distance * 1.3) / subwaySpeed / 60) + 3,
    },
    taxi: {
      distance: Math.round(distance * 1.3),
      duration: Math.round((distance * 1.3) / taxiSpeed / 60),
      // 首爾計程車：基本 ₩4,800（1.6km 內），超過後 ₩763/km
      cost: Math.round(4800 + Math.max(0, (distance * 1.3) / 1000 - 1.6) * 763),
    },
    uber: {
      distance: Math.round(distance * 1.3),
      duration: Math.round((distance * 1.3) / taxiSpeed / 60),
      cost: Math.round(4800 + Math.max(0, (distance * 1.3) / 1000 - 1.6) * 763),
    }
  };
}

/**
 * 當景點順序變動後，重算該日的所有 transits
 */
export function recalculateDayTransits(day: DayPlan): Transit[] {
  const newTransits: Transit[] = [];

  for (let i = 0; i < day.spots.length - 1; i++) {
    const from = day.spots[i];
    const to = day.spots[i + 1];

    // 嘗試找回舊 transit 的 selectedMode
    const oldTransit = day.transits.find(
      t => t.fromSpotId === from.id && t.toSpotId === to.id
    );
    const selectedMode = oldTransit?.selectedMode || 'walking';

    newTransits.push({
      id: `t_${from.id}_${to.id}`,
      fromSpotId: from.id,
      toSpotId: to.id,
      selectedMode,
      estimates: estimateTransit(from, to),
    });
  }

  return newTransits;
}
