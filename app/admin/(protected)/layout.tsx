import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

import { AdminChrome } from "@/components/admin/AdminChrome";

async function AdminProtectedFrame(props: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) redirect("/admin/login");

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // read-only in some contexts
        }
      },
    },
  });

  const { data } = await supabase.auth.getSession();
  if (!data.session) redirect("/admin/login");

  return (
    <>
      <AdminChrome />
      <div className="md:pl-56">
        <div className="mx-auto max-w-6xl px-3 pb-36 pt-2 md:px-6 md:pb-8 md:pt-6">{props.children}</div>
      </div>
    </>
  );
}

export default function AdminProtectedGroupLayout(props: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-brand-50 via-brand-50 to-brand-100/90 text-brand-900">
      <AdminProtectedFrame>{props.children}</AdminProtectedFrame>
    </div>
  );
}
