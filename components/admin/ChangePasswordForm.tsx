"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export function ChangePasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Паролата трябва да е поне 8 символа.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Паролите не съвпадат.");
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (updateError) {
      const msg = updateError.message.toLowerCase();
      if (msg.includes("different from the old password")) {
        setError("Новата парола трябва да е различна от старата.");
      } else {
        setError("Грешка при смяна на паролата. Опитай отново.");
      }
      return;
    }

    setDone(true);
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div
      className="mt-6 rounded-2xl p-5"
      style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)" }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">🔒</span>
        <div className="flex-1">
          <h2 className="text-sm font-black text-[#1A1A1A]">Смяна на парола</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-[#1A1A1A]/45">
            Въведи нова парола за твоя акаунт.
          </p>

          {done ? (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              ✓ Паролата е сменена успешно.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-3 space-y-3">
              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {error}
                </div>
              ) : null}
              <div>
                <label className="block text-xs font-medium text-[#1A1A1A]/60">Нова парола</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="input-admin mt-1"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#1A1A1A]/60">Потвърди паролата</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="input-admin mt-1"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-admin-primary"
              >
                {loading ? "Записване…" : "Смени паролата"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
