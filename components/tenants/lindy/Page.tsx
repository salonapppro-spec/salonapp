import type { SalonData } from "@/types/database";
import { Bloom } from "@/components/templates/Bloom";

export function LindySite({ data }: { data: SalonData }) {
  return <Bloom data={data} />;
}
