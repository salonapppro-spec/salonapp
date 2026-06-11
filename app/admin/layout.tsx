import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "SalonApp Admin",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "SalonApp Admin",
    statusBarStyle: "default",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#C8826A",
};

/** Login lives outside (protected) so it never gets AdminChrome; салонският UI е само под (protected). */
export default function AdminLayout(props: { children: React.ReactNode }) {
  return <>{props.children}</>;
}
