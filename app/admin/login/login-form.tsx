"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { formatAuthSignInError } from "@/lib/format-auth-sign-in-error";
import { createSupabaseBrowserClient } from "@/lib/supabase";

function isSafeInternalPath(next: string): boolean {
  if (!next.startsWith("/") || next.startsWith("//")) return false;
  if (next.startsWith("/admin/login")) return false;
  return next.startsWith("/admin") || next.startsWith("/super-admin");
}

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const superAdminOnly = searchParams.get("super_admin_only") === "1";
  const nextPath = searchParams.get("next") ?? "";
  const redirectToSuperAdmin = nextPath === "/super-admin" || nextPath.startsWith("/super-admin/");

  async function signOutOther() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при изход.");
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const emailTrimmed = email.trim();
      const { error: authErr } = await supabase.auth.signInWithPassword({ email: emailTrimmed, password });
      if (authErr) throw authErr;
      const next = searchParams.get("next");
      let dest = "/admin/dashboard";
      if (next && isSafeInternalPath(next)) {
        dest = next;
      } else {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user?.app_metadata?.role === "super_admin") {
          dest = "/super-admin";
        }
      }
      router.replace(dest);
      router.refresh();
    } catch (e) {
      setError(formatAuthSignInError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-gradient-to-br from-brand-50 via-[#FFF8F5] to-brand-100/80">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand-300/35 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-brand-400/25 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-lg flex-col justify-center px-4 safe-pt safe-pb sm:px-6">
        <div className="mb-8 text-center sm:mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">SalonApp.pro</p>
          <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-brand-900 sm:text-4xl">Админ панел</h1>
          <p className="mx-auto mt-2 max-w-sm text-pretty text-sm leading-relaxed text-brand-800/80 sm:text-base">
            {redirectToSuperAdmin ? (
              <>
                За <strong className="font-semibold text-brand-900">платформения панел</strong> няма отделен адрес за вход — ползваш същата страница. Влез с акаунта, на който в Supabase е зададена роля{" "}
                <code className="rounded bg-brand-100/90 px-1 text-xs">super_admin</code> в <strong className="font-medium">App metadata</strong>.
              </>
            ) : (
              <>
                Влез с имейла и паролата на салона. Ако нямаш достъп, помоли този, който ти е създал профила, да ти изпрати отново линк за парола.
              </>
            )}
          </p>
          {redirectToSuperAdmin ? (
            <p className="mx-auto mt-3 max-w-sm text-pretty text-xs leading-relaxed text-brand-700/90">
              Директен адрес на панела (след като си логнат/а с правилния акаунт): <span className="font-mono text-[11px] text-brand-800">/super-admin</span>
            </p>
          ) : null}
        </div>

        <div className="rounded-3xl border border-brand-200/70 bg-white/95 p-6 shadow-card-lg backdrop-blur-md sm:p-8">
          {superAdminOnly ? (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50/95 px-4 py-3 text-sm text-amber-950">
              <p className="font-medium">Супер админ изисква отделен акаунт</p>
              <p className="mt-1 text-amber-900/90">
                В момента си влязъл/а със салонски профил (без роля <code className="rounded bg-amber-100/80 px-1">super_admin</code> в Supabase). Излез и влез с акаунта, на който е зададена тази роля в{" "}
                <strong>Authentication → Users → App metadata</strong>.
              </p>
              <button
                type="button"
                className="btn-admin-primary mt-3 w-full text-sm sm:w-auto"
                disabled={loading}
                onClick={() => void signOutOther()}
              >
                Изход от текущия акаунт
              </button>
            </div>
          ) : null}
          {error ? (
            <div role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-900">
              {error}
            </div>
          ) : null}

          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <div>
              <label htmlFor="admin-email" className="text-sm font-medium text-brand-900">
                Имейл
              </label>
              <input
                id="admin-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                className="input-admin"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={error ? true : undefined}
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="text-sm font-medium text-brand-900">
                Парола
              </label>
              <input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="input-admin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error ? true : undefined}
              />
            </div>
            <button type="submit" className="btn-admin-primary w-full text-base" disabled={!email || !password || loading}>
              {loading ? "Влизане…" : "Вход"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-relaxed text-brand-800/70">
            Достъпът е само за упълномощени администратори на салона.
          </p>
        </div>
      </div>
    </div>
  );
}
