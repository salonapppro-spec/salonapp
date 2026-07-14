import { DemoFinancesView } from "@/app/demo/finances/finances-view";

export default async function DemoFinancesPage(props: {
  searchParams?: Promise<{ y?: string; m?: string }>;
}) {
  const sp = await props.searchParams;
  const now = new Date();

  const year = Number(sp?.y) || now.getFullYear();
  const rawMonth = Number(sp?.m) || now.getMonth() + 1;
  const month = rawMonth >= 1 && rawMonth <= 12 ? rawMonth : now.getMonth() + 1;

  return <DemoFinancesView year={year} month={month} />;
}
