/** Index 0 = Sunday … 6 = Saturday (matches JS Date.getDay()). */
export const DEFAULT_WORKING_HOURS_DAYS: Array<{ start_time: string; end_time: string; is_day_off: boolean }> = [
  { start_time: "09:00", end_time: "18:00", is_day_off: true }, // Sun
  { start_time: "09:00", end_time: "18:00", is_day_off: false },
  { start_time: "09:00", end_time: "18:00", is_day_off: false },
  { start_time: "09:00", end_time: "18:00", is_day_off: false },
  { start_time: "09:00", end_time: "18:00", is_day_off: false },
  { start_time: "09:00", end_time: "18:00", is_day_off: false },
  { start_time: "10:00", end_time: "14:00", is_day_off: false }, // Sat shorter
];
