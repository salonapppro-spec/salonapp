"use client";

import { FixedCostsSettingsForm } from "@/components/admin/FixedCostsSettingsForm";
import { useDemo } from "@/lib/demo/store";

export default function DemoFinancesOverheadPage() {
  const { state } = useDemo();

  return (
    <div className="max-w-3xl pt-6">
      <FixedCostsSettingsForm
        key={state.financialSettings.rent_eur}
        settings={state.financialSettings}
      />
    </div>
  );
}
