import type { SalonData } from "@/types/database";
import { Bloom } from "@/components/templates/Bloom";

export function EuphoriaSite({ data }: { data: SalonData }) {
  return <Bloom data={data} />;
}
