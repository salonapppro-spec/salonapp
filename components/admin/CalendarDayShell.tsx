"use client";

import { useState } from "react";

import { BlockSlotModal } from "@/components/admin/BlockSlotModal";
import { ScheduleBoard } from "@/components/admin/ScheduleBoard";
import type { BlockedSlot, Booking, Plan, Service, Specialist, WorkingHours } from "@/types";

import { BlockedSlotsSection } from "@/components/admin/BlockedSlotsSection";
import { MinNoticeCard } from "@/components/admin/MinNoticeCard";

export function CalendarDayShell(props: {
  salonSlug: string;
  date: string;
  bookings: Booking[];
  blocked: BlockedSlot[];
  workingHours: WorkingHours | null;
  services: Service[];
  specialists: Specialist[];
  plan: Plan;
  minNoticeMinutes: number;
  bufferMinutes: number;
  bookingWindowDays: number;
  magneticScheduling: boolean;
}) {
  const [blockOpen, setBlockOpen] = useState(false);

  return (
    <>
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:opacity-80"
          style={{ borderColor: "rgba(201,168,76,0.3)", color: "rgba(26,26,26,0.65)", background: "white" }}
          onClick={() => setBlockOpen(true)}
        >
          🚫 Блокирай час
        </button>
      </div>
      <ScheduleBoard
        salonSlug={props.salonSlug}
        date={props.date}
        bookings={props.bookings}
        workingHours={props.workingHours}
        services={props.services}
        specialists={props.specialists}
        plan={props.plan}
        showFab
      >
        <div
          className="mt-4 rounded-2xl bg-white p-4 sm:p-5"
          style={{
            border: "1px solid rgba(201,168,76,0.18)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06)",
          }}
        >
          <h2 className="text-sm font-black uppercase tracking-[0.15em]" style={{ color: "#C9A84C" }}>
            🚫 Блокирани часове
          </h2>
          <BlockedSlotsSection blockedDate={props.date} initialSlots={props.blocked} />
        </div>
        <MinNoticeCard
          initialMinutes={props.minNoticeMinutes}
          initialBuffer={props.bufferMinutes}
          initialBookingWindow={props.bookingWindowDays}
          initialMagnetic={props.magneticScheduling}
        />
      </ScheduleBoard>
      {blockOpen ? (
        <BlockSlotModal
          blockedDate={props.date}
          initialSlots={props.blocked}
          workingHours={props.workingHours}
          bookingWindowDays={props.bookingWindowDays}
          onClose={() => setBlockOpen(false)}
        />
      ) : null}
    </>
  );
}
