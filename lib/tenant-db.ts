import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

const TENANT_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type AnyRow = Record<string, unknown>;

function assertValidSlug(rawSlug: string): string {
  const slug = rawSlug.trim();
  if (!slug) {
    throw new Error("Tenant slug is required.");
  }
  if (!TENANT_SLUG_RE.test(slug)) {
    throw new Error(`Invalid tenant slug: ${rawSlug}`);
  }
  return slug;
}

function withTenantSlug<T extends AnyRow>(value: T, slug: string): T & { salon_slug: string } {
  return { ...value, salon_slug: slug };
}

export function tenantDb(rawSlug: string) {
  const salonSlug = assertValidSlug(rawSlug);
  const supabase = createSupabaseServiceRoleClient();
  const q = (table: string) => supabase.from(table as never);

  return {
    slug: salonSlug,
    services: {
      listAll() {
        return q("services").select("*").eq("salon_slug", salonSlug).order("created_at", { ascending: true });
      },
      listActive() {
        return q("services")
          .select("*")
          .eq("salon_slug", salonSlug)
          .eq("is_active", true)
          .order("created_at", { ascending: true });
      },
      getActiveById(serviceId: string) {
        return q("services")
          .select("*")
          .eq("salon_slug", salonSlug)
          .eq("id", serviceId)
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();
      },
      getById(serviceId: string) {
        return q("services").select("*").eq("salon_slug", salonSlug).eq("id", serviceId).maybeSingle();
      },
      deleteById(serviceId: string) {
        return q("services").delete().eq("salon_slug", salonSlug).eq("id", serviceId);
      },
      create(values: AnyRow) {
        return q("services").insert(withTenantSlug(values, salonSlug)).select("*").maybeSingle();
      },
      updateById(serviceId: string, values: AnyRow) {
        return q("services")
          .update(values)
          .eq("salon_slug", salonSlug)
          .eq("id", serviceId)
          .select("*")
          .maybeSingle();
      },
      getComplexFlag(serviceId: string) {
        return q("services")
          .select("is_complex")
          .eq("salon_slug", salonSlug)
          .eq("id", serviceId)
          .maybeSingle();
      },
    },
    clients: {
      list(search?: string) {
        let query = q("clients").select("*").eq("salon_slug", salonSlug).order("created_at", { ascending: false });
        if (search && search.trim()) {
          const term = `%${search.trim()}%`;
          query = query.or(`name.ilike.${term},phone.ilike.${term},email.ilike.${term}`);
        }
        return query.limit(200);
      },
      create(values: AnyRow) {
        return q("clients").insert(withTenantSlug(values, salonSlug)).select("*").maybeSingle();
      },
      getById(clientId: string) {
        return q("clients").select("*").eq("salon_slug", salonSlug).eq("id", clientId).maybeSingle();
      },
      updateById(clientId: string, patch: AnyRow) {
        return q("clients")
          .update(patch)
          .eq("salon_slug", salonSlug)
          .eq("id", clientId)
          .select("*")
          .maybeSingle();
      },
      deleteById(clientId: string) {
        return q("clients").delete().eq("salon_slug", salonSlug).eq("id", clientId);
      },
      lookupByPhone(phone: string) {
        return q("clients")
          .select("name,email")
          .eq("salon_slug", salonSlug)
          .eq("phone", phone)
          .maybeSingle();
      },
      /**
       * Слива клиент по уникален ключ (salon_slug, phone).
       * Използваме SELECT + UPDATE/INSERT вместо PostgREST `upsert(onConflict: …)`,
       * защото при някои инсталации composite upsert не се прилага надеждно и грешката остава скрита.
       */
      upsertByPhone(values: AnyRow) {
        const phoneRaw = String((values as { phone?: unknown }).phone ?? "").trim();
        const phone = phoneRaw.length > 0 ? phoneRaw : "00000";
        const row = withTenantSlug(
          {
            phone,
            name: String((values as { name?: unknown }).name ?? "").trim() || "Клиент",
            email: (values as { email?: string | null }).email ?? null,
            specialist_id: (values as { specialist_id?: string | null }).specialist_id ?? null,
            notes: (values as { notes?: string | null }).notes ?? null,
          } as AnyRow,
          salonSlug
        );
        return (async () => {
          const { data: exist, error: findErr } = await q("clients")
            .select("id")
            .eq("salon_slug", salonSlug)
            .eq("phone", phone)
            .maybeSingle();
          if (findErr) return { data: null, error: findErr };
          const existingId =
            exist && typeof exist === "object" && "id" in exist ? String((exist as { id: string }).id) : null;
          if (existingId) {
            return q("clients")
              .update({
                name: row.name,
                email: row.email ?? null,
                specialist_id: row.specialist_id ?? null,
              })
              .eq("id", existingId)
              .eq("salon_slug", salonSlug)
              .select("id")
              .maybeSingle();
          }
          return q("clients").insert(row).select("id").maybeSingle();
        })();
      },
    },
    bookings: {
      create(values: AnyRow) {
        return q("bookings").insert(withTenantSlug(values, salonSlug)).select("*").maybeSingle();
      },
      listByDate(date: string, specialistId?: string) {
        let query = q("bookings")
          .select("*")
          .eq("salon_slug", salonSlug)
          .eq("booking_date", date)
          .not("status", "in", "(cancelled,no_show)");
        if (specialistId) query = query.eq("specialist_id", specialistId);
        return query.order("booking_time", { ascending: true });
      },
      listByDates(dates: string[], specialistId?: string) {
        let query = q("bookings")
          .select("*")
          .eq("salon_slug", salonSlug)
          .in("booking_date", dates)
          .not("status", "in", "(cancelled,no_show)");
        if (specialistId) query = query.eq("specialist_id", specialistId);
        return query.order("booking_date", { ascending: true }).order("booking_time", { ascending: true });
      },
      listByDateAdmin(date: string, specialistId?: string) {
        let query = q("bookings").select("*").eq("salon_slug", salonSlug).eq("booking_date", date);
        if (specialistId) query = query.eq("specialist_id", specialistId);
        return query.order("booking_time", { ascending: true });
      },
      listByDatesAdmin(dates: string[], specialistId?: string) {
        let query = q("bookings").select("*").eq("salon_slug", salonSlug).in("booking_date", dates);
        if (specialistId) query = query.eq("specialist_id", specialistId);
        return query.order("booking_date", { ascending: true }).order("booking_time", { ascending: true });
      },
      listConflictRows(date: string, specialistId: string | null) {
        let query = q("bookings")
          // Keep this query schema-compatible with tenants where booking_end_time
          // is not present yet; overlap fallback uses booking_time + duration.
          .select("booking_time,service_duration,status")
          .eq("salon_slug", salonSlug)
          .eq("booking_date", date);
        query = specialistId ? query.eq("specialist_id", specialistId) : query.is("specialist_id", null);
        return query;
      },
      listByClientPhone(phone: string) {
        return q("bookings")
          .select("*")
          .eq("salon_slug", salonSlug)
          .eq("client_phone", phone)
          .order("booking_date", { ascending: false })
          .order("booking_time", { ascending: false })
          .limit(200);
      },
      updateById(bookingId: string, patch: AnyRow) {
        return q("bookings")
          .update(patch)
          .eq("salon_slug", salonSlug)
          .eq("id", bookingId)
          .select("*")
          .maybeSingle();
      },
      deleteById(bookingId: string) {
        return q("bookings").delete().eq("salon_slug", salonSlug).eq("id", bookingId);
      },
      anonymizeByPhone(phone: string, anonymizedPhone: string) {
        return q("bookings")
          .update({ client_name: "Анонимизиран", client_email: null, client_phone: anonymizedPhone })
          .eq("salon_slug", salonSlug)
          .eq("client_phone", phone);
      },
      listCompletedRevenue(dateFrom: string, dateTo: string, specialistId?: string | null) {
        let query = q("bookings")
          .select("service_price_eur")
          .eq("salon_slug", salonSlug)
          .eq("status", "completed")
          .gte("booking_date", dateFrom)
          .lte("booking_date", dateTo);
        if (specialistId) query = query.eq("specialist_id", specialistId);
        return query;
      },
      listCompletedAmounts(dateFrom: string, dateTo: string, specialistId?: string | null) {
        let query = q("bookings")
          .select("booking_date,service_price_eur")
          .eq("salon_slug", salonSlug)
          .eq("status", "completed")
          .gte("booking_date", dateFrom)
          .lte("booking_date", dateTo);
        if (specialistId) query = query.eq("specialist_id", specialistId);
        return query;
      },
    },
    blockedSlots: {
      listForPublicDate(date: string, specialistId?: string) {
        let query = q("blocked_slots").select("*").eq("salon_slug", salonSlug).eq("blocked_date", date);
        if (specialistId) query = query.or(`specialist_id.is.null,specialist_id.eq.${specialistId}`);
        else query = query.is("specialist_id", null);
        return query.order("start_time", { ascending: true });
      },
      listDefaultForDate(date: string) {
        return q("blocked_slots")
          .select("*")
          .eq("salon_slug", salonSlug)
          .eq("blocked_date", date)
          .is("specialist_id", null)
          .order("start_time", { ascending: true });
      },
      createDefault(values: AnyRow) {
        return q("blocked_slots")
          .insert(withTenantSlug({ ...values, specialist_id: null }, salonSlug))
          .select("*")
          .maybeSingle();
      },
      deleteById(slotId: string) {
        return q("blocked_slots").delete().eq("salon_slug", salonSlug).eq("id", slotId).select("id");
      },
    },
    workingHours: {
      getForDay(dayOfWeek: number, specialistId?: string) {
        let query = q("working_hours")
          .select("*")
          .eq("salon_slug", salonSlug)
          .eq("day_of_week", dayOfWeek)
          .limit(1);
        query = specialistId ? query.eq("specialist_id", specialistId) : query.is("specialist_id", null);
        return query.maybeSingle();
      },
      listSalonDefaultWeek() {
        return q("working_hours")
          .select("*")
          .eq("salon_slug", salonSlug)
          .is("specialist_id", null)
          .order("day_of_week", { ascending: true });
      },
      deleteSalonDefaultWeek() {
        return q("working_hours").delete().eq("salon_slug", salonSlug).is("specialist_id", null);
      },
      insertRows(rows: AnyRow[]) {
        return q("working_hours").insert(rows.map((row) => withTenantSlug(row, salonSlug)));
      },
    },
    financialSettings: {
      getOne() {
        return q("financial_settings").select("*").eq("salon_slug", salonSlug).limit(1).maybeSingle();
      },
      upsert(values: AnyRow) {
        return q("financial_settings")
          .upsert(withTenantSlug(values, salonSlug), { onConflict: "salon_slug" })
          .select("*")
          .maybeSingle();
      },
    },
    expenses: {
      listByRange(from: string, to: string) {
        return q("expenses")
          .select("*")
          .eq("salon_slug", salonSlug)
          .gte("date", from)
          .lte("date", to)
          .order("date", { ascending: false });
      },
      create(values: AnyRow) {
        return q("expenses").insert(withTenantSlug(values, salonSlug)).select("*").maybeSingle();
      },
      listByMonth(start: string, next: string) {
        return q("expenses")
          .select("*")
          .eq("salon_slug", salonSlug)
          .gte("date", start)
          .lt("date", next)
          .order("date", { ascending: false });
      },
    },
    gallery: {
      listAll() {
        return q("gallery").select("*").eq("salon_slug", salonSlug).order("order_index", { ascending: true });
      },
      listVisible() {
        return q("gallery")
          .select("*")
          .eq("salon_slug", salonSlug)
          .eq("is_visible", true)
          .order("order_index", { ascending: true });
      },
      count() {
        return q("gallery").select("*", { count: "exact", head: true }).eq("salon_slug", salonSlug);
      },
      create(values: AnyRow) {
        return q("gallery").insert(withTenantSlug(values, salonSlug)).select("*").maybeSingle();
      },
      updateById(id: string, values: AnyRow) {
        return q("gallery")
          .update(values)
          .eq("salon_slug", salonSlug)
          .eq("id", id)
          .select("*")
          .maybeSingle();
      },
      deleteById(id: string) {
        return q("gallery").delete().eq("salon_slug", salonSlug).eq("id", id);
      },
      updateOrderById(id: string, orderIndex: number) {
        return q("gallery").update({ order_index: orderIndex }).eq("salon_slug", salonSlug).eq("id", id);
      },
    },
    specialists: {
      listAll() {
        return q("specialists").select("*").eq("salon_slug", salonSlug).order("created_at", { ascending: true });
      },
      listActive() {
        return q("specialists")
          .select("*")
          .eq("salon_slug", salonSlug)
          .eq("is_active", true)
          .order("created_at", { ascending: true });
      },
      create(values: AnyRow) {
        return q("specialists").insert(withTenantSlug(values, salonSlug)).select("*").single();
      },
      updateById(id: string, values: AnyRow) {
        return q("specialists")
          .update(values)
          .eq("salon_slug", salonSlug)
          .eq("id", id)
          .select("*")
          .maybeSingle();
      },
      getById(id: string) {
        return q("specialists")
          .select("id,is_technical_admin")
          .eq("salon_slug", salonSlug)
          .eq("id", id)
          .maybeSingle();
      },
      deleteById(id: string) {
        return q("specialists").delete().eq("salon_slug", salonSlug).eq("id", id);
      },
    },
    emailLogs: {
      insert(values: AnyRow) {
        return q("email_logs").insert(withTenantSlug(values, salonSlug));
      },
      listSentRemindersForBookings(bookingIds: string[]) {
        return q("email_logs")
          .select("booking_id")
          .eq("salon_slug", salonSlug)
          .eq("type", "reminder")
          .eq("status", "sent")
          .in("booking_id", bookingIds);
      },
    },
    tenant: {
      getSalonName() {
        return q("tenants").select("salon_name").eq("salon_slug", salonSlug).maybeSingle();
      },
      updatePublicFields(values: AnyRow) {
        return q("tenants").update(values).eq("salon_slug", salonSlug);
      },
    },
    storage: {
      uploadImage(bucket: string, path: string, buffer: Buffer, contentType: string) {
        return supabase.storage.from(bucket).upload(path, buffer, { contentType, upsert: false });
      },
      getPublicUrl(bucket: string, path: string) {
        return supabase.storage.from(bucket).getPublicUrl(path);
      },
    },
  };
}

