"use client";

import { Moon, AlarmClock, Gem, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const GOLD = "#C9A84C";

const cards = [
  {
    icon: Moon,
    title: "Край на съобщенията в 23:00 ч.",
    body: "Ти заслужаваш почивка, а не да си секретарка на собствения си бизнес. Докато ти релаксираш, SalonApp приема резервации 24/7. Просто се събуждаш с готов и подреден график за деня.",
  },
  {
    icon: AlarmClock,
    title: "Спри да плащаш за чужди грешки",
    body: "Всеки забравен час ти струва пари и нерви. Системата ни изпраща автоматични SMS напомняния 24 часа по-рано. Само един спасен клиент изплаща софтуера за месец напред.",
  },
  {
    icon: Gem,
    title: "Излез от сянката на общите каталози",
    body: "Защо да плащаш комисионни, за да те сложат в списък до конкуренцията? Ние ти изграждаме собствен, луксозен уебсайт. Твоят салон, твоят бранд, твоите правила.",
  },
  {
    icon: TrendingUp,
    title: "Знаеш ли точно колко печелиш?",
    body: "Работиш нон-стоп, но сметките се губят из тефтерите. Нашият смарт калкулатор следи всеки приход и разход автоматично, за да знаеш винаги кои услуги ти носят най-голяма печалба.",
  },
];

const fadeUp = {
  hidden: { y: 40, opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transition: { duration: 0.6, ease: "easeOut" as any, delay: i * 0.1 },
  }),
};

export default function ProblemsSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={i}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            className="flex flex-col gap-4 rounded-2xl border border-[#1A1A1A]/8 bg-white p-7 shadow-sm"
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ background: `${GOLD}18` }}
            >
              <Icon size={22} style={{ color: GOLD }} strokeWidth={1.8} />
            </div>
            <h3 className="text-lg font-black leading-snug text-[#1A1A1A]">
              {card.title}
            </h3>
            <p className="text-sm leading-relaxed text-[#1A1A1A]/60">
              {card.body}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
