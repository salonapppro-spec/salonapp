"use client";

import type { MouseEvent } from "react";

type ArchiveTenantSubmitButtonProps = {
  actionKind: "archive" | "restore";
  salonName: string;
  className: string;
};

export function ArchiveTenantSubmitButton({ actionKind, salonName, className }: ArchiveTenantSubmitButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    const message =
      actionKind === "archive"
        ? `Сигурна ли си, че искаш да архивираш салон "${salonName}"?`
        : `Сигурна ли си, че искаш да възстановиш салон "${salonName}"?`;

    if (!window.confirm(message)) {
      event.preventDefault();
    }
  };

  return (
    <button type="submit" onClick={handleClick} className={className}>
      {actionKind === "archive" ? "Архивирай" : "Възстанови"}
    </button>
  );
}
