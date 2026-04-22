"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import type { SalonData } from "@/types/database";
import type { HairDensity, HairLength, Specialist, TimeSlot } from "@/types";
import { salonPublicLogoUrl } from "@/components/templates/SalonSiteBrand";
import { CreateBookingSchema } from "@/schemas/booking";
import { createBooking } from "@/app/actions/booking";
import { StepSpecialist } from "@/components/booking/StepSpecialist";
import { StepService } from "@/components/booking/StepService";
import { StepComplexFactors } from "@/components/booking/StepComplexFactors";
import { StepDateTime } from "@/components/booking/StepDateTime";
import { StepContact } from "@/components/booking/StepContact";
import { StepConfirmation } from "@/components/booking/StepConfirmation";

type Phase = "specialist" | "service" | "complex" | "datetime" | "contact" | "confirm";

function formatDateInput(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function BookingFlow(props: { salonData: SalonData }) {
  const { salonData } = props;
  const { tenant, services: allServices } = salonData;
  const salonSlug = tenant.salon_slug;
  const headerLogo = salonPublicLogoUrl(tenant);

  const activeSpecs = useMemo(
    () => (salonData.specialists ?? []).filter((s: Specialist) => s.is_active),
    [salonData.specialists]
  );
  const needSpecialistStep = tenant.plan === "collective" && activeSpecs.length > 1;

  const [specialistId, setSpecialistId] = useState<string>(() => {
    if (tenant.plan === "collective" && activeSpecs.length === 1) return activeSpecs[0].id;
    return "";
  });

  const filteredServices = useMemo(() => {
    if (tenant.plan !== "collective") return allServices;
    if (!specialistId) return [];
    return allServices.filter((s) => !s.specialist_id || s.specialist_id === specialistId);
  }, [allServices, tenant.plan, specialistId]);

  const [phase, setPhase] = useState<Phase>(() => (needSpecialistStep ? "specialist" : "service"));
  const [serviceId, setServiceId] = useState("");
  const selectedService = useMemo(() => filteredServices.find((s) => s.id === serviceId) ?? null, [filteredServices, serviceId]);

  const [hairLength, setHairLength] = useState<HairLength | "">("");
  const [hairDensity, setHairDensity] = useState<HairDensity | "">("");

  const [date, setDate] = useState(() => formatDateInput(new Date()));
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [time, setTime] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setServiceId("");
    setTime("");
    setSlots([]);
  }, [specialistId]);

  useEffect(() => {
    setTime("");
    setSlots([]);
  }, [serviceId, date, hairLength, hairDensity]);

  const stepNumber = useMemo(() => {
    const map: Record<Phase, number> = {
      specialist: 1,
      service: 2,
      complex: 3,
      datetime: 4,
      contact: 5,
      confirm: 6,
    };
    return map[phase];
  }, [phase]);

  const specialistName = useMemo(() => {
    if (!specialistId) return undefined;
    return activeSpecs.find((s) => s.id === specialistId)?.name;
  }, [activeSpecs, specialistId]);

  const loadSlots = useCallback(async () => {
    if (!selectedService) return;
    if (tenant.plan === "collective" && !specialistId) return;
    if (selectedService.is_complex && (!hairLength || !hairDensity)) {
      setError("Изберете дължина и гъстота за тази услуга.");
      return;
    }
    setLoadingSlots(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        salon_slug: salonSlug,
        date,
        service_id: selectedService.id,
      });
      if (specialistId) qs.set("specialist_id", specialistId);
      if (selectedService.is_complex && hairLength && hairDensity) {
        qs.set("hair_length", hairLength);
        qs.set("hair_density", hairDensity);
      }
      const res = await fetch(`/api/availability?${qs.toString()}`);
      const json = (await res.json()) as { slots?: TimeSlot[]; error?: string };
      if (!res.ok) throw new Error(json?.error ?? "Грешка при часовете.");
      setSlots(json.slots ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка");
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedService, salonSlug, date, specialistId, tenant.plan, hairLength, hairDensity]);

  const lookupClient = useCallback(async () => {
    const p = phone.trim();
    if (p.length < 5) return;
    setLookupStatus("loading");
    try {
      const qs = new URLSearchParams({ salon_slug: salonSlug, phone: p });
      const res = await fetch(`/api/clients/lookup?${qs.toString()}`);
      const json = (await res.json()) as { name: string | null; error?: string };
      if (!res.ok) throw new Error(json?.error ?? "lookup failed");
      if (json.name) setName(json.name);
      setLookupStatus("done");
    } catch {
      setLookupStatus("error");
    }
  }, [phone, salonSlug]);

  function goNext() {
    setError(null);
    if (phase === "specialist") {
      if (!specialistId) {
        setError("Изберете специалист.");
        return;
      }
      setPhase("service");
      return;
    }
    if (phase === "service") {
      if (!selectedService) {
        setError("Изберете услуга.");
        return;
      }
      setPhase(selectedService.is_complex ? "complex" : "datetime");
      return;
    }
    if (phase === "complex") {
      if (!hairLength || !hairDensity) {
        setError("Попълнете характеристиките.");
        return;
      }
      setPhase("datetime");
      return;
    }
    if (phase === "datetime") {
      if (!time) {
        setError("Изберете час.");
        return;
      }
      setPhase("contact");
      return;
    }
    if (phase === "contact") {
      if (!name.trim() || !phone.trim()) {
        setError("Име и телефон са задължителни.");
        return;
      }
      setPhase("confirm");
    }
  }

  function goBack() {
    setError(null);
    if (phase === "confirm") {
      setPhase("contact");
      return;
    }
    if (phase === "contact") {
      setPhase("datetime");
      return;
    }
    if (phase === "datetime") {
      setPhase(selectedService?.is_complex ? "complex" : "service");
      return;
    }
    if (phase === "complex") {
      setPhase("service");
      return;
    }
    if (phase === "service") {
      if (needSpecialistStep) setPhase("specialist");
      return;
    }
  }

  async function submitBooking() {
    if (!selectedService) return;
    setSubmitting(true);
    setError(null);
    const payload = {
      salon_slug: salonSlug,
      specialist_id: specialistId || undefined,
      service_id: selectedService.id,
      booking_date: date,
      booking_time: time,
      client_name: name.trim(),
      client_phone: phone.trim(),
      client_email: email.trim() || undefined,
      notes: notes.trim() || undefined,
      hair_length: selectedService.is_complex && hairLength ? hairLength : undefined,
      hair_density: selectedService.is_complex && hairDensity ? hairDensity : undefined,
    };
    const parsed = CreateBookingSchema.safeParse(payload);
    if (!parsed.success) {
      setError("Невалидни данни за записване.");
      setSubmitting(false);
      return;
    }
    try {
      const result = await createBooking(parsed.data);
      if ("error" in result) throw new Error(result.error);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold text-emerald-900">Готово!</h1>
        <p className="mt-3 text-sm text-neutral-700">Часът е заявен. Ще получите потвърждение по имейл, ако сте го въвели.</p>
        <Link href={`/${salonSlug}`} className="mt-8 inline-block text-sm font-semibold text-brand-700 underline">
          Към сайта на салона
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <div className="flex items-center justify-between gap-2">
        <Link href={`/${salonSlug}`} className="text-sm text-brand-700 hover:underline">
          ← Назад
        </Link>
        <span className="text-xs text-neutral-500">
          Стъпка {stepNumber} от 6
        </span>
      </div>
      <div className="mt-4 flex items-start gap-3">
        {headerLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={headerLogo} alt="" width={48} height={48} className="mt-0.5 h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-black/10" />
        ) : null}
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-neutral-900">Запази час</h1>
          <p className="mt-1 text-sm text-neutral-600">{tenant.salon_name}</p>
        </div>
      </div>

      {error ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}

      <div className="mt-8">
        {phase === "specialist" ? (
          <StepSpecialist specialists={activeSpecs} value={specialistId} onChange={setSpecialistId} />
        ) : null}
        {phase === "service" ? (
          <StepService
            stepLabel={`Стъпка 2 от 6 — услуга`}
            services={filteredServices}
            value={serviceId}
            onChange={setServiceId}
          />
        ) : null}
        {phase === "complex" && selectedService ? (
          <StepComplexFactors
            stepLabel="Стъпка 3 от 6 — характеристики"
            hairLength={hairLength}
            hairDensity={hairDensity}
            onHairLength={setHairLength}
            onHairDensity={setHairDensity}
          />
        ) : null}
        {phase === "datetime" && selectedService ? (
          <StepDateTime
            stepLabel="Стъпка 4 от 6 — дата и час"
            date={date}
            onDateChange={setDate}
            slots={slots}
            loading={loadingSlots}
            selectedTime={time}
            onSelectTime={setTime}
            onRefreshSlots={loadSlots}
          />
        ) : null}
        {phase === "contact" ? (
          <StepContact
            stepLabel="Стъпка 5 от 6 — контакти"
            name={name}
            phone={phone}
            email={email}
            notes={notes}
            onName={setName}
            onPhone={setPhone}
            onEmail={setEmail}
            onNotes={setNotes}
            onPhoneLookup={lookupClient}
            lookupStatus={lookupStatus}
          />
        ) : null}
        {phase === "confirm" ? (
          <StepConfirmation
            stepLabel="Стъпка 6 от 6 — потвърждение"
            salonName={tenant.salon_name}
            specialistName={specialistName}
            service={selectedService}
            date={date}
            time={time}
            name={name}
            phone={phone}
            email={email}
          />
        ) : null}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {phase !== (needSpecialistStep ? "specialist" : "service") ? (
          <button type="button" onClick={goBack} className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium">
            Назад
          </button>
        ) : null}
        {phase !== "confirm" ? (
          <button type="button" onClick={goNext} className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">
            Напред
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            onClick={submitBooking}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Изпращане…" : "Потвърди записването"}
          </button>
        )}
      </div>
    </div>
  );
}
