import { redirect } from "next/navigation";

export default function SettingsCostsRedirect() {
  redirect("/admin/finances/overhead");
}
