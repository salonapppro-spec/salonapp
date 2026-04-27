"use client";

import { motion } from "framer-motion";

const GOLD = "#C9A84C";

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={22} height={22}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const ClockAlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={22} height={22}>
    <circle cx="12" cy="12" r="9"/>
    <polyline points="12 7 12 12 15 15"/>
    <line x1="12" y1="17" x2="12" y2="17.5" strokeWidth="2.5"/>
  </svg>
);

const GemIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={22} height={22}>
    <polygon points="6 3 18 3 22 9 12 22 2 9"/>
    <polyline points="2 9 12 14 22 9"/>
    <line x1="12" y1="3" x2="12" y2="14"/>
  </svg>
);

const TrendingUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={22} height={22}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const cards = [
  {
    Icon: MoonIcon,
    title: "Край на съобщенията в 23:00 ч.",
    body: "Ти заслужаваш почивка, а не да си секретарка на собствения си бизнес. Докато ти релаксираш, SalonApp приема резервации 24/7. Просто се събуждаш с готов и подреден график за деня.",
  },
  {
    Icon: ClockAlertIcon,
    title: "Спри да плащаш за чужди грешки",
    body: "Всеки забравен час ти струва пари и нерви. Системата ни изпраща автоматични SMS напомняния 24 часа по-рано. Само един спасен клиент изплаща софтуера за месец напред.",
  },
  {
    Icon: GemIcon,
    title: "Излез от сянката на общите каталози",
    body: "Защо да плащаш комисионни, за да те сложат в списък до конкуренцията? Ние ти изграждаме собствен, луксозен уебсайт. Твоят салон, твоят бранд, твоите правила.",
  },
  {
    Icon: TrendingUpIcon,
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
      {cards.map(({ Icon, title, body }, i) => (
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
            <Icon />
          </div>
          <h3 className="text-lg font-black leading-snug text-[#1A1A1A]">
            {title}
          </h3>
          <p className="text-sm leading-relaxed text-[#1A1A1A]/60">
            {body}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
