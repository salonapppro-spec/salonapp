import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";

export default function SettingsPasswordPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <ChangePasswordForm />

      {/* Account hint */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: "rgba(201,168,76,0.06)",
          border: "1px solid rgba(201,168,76,0.2)",
        }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔐</span>
          <div>
            <h2 className="text-sm font-black text-[#1A1A1A]">Акаунт</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-[#1A1A1A]/45">
              За изход използвай{" "}
              <span className="font-semibold text-[#1A1A1A]/60">
                «Изход от акаунта»
              </span>{" "}
              в лентата вляво на десктоп или{" "}
              <span className="font-semibold text-[#1A1A1A]/60">«Изход»</span>{" "}
              в горния хедър на телефон. Ще трябва отново да влезеш с имейл и
              парола.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
