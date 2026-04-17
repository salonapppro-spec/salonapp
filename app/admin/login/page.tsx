import { Suspense } from "react";

import { AdminLoginForm } from "./login-form";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center text-sm text-brand-700">Зареждане…</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
