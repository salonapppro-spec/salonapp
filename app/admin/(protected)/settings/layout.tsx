import { SettingsTabNav } from "@/components/admin/SettingsTabNav";

const GOLD = "#C9A84C";
const ROSE = "#C8826A";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-10 sm:px-6 sm:pt-8">
      {/* Header */}
      <div className="max-w-3xl">
        <span
          className="inline-block rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-white"
          style={{ background: `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}
        >
          ⚙️ Настройки
        </span>
        <h1
          className="mt-2 text-2xl font-black tracking-tight text-[#1A1A1A] sm:text-3xl"
          style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
        >
          Настройки на салона
        </h1>
        <p className="mt-1 text-sm text-[#1A1A1A]/45">
          Лого, контакти, услуги, разходи, работно време и парола
        </p>
      </div>

      {/* Tab navigation */}
      <SettingsTabNav />

      {/* Tab content */}
      <div className="mt-6">{children}</div>
    </div>
  );
}
