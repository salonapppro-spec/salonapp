import type { Booking, HairDensity, HairLength, Plan, Service, TimeSlot } from "@/types";

const LENGTH_IDX: Record<HairLength, 0 | 1 | 2> = { short: 0, medium: 1, long: 2 };
const DENSITY_IDX: Record<HairDensity, 0 | 1 | 2> = { thin: 0, medium: 1, thick: 2 };

/** Интерполационна матрица 3×3: тегло между min и max за всяка фаза. */
const COMPLEX_WEIGHT: number[][] = [
  [0, 0.25, 0.5],
  [0.25, 0.5, 0.75],
  [0.5, 0.75, 1],
];

export function timeToMinutes(t: string): number {
  const parts = t.split(":");
  const h = Number(parts[0] ?? 0);
  const m = Number(parts[1] ?? 0);
  return h * 60 + m;
}

export function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function lerpPhase(min: number | null | undefined, max: number | null | undefined, weight: number): number {
  const a = Number(min ?? 0);
  const b = Number(max ?? a);
  return a + weight * (b - a);
}

/**
 * Сложна услуга: active_start + waiting + active_finish чрез матрица short/medium/long × thin/medium/thick.
 */
export function calculateComplexDuration(
  service: Service,
  hairLength: HairLength,
  hairDensity: HairDensity
): { activeStart: number; waiting: number; activeFinish: number; totalMinutes: number } {
  const w = COMPLEX_WEIGHT[LENGTH_IDX[hairLength]][DENSITY_IDX[hairDensity]];
  const activeStart = lerpPhase(service.active_start_min, service.active_start_max, w);
  const waiting = lerpPhase(service.waiting_min, service.waiting_max, w);
  const activeFinish = lerpPhase(service.active_finish_min, service.active_finish_max, w);
  const totalMinutes = Math.round(activeStart + waiting + activeFinish);
  return {
    activeStart: Math.round(activeStart),
    waiting: Math.round(waiting),
    activeFinish: Math.round(activeFinish),
    totalMinutes,
  };
}

export function calculateDuration(
  service: Service,
  hairLength: HairLength,
  hairDensity: HairDensity
): { totalMinutes: number; waitingStart: number; waitingEnd: number } {
  if (!service.is_complex) {
    const totalMinutes = service.duration_minutes ?? 0;
    return { totalMinutes, waitingStart: 0, waitingEnd: 0 };
  }
  const c = calculateComplexDuration(service, hairLength, hairDensity);
  return {
    totalMinutes: c.totalMinutes,
    waitingStart: c.activeStart,
    waitingEnd: c.activeStart + c.waiting,
  };
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function mergeIntervals(intervals: Array<{ start: number; end: number }>): Array<{ start: number; end: number }> {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const out: Array<{ start: number; end: number }> = [];
  let cur = { ...sorted[0]! };
  for (let i = 1; i < sorted.length; i++) {
    const n = sorted[i]!;
    if (n.start <= cur.end) cur.end = Math.max(cur.end, n.end);
    else {
      out.push(cur);
      cur = { ...n };
    }
  }
  out.push(cur);
  return out;
}

function bookingBusyRange(
  b: { booking_time: string; booking_end_time?: string | null; service_duration: number },
  bufferMinutes: number
): { start: number; end: number } {
  const start = timeToMinutes(b.booking_time);
  if (b.booking_end_time) {
    return { start, end: timeToMinutes(b.booking_end_time) };
  }
  return { start, end: start + Number(b.service_duration) + bufferMinutes };
}

/** Само резервации — за магнитни точки (без blocked). */
function magneticTouchStarts(
  bookings: Array<{ booking_time: string; service_duration: number }>,
  bufferMinutes: number
): number[] {
  const out: number[] = [];
  for (const b of bookings) {
    const s = timeToMinutes(b.booking_time);
    out.push(s + Number(b.service_duration) + bufferMinutes);
  }
  return out;
}

function magneticTouchEnds(
  bookings: Array<{ booking_time: string; service_duration: number }>,
  bufferMinutes: number,
  serviceDuration: number
): number[] {
  const out: number[] = [];
  for (const b of bookings) {
    const nextStart = timeToMinutes(b.booking_time);
    out.push(nextStart - bufferMinutes - serviceDuration);
  }
  return out;
}

/** Първи начален момент на заетост при ≥ `fromMin` (край на нашия блок включително). */
function nextBusyStartFrom(merged: Array<{ start: number; end: number }>, fromMin: number, workEnd: number): number {
  let best = workEnd;
  for (const iv of merged) {
    if (iv.start >= fromMin && iv.start < best) best = iv.start;
  }
  return best;
}

export type SchedulingBookingInput = Pick<Booking, "booking_time" | "service_duration"> & {
  booking_end_time?: string | null;
  status?: string;
};

export function generateSlots(params: {
  workStart: string;
  workEnd: string;
  existingBookings: SchedulingBookingInput[];
  blockedSlots: Array<{ start_time: string; end_time: string }>;
  serviceDuration: number;
  bufferMinutes: number;
  slotInterval: number;
  magneticEnabled: boolean;
}): TimeSlot[] {
  const {
    workStart,
    workEnd,
    existingBookings,
    blockedSlots,
    serviceDuration,
    bufferMinutes,
    slotInterval,
    magneticEnabled,
  } = params;

  const dayStart = timeToMinutes(workStart);
  const dayEnd = timeToMinutes(workEnd);
  if (dayEnd <= dayStart || serviceDuration <= 0) return [];

  const activeBookings = existingBookings.filter(
    (b) => b.status !== "cancelled" && b.status !== "no_show"
  );

  const busyRaw: Array<{ start: number; end: number }> = [
    ...activeBookings.map((b) => bookingBusyRange(b, bufferMinutes)),
    ...blockedSlots.map((bl) => ({
      start: timeToMinutes(bl.start_time),
      end: timeToMinutes(bl.end_time),
    })),
  ];
  const mergedBusy = mergeIntervals(busyRaw);

  const occupancyEnd = serviceDuration + bufferMinutes;
  // Prevent leaving a gap too small to start even one more slot interval,
  // but do NOT use serviceDuration here — that incorrectly hides all valid
  // start times for long services that fill most of the day.
  const minFragment = slotInterval;

  const touchAfter = magneticTouchStarts(activeBookings, bufferMinutes);
  const touchAlignEnd = magneticTouchEnds(activeBookings, bufferMinutes, serviceDuration);

  const addMinutesToSlotTime = (time: string, durationMinutes: number): string => {
    const t = timeToMinutes(time);
    return minutesToTime(t + durationMinutes);
  };

  type Cand = TimeSlot & { _t: number; _mag: boolean };
  const candidates: Cand[] = [];

  for (let t = dayStart; t + serviceDuration <= dayEnd; t += slotInterval) {
    const tEndOcc = t + occupancyEnd;
    let hit = false;
    for (const iv of mergedBusy) {
      if (overlaps(t, tEndOcc, iv.start, iv.end)) {
        hit = true;
        break;
      }
    }
    if (hit) continue;

    const freeAfterOcc = nextBusyStartFrom(mergedBusy, tEndOcc, dayEnd) - tEndOcc;
    if (freeAfterOcc > 0 && freeAfterOcc < minFragment) continue;

    const time = minutesToTime(t);
    let mag = false;
    if (magneticEnabled) {
      mag =
        touchAfter.some((x) => x === t) ||
        touchAlignEnd.some((x) => x === t);
    }
    candidates.push({
      time,
      endTime: addMinutesToSlotTime(time, serviceDuration),
      magnetic: mag,
      available: true,
      _t: t,
      _mag: mag,
    });
  }

  candidates.sort((a, b) => {
    if (a._mag !== b._mag) return a._mag ? -1 : 1;
    return a._t - b._t;
  });

  return candidates.map((c) => {
    const { time, endTime, magnetic, available } = c;
    return { time, endTime, magnetic, available };
  });
}

export type ParallelServiceInput = {
  id: string;
  duration_minutes: number | null;
  is_complex: boolean;
};

/**
 * Паралелен прозорец по време на waiting (pro / premium / collective).
 * Без следваща резервация — прозорецът до workEnd.
 */
export function generateParallelSlots(params: {
  plan: Plan;
  workEndMin: number;
  waitingStartMin: number;
  waitingEndMin: number;
  nextBookingStartMin: number | null;
  bufferMinutes: number;
  services: ParallelServiceInput[];
}): { windowStartMin: number; windowEndMin: number; eligibleServiceIds: string[] } | null {
  const { plan, workEndMin, waitingStartMin, waitingEndMin, nextBookingStartMin, bufferMinutes, services } = params;
  if (plan !== "pro" && plan !== "premium" && plan !== "collective") return null;

  const windowStart = waitingStartMin;
  let windowEnd = waitingEndMin;
  if (nextBookingStartMin != null) {
    windowEnd = Math.min(waitingEndMin, nextBookingStartMin - bufferMinutes);
  } else {
    windowEnd = workEndMin;
  }
  if (windowEnd <= windowStart) return null;

  const len = windowEnd - windowStart;
  const eligibleServiceIds = services
    .filter((s) => !s.is_complex && (s.duration_minutes ?? 0) > 0 && (s.duration_minutes ?? 0) <= len)
    .map((s) => s.id);

  return { windowStartMin: windowStart, windowEndMin: windowEnd, eligibleServiceIds };
}
