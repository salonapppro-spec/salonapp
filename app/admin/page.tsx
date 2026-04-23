import { redirect } from "next/navigation";

/** Точният път `/admin` няма UI — пазим линк „salonapp.pro/admin“ без 404. */
export default function AdminPage() {
  redirect("/admin/dashboard");
}
