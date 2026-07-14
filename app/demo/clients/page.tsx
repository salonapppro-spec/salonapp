"use client";

import { ClientsAdminClient } from "@/components/admin/ClientsAdminClient";
import { useDemo } from "@/lib/demo/store";

export default function DemoClientsPage() {
  const { state } = useDemo();

  return (
    <div className="admin-page-shell max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span
            className="inline-block rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-white"
            style={{ background: "linear-gradient(135deg, #C9A84C, #C8826A)" }}
          >
            👤 Клиенти
          </span>
          <h1
            className="mt-2 text-2xl font-black tracking-tight text-[#1A1A1A] sm:text-3xl"
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
          >
            Клиентска карта
          </h1>
          <p className="mt-1 text-sm text-[#1A1A1A]/45">
            История на посещенията, оборот и бележки за всеки клиент.
          </p>
        </div>
      </div>

      <ClientsAdminClient
        key={state.clients.length}
        initialClients={state.clients}
        searchQ=""
      />
    </div>
  );
}
