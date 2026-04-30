const DEFAULT_TO = "salonapppro@gmail.com";
const DEFAULT_FROM = "SalonApp <no-reply@salonapp.pro>";

type LeadNotificationPayload = {
  subject: string;
  lines: string[];
};

function recipientList(): string[] {
  const raw = process.env.LEADS_NOTIFY_TO ?? DEFAULT_TO;
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function sendLeadNotification(payload: LeadNotificationPayload): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn("[lead-notify] RESEND_API_KEY is missing; lead notification was skipped");
    return false;
  }

  const to = recipientList();
  if (to.length === 0) {
    console.warn("[lead-notify] recipient list is empty; lead notification was skipped");
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM ?? DEFAULT_FROM,
      to,
      subject: payload.subject,
      text: payload.lines.join("\n"),
    }),
  }).catch((error) => {
    console.error("[lead-notify] request failed", error);
    return null;
  });

  if (!response || !response.ok) {
    const errorText = response ? await response.text().catch(() => "") : "";
    console.error("[lead-notify] resend rejected notification", {
      status: response?.status ?? "network-error",
      body: errorText,
      to,
    });
    return false;
  }

  return true;
}
