import { redirect } from "next/navigation";

// Галерията се е преместила в Настройки → таб "Лого и снимки"
export default function GalleryRedirectPage() {
  redirect("/admin/settings/logo-images");
}
