import assert from "node:assert/strict";

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  assert.ok(value, `Missing required env var: ${name}`);
  return value;
}

export function optionalEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function buildAuthHeaders(prefix: string): HeadersInit {
  const bearer = optionalEnv(`${prefix}_BEARER`);
  const cookie = optionalEnv(`${prefix}_COOKIE`);
  const headers: Record<string, string> = {};

  if (bearer) {
    headers.Authorization = `Bearer ${bearer}`;
  }
  if (cookie) {
    headers.Cookie = cookie;
  }

  assert.ok(
    bearer || cookie,
    `Provide ${prefix}_BEARER or ${prefix}_COOKIE for authenticated integration tests.`
  );

  return headers;
}

export async function requestJson(
  url: string,
  opts?: {
    method?: HttpMethod;
    headers?: HeadersInit;
    body?: unknown;
  }
): Promise<{ status: number; bodyText: string; json: unknown | null }> {
  const method = opts?.method ?? "GET";
  const headers = new Headers(opts?.headers ?? {});

  if (opts?.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    method,
    headers,
    body: opts?.body === undefined ? undefined : JSON.stringify(opts.body),
  });

  const bodyText = await res.text();
  let json: unknown | null = null;
  if (bodyText) {
    try {
      json = JSON.parse(bodyText);
    } catch {
      json = null;
    }
  }

  return { status: res.status, bodyText, json };
}

export function assertDeniedOrEmpty(status: number, bodyText: string): void {
  const denied = status === 401 || status === 403 || status === 404;
  const empty = bodyText === "[]" || bodyText === "{}" || bodyText.includes('"data":[]');
  assert.ok(
    denied || empty,
    `Expected deny/empty result, got status=${status}, body=${bodyText.slice(0, 240)}`
  );
}

