import type { SalonData } from "@/types/database";
import { Bloom } from "@/components/templates/Bloom";

export function DemoSite({ data }: { data: SalonData }) {
  return <Bloom data={data} />;
}
