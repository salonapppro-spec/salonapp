import type { BlockedSlot, Booking, HairDensity, HairLength, Service, WorkingHours } from "@/types";

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
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

  // Minimal deterministic model: pick max range and add factor deltas.
  const baseStart = service.active_start_max ?? service.active_start_min ?? 0;
  const baseWait = service.waiting_max ?? service.waiting_min ?? 0;
  const baseFinish = service.active_finish_max ?? service.active_finish_min ?? 0;

  const lengthDelta = hairLength === "къса" ? 0 : hairLength === "средна" ? 10 : 20;
  const densityDelta = hairDensity === "рядка" ? 0 : hairDensity === "средна" ? 10 : 20;

  const totalMinutes = baseStart + baseWait + baseFinish + lengthDelta + densityDelta;
  const waitingStart = baseStart + Math.floor(lengthDelta / 2);
  const waitingEnd = waitingStart + baseWait + Math.floor(densityDelta / 2);

  return { totalMinutes, waitingStart, waitingEnd };
}

export function isMagneticSlot(time: string, bookings: Booking[], durationMinutes: number): boolean {
  const t = timeToMinutes(time);
  const end = t + durationMinutes;

  for (const b of bookings) {
    const bStart = timeToMinutes(b.booking_time);
    const bEnd = bStart + b.service_duration;
    // "Magnetic" if it touches an existing booking (before or after) without overlap.
    if (bEnd === t || end === bStart) return true;
  }
  return false;
}

export function getAvailableSlots(params: {
  date: string;
  service: Service;
  bookings: Booking[];
  blockedSlots: BlockedSlot[];
  workingHours: WorkingHours;
  bufferMinutes: number;
  magneticEnabled: boolean;
  hairLength?: HairLength;
  hairDensity?: HairDensity;
}): { time: string; type: "magnetic" | "available" | "unavailable" }[] {
  const { service, bookings, blockedSlots, workingHours, bufferMinutes, magneticEnabled, hairLength, hairDensity } = params;

  if (workingHours.is_day_off) return [];

  let durationMinutes = service.duration_minutes ?? 0;
  if (service.is_complex) {
    if (!hairLength || !hairDensity) return [];
    durationMinutes = calculateDuration(service, hairLength, hairDensity).totalMinutes;
  }

  const dayStart = timeToMinutes(workingHours.start_time);
  const dayEnd = timeToMinutes(workingHours.end_time);
  const step = 15;

  const busy: Array<{ start: number; end: number }> = [];

  for (const b of bookings) {
    const start = timeToMinutes(b.booking_time);
    const end = start + b.service_duration;
    busy.push({ start: start - bufferMinutes, end: end + bufferMinutes });
  }
  for (const bl of blockedSlots) {
    busy.push({ start: timeToMinutes(bl.start_time), end: timeToMinutes(bl.end_time) });
  }

  const slots: { time: string; type: "magnetic" | "available" | "unavailable" }[] = [];

  for (let t = dayStart; t + durationMinutes <= dayEnd; t += step) {
    const end = t + durationMinutes;
    let available = true;
    for (const b of busy) {
      if (overlaps(t, end, b.start, b.end)) {
        available = false;
        break;
      }
    }

    const time = minutesToTime(t);
    if (!available) {
      slots.push({ time, type: "unavailable" });
      continue;
    }

    const magnetic = magneticEnabled && isMagneticSlot(time, bookings, durationMinutes);
    slots.push({ time, type: magnetic ? "magnetic" : "available" });
  }

  return slots;
}

