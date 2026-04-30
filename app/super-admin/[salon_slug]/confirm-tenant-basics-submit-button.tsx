"use client";

import type { MouseEvent } from "react";

type ConfirmTenantBasicsSubmitButtonProps = {
  tenantName: string;
  currentPlan: string;
  currentStatus: string;
};

export function ConfirmTenantBasicsSubmitButton({
  tenantName,
  currentPlan,
  currentStatus,
}: ConfirmTenantBasicsSubmitButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    const form = event.currentTarget.form;
    if (!form) return;

    const formData = new FormData(form);
    const newPlan = String(formData.get("plan") ?? "");
    const newStatus = String(formData.get("status") ?? "");

    const changes: string[] = [];
    if (newPlan && newPlan !== currentPlan) {
      changes.push(`- План: ${currentPlan} -> ${newPlan}`);
    }
    if (newStatus && newStatus !== currentStatus) {
      changes.push(`- Статус: ${currentStatus} -> ${newStatus}`);
    }

    if (changes.length === 0) return;

    const confirmed = window.confirm(
      `Сигурен ли си, че искаш да промениш настройките за "${tenantName}"?\n\n${changes.join("\n")}`
    );
    if (!confirmed) {
      event.preventDefault();
    }
  };

  return (
    <button
      type="submit"
      onClick={handleClick}
      className="rounded-lg bg-white px-5 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-100"
    >
      ✓ Запази промените
    </button>
  );
}
