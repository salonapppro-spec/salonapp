"use client";

import type { MouseEvent } from "react";

export function DeleteLeadButton({ leadId, salonName, action }: {
  leadId: string;
  salonName: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!window.confirm(`Изтрий заявката от "${salonName}"? Това не може да се върне.`)) {
      event.preventDefault();
    }
  };

  return (
    <form action={action}>
      <input type="hidden" name="lead_id" value={leadId} />
      <button
        type="submit"
        onClick={handleClick}
        className="rounded-lg border border-red-700/60 bg-red-950/30 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-900/40"
      >
        Изтрий заявка
      </button>
    </form>
  );
}
