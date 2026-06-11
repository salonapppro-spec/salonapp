import type { ReactNode } from "react";
import { FinancesTabNav } from "@/components/admin/FinancesTabNav";

export default function FinancesLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <FinancesTabNav />
      {children}
    </div>
  );
}
