/**
 * lib/meta-capi.ts — Meta Conversions API (server-side) за маркетинг сайта salonapp.pro
 *
 * Изпраща събития към Meta директно от сървъра (по-надеждно от браузър пиксела —
 * не се влияе от ad-blocker-и и iOS ограничения). Комбинира се с браузър пиксела:
 * двете събития носят един и същ `eventId` → Meta ги дедуплицира.
 *
 * Конфигурация (ТОКЕНЪТ Е ТАЕН — никога NEXT_PUBLIC):
 *   NEXT_PUBLIC_META_PIXEL_ID=...  # Pixel/Dataset ID (ползва се и от браузъра, и тук)
 *   META_CAPI_ACCESS_TOKEN=...     # от Events Manager → Settings → Conversions API (ТАЕН)
 *   META_CAPI_TEST_EVENT_CODE=...  # по избор, само за тестване в Events Manager
 *
 * Ако env липсва → функцията е no-op (нищо не се чупи преди да е конфигурирано).
 */
import crypto from "node:crypto";
import { clientIpFromHeaders } from "@/lib/rate-limit";
import { META_PIXEL_ID } from "@/lib/meta-pixel";

const GRAPH_VERSION = "v21.0";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/** Нормализира + хешира. Празни стойности → undefined (не се пращат). */
function hashEmail(email?: string | null): string | undefined {
  if (!email) return undefined;
  const norm = email.trim().toLowerCase();
  return norm ? sha256(norm) : undefined;
}

function hashPhone(phone?: string | null): string | undefined {
  if (!phone) return undefined;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return undefined;
  // BG нормализация: 0888... → 359888...; водещи нули махнати
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = "359" + digits.slice(1);
  return sha256(digits);
}

function hashName(name?: string | null): { fn?: string; ln?: string } {
  if (!name) return {};
  const parts = name.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return {};
  const fn = sha256(parts[0]);
  const ln = parts.length > 1 ? sha256(parts.slice(1).join(" ")) : undefined;
  return { fn, ln };
}

export interface MetaCapiUser {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
}

export interface MetaCapiParams {
  eventName: string; // напр. "Lead", "PageView", "Contact"
  eventId?: string; // за дедупликация с браузър пиксела (същия eventID)
  eventSourceUrl?: string;
  user?: MetaCapiUser;
  customData?: Record<string, unknown>;
  request?: Request; // за IP, User-Agent и _fbp/_fbc бисквитки
}

function readFbCookies(req?: Request): { fbp?: string; fbc?: string } {
  const cookie = req?.headers.get("cookie");
  if (!cookie) return {};
  const get = (name: string) =>
    cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))?.[1];
  return { fbp: get("_fbp"), fbc: get("_fbc") };
}

/**
 * Праща едно събитие към Meta CAPI. Никога не хвърля — при грешка само логва,
 * за да не блокира основния поток (напр. изпращане на форма).
 */
export async function sendMetaCapiEvent(
  params: MetaCapiParams
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const pixelId = META_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !token) return { ok: false, skipped: true };

  const { fbp, fbc } = readFbCookies(params.request);
  const { fn, ln } = hashName(params.user?.name);

  const userData: Record<string, unknown> = {};
  const em = hashEmail(params.user?.email);
  const ph = hashPhone(params.user?.phone);
  if (em) userData.em = [em];
  if (ph) userData.ph = [ph];
  if (fn) userData.fn = [fn];
  if (ln) userData.ln = [ln];
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;
  if (params.request) {
    const ua = params.request.headers.get("user-agent");
    const ip = clientIpFromHeaders(params.request.headers);
    if (ua) userData.client_user_agent = ua;
    if (ip) userData.client_ip_address = ip;
  }

  const event: Record<string, unknown> = {
    event_name: params.eventName,
    event_time: Math.floor(Date.now() / 1000),
    action_source: "website",
    user_data: userData,
  };
  if (params.eventId) event.event_id = params.eventId;
  if (params.eventSourceUrl) event.event_source_url = params.eventSourceUrl;
  if (params.customData) event.custom_data = params.customData;

  const payload: Record<string, unknown> = { data: [event] };
  const testCode = process.env.META_CAPI_TEST_EVENT_CODE;
  if (testCode) payload.test_event_code = testCode;

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[meta-capi] Graph API грешка:", res.status, text.slice(0, 300));
      return { ok: false, error: `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("[meta-capi] fetch грешка:", (e as Error).message);
    return { ok: false, error: (e as Error).message };
  }
}
