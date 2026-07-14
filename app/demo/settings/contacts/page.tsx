"use client";

import { ContactsForm } from "@/components/admin/ContactsForm";
import { useDemo } from "@/lib/demo/store";

export default function DemoSettingsContactsPage() {
  const { state } = useDemo();

  return (
    <div className="max-w-3xl">
      <ContactsForm key={state.tenant.phone ?? ""} tenant={state.tenant} />
    </div>
  );
}
