"use client";

import type { MouseEvent } from "react";

type RestoreBackupButtonProps = {
  salonSlug: string;
  backupLabel: string;
  mode: "merge" | "replace";
  className: string;
};

export function RestoreBackupButton({ salonSlug, backupLabel, mode, className }: RestoreBackupButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    const message =
      mode === "replace"
        ? `ВНИМАНИЕ: Пълно възстановяване на "${salonSlug}" от бекъп ${backupLabel}.\n\nТекущите резервации, клиенти, услуги и настройки ще бъдат ЗАМЕНЕНИ със състоянието от бекъпа. Преди това автоматично се прави предпазен бекъп на текущото състояние.\n\nПродължаваш ли?`
        : `Възстановяване (само липсващи) на "${salonSlug}" от бекъп ${backupLabel}.\n\nЩе се добавят само записи, които в момента липсват — нищо няма да бъде изтрито или презаписано.\n\nПродължаваш ли?`;
    if (!window.confirm(message)) {
      event.preventDefault();
    }
  };

  return (
    <button type="submit" onClick={handleClick} className={className}>
      {mode === "replace" ? "Пълно възстановяване" : "Възстанови липсващи"}
    </button>
  );
}
