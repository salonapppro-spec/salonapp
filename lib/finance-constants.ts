export type CategorySlice = { category: string; emoji: string; amount: number; color: string };
export type MonthBar     = { label: string; revenue: number; expenses: number };
export type Transaction  = { id: string; date: string; label: string; amount: number; type: "in" | "out"; emoji: string };

export const EXPENSE_CATEGORIES: { value: string; emoji: string; color: string }[] = [
  { value: "🧴 Материали",    emoji: "🧴", color: "#f97316" },
  { value: "✂️ Инструменти", emoji: "✂️", color: "#8b5cf6" },
  { value: "☕ Хигиена",      emoji: "☕", color: "#06b6d4" },
  { value: "📢 Реклама",      emoji: "📢", color: "#ec4899" },
  { value: "🎓 Обучения",     emoji: "🎓", color: "#3b82f6" },
  { value: "🔹 Други",        emoji: "🔹", color: "#94a3b8" },
];
