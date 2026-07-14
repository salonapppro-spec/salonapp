"use client";

import { ServicesClient } from "@/app/admin/(protected)/services/services-client";
import { useDemo } from "@/lib/demo/store";

export default function DemoSettingsServicesPage() {
  const { state } = useDemo();

  return (
    <div className="max-w-5xl">
      <ServicesClient key={state.services.length} initialServices={state.services} />
    </div>
  );
}
