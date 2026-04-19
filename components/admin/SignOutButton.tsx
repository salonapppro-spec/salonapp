"use client";

import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase";

type SignOutButtonProps = {
  /** Къде да те пренасочи след изход от Supabase Auth */
  redirectTo?: string;
  className?: string;
  children?: React.ReactNode;
};

export function SignOutButton(props: SignOutButtonProps) {
  const { redirectTo = "/admin/login", className, children = "Изход" } = props;
  const router = useRouter();

  async function logout() {
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <button type="button" onClick={() => void logout()} className={className}>
      {children}
    </button>
  );
}
