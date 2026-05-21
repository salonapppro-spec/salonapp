import type { SalonData } from "@/types/database";
import { TheSkin } from "@/components/templates/TheSkin";

export function TheSkinSite({ data }: { data: SalonData }) {
  return <TheSkin data={data} />;
}
