export default function AdminProtectedLoading() {
  return (
    <div className="admin-page-shell max-w-6xl animate-pulse">
      <div className="mb-6 space-y-3">
        <div className="h-3 w-28 rounded-full bg-[#C9A84C]/25" />
        <div className="h-8 w-56 rounded-xl bg-[#1A1A1A]/10" />
        <div className="h-4 w-72 rounded-full bg-[#1A1A1A]/10" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-28 rounded-2xl border border-[#C9A84C]/20 bg-white/80" />
        <div className="h-28 rounded-2xl border border-[#C9A84C]/20 bg-white/80" />
        <div className="h-28 rounded-2xl border border-[#C9A84C]/20 bg-white/80" />
      </div>

      <div className="mt-6 rounded-2xl border border-[#C9A84C]/15 bg-white/75 p-4">
        <div className="mb-4 h-5 w-40 rounded-lg bg-[#1A1A1A]/10" />
        <div className="space-y-3">
          <div className="h-14 rounded-xl bg-[#1A1A1A]/8" />
          <div className="h-14 rounded-xl bg-[#1A1A1A]/8" />
          <div className="h-14 rounded-xl bg-[#1A1A1A]/8" />
          <div className="h-14 rounded-xl bg-[#1A1A1A]/8" />
        </div>
      </div>
    </div>
  );
}
