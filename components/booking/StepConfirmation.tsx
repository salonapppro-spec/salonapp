"use client";

import type { Service } from "@/types";
import { suggestEmailFix } from "@/lib/email-typo";

export function StepConfirmation(props: {
  stepLabel: string;
  salonName: string;
  specialistName?: string;
  service: Service | null;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
}) {
  const { stepLabel, salonName, specialistName, service, date, time, name, phone, email } = props;
  const emailSuggestion = email ? suggestEmailFix(email) : null;
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-neutral-800">{stepLabel}</p>
      <div className=”rounded-xl border border-neutral-700 bg-neutral-800 p-4 text-sm”>
        <dl className=”space-y-2”>
          <div className=”flex justify-between gap-2”>
            <dt className=”text-neutral-400”>Салон</dt>
            <dd className=”font-medium text-neutral-100”>{salonName}</dd>
          </div>
          {specialistName ? (
            <div className=”flex justify-between gap-2”>
              <dt className=”text-neutral-400”>Специалист</dt>
              <dd className=”font-medium text-neutral-100”>{specialistName}</dd>
            </div>
          ) : null}
          {service ? (
            <div className=”flex justify-between gap-2”>
              <dt className=”text-neutral-400”>Услуга</dt>
              <dd className=”font-medium text-neutral-100”>{service.name}</dd>
            </div>
          ) : null}
          <div className=”flex justify-between gap-2”>
            <dt className=”text-neutral-400”>Дата и час</dt>
            <dd className=”font-medium text-neutral-100”>
              {date} {time}
            </dd>
          </div>
          <div className=”flex justify-between gap-2”>
            <dt className=”text-neutral-400”>Клиент</dt>
            <dd className=”font-medium text-neutral-100”>{name}</dd>
          </div>
          <div className=”flex justify-between gap-2”>
            <dt className=”text-neutral-400”>Телефон</dt>
            <dd className=”font-medium text-neutral-100”>{phone}</dd>
          </div>
          {email ? (
            <div className=”flex justify-between gap-2”>
              <dt className=”text-neutral-400”>Имейл</dt>
              <dd className=”font-medium text-neutral-100”>{email}</dd>
            </div>
          ) : null}
        </dl>
      </div>
      {email ? (
        <p className=”text-xs text-neutral-400”>
          Потвърждението ще бъде изпратено на <strong className=”text-neutral-200”>{email}</strong> — проверете дали е изписан вярно.
        </p>
      ) : null}
      {emailSuggestion ? (
        <p className=”rounded-lg bg-amber-400/20 px-3 py-2 text-xs font-medium text-amber-300”>
          ⚠ Възможна грешка в имейла — имахте предвид <strong>{emailSuggestion}</strong>? Върнете се назад, за да го коригирате.
        </p>
      ) : null}
      <p className=”text-xs text-neutral-400”>Натиснете „Потвърди записването”, за да изпратите заявката.</p>
    </div>
  );
}
