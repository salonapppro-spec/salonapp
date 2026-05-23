"use client";

import type { MouseEvent } from "react";

type DeleteTenantSubmitButtonProps = {
  salonName: string;
  salonSlug: string;
  className: string;
};

export function DeleteTenantSubmitButton({ salonName, salonSlug, className }: DeleteTenantSubmitButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    const confirmed = window.confirm(
      `ВНИМАНИЕ: Това ще изтрие ОКОНЧАТЕЛНО салон "${salonName}" (${salonSlug}) и всичките му данни.\n\nТова действие е необратимо. Сигурна ли си?`,
    );
    if (!confirmed) {
      event.preventDefault();
    }
  };

  return (
    <button type="submit" onClick={handleClick} className={className}>
      Изтрий
    </button>
  );
}
