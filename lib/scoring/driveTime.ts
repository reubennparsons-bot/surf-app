/**
 * Layer 7 — Drive time.
 *
 * Drive time adjusts ranking only — never `final_score`. The penalty is
 * baseline-relative (relative to the user's nearest viable spot) and capped
 * at DRIVE_TIME_PENALTY_CAP (15) so a meaningfully better wave further away
 * still wins.
 *
 *   extra_minutes        = max(0, spot_drive_minutes - baseline_drive_minutes)
 *   drive_penalty_points = min(cap, sqrt(extra_minutes / 60) × coefficient)
 *
 *   ranking_score        = final_score - drive_penalty_points
 *
 * v1: drive_minutes is estimated from haversine distance × an average road
 * speed. v2 may swap in a real routing API.
 */

import {
  DRIVE_TIME_AVG_ROAD_SPEED_KMH,
  DRIVE_TIME_PENALTY_CAP,
  DRIVE_TIME_PENALTY_COEFFICIENT,
} from '@/lib/config';
import { haversineKm } from '@/lib/utils/haversine';

export function estimatedDriveMinutes(
  userLat: number,
  userLng: number,
  spotLat: number,
  spotLng: number,
): number {
  const km = haversineKm(userLat, userLng, spotLat, spotLng);
  return (km / DRIVE_TIME_AVG_ROAD_SPEED_KMH) * 60;
}

export function drivePenaltyPoints(
  spotDriveMinutes: number,
  baselineDriveMinutes: number,
): number {
  const extra = Math.max(0, spotDriveMinutes - baselineDriveMinutes);
  const raw = Math.sqrt(extra / 60) * DRIVE_TIME_PENALTY_COEFFICIENT;
  return Math.min(DRIVE_TIME_PENALTY_CAP, raw);
}
