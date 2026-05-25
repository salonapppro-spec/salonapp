import { redirect } from "next/navigation";

// Работното Време се е преместило в Настройки → таб "Раб. Време"
export default function WorkingHoursRedirectPage() {
  redirect("/admin/settings/hours");
}
