import type { ReactNode } from "react";

import { FinancesTabNav } from "@/components/admin/FinancesTabNav";

export default function DemoFinancesLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <FinancesTabNav />
      {children}
    </div>
  );
}
