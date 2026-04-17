"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const GOLD = "#C9A84C";
const ROSE = "#C8826A";

const problems = [
  {
    num: "01",
    title: "Твоята лична витрина",
    body: "В големите сайтове си просто един номер сред много други и клиентите виждат конкуренцията до теб. Ние ти даваме собствен красив сайт и правим уеб дизайна безплатно. Качваме снимките и цените. Клиентката влиза и вижда само теб. Изглеждаш професионално и скъпо.",
    img: "/previews/p01.jpg",
  },
  {
    num: "02",
    title: "Дигитален график",
    body: "Пишат ти във Viber в 11 вечерта? Клиентите вече се записват сами от телефона си. А ако някоя клиентка ти звънне по телефона – имаш функция „Бърз час\". Пишеш само номера ѝ и системата сама попълва името. Календарът ти и сайтът се обновяват на секундата, без дублиране на часове!",
    img: "/previews/p02.jpg",
  },
  {
    num: "03",
    title: "Край на забравените часове",
    body: "Клиентката забравя за часа си, а ти губиш 50 лева, докато я чакаш. Сайтът праща автоматично съобщение 24 часа преди часа. Само един спасен клиент плаща целия софтуер за месеца.",
    img: "/previews/p03.jpg",
  },
  {
    num: "04",
    title: "Бизнес Калкулатор",
    body: "Работиш много, но накрая не знаеш колко е чистата печалба? Пишеш си наема и разходите. Системата сама пресмята всяка услуга и всички месечни отчети. Тя ти казва: „От този маникюр печелиш\", или „Тук работиш на загуба\".",
    img: "/previews/p04.jpg",
  },
];

const fadeUp = {
  hidden: { y: 60, opacity: 0 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  visible: { y: 0, opacity: 1, transition: { duration: 0.7, ease: "easeOut" as any } },
};

export default function ProblemsSection() {
  return (
    <section className="overflow-hidden">
      {problems.map((p, i) => {
        const isEven = i % 2 === 0;
        return (
          <div
            key={p.num}
            className={`grid md:grid-cols-2 ${isEven ? "" : ""}`}
            style={{ minHeight: "480px" }}
          >
            {/* Text block */}
            <motion.div
              className={`relative flex flex-col justify-center px-8 py-16 md:px-16 md:py-20 ${
                isEven ? "order-1 md:order-1" : "order-1 md:order-2"
              }`}
              style={{ background: isEven ? "#F5F5F0" : "#FFFFFF" }}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeUp}
            >
              {/* Giant background number */}
              <span
                className="pointer-events-none absolute right-6 top-4 select-none text-[130px] font-black leading-none md:text-[160px]"
                style={{ color: "rgba(201,168,76,0.07)", fontFamily: "Georgia, serif" }}
              >
                {p.num}
              </span>

              <div className="relative z-10">
                <span
                  className="mb-4 inline-block text-xs font-black uppercase tracking-[0.35em]"
                  style={{ color: ROSE }}
                >
                  {p.num}
                </span>
                <h3
                  className="mb-5 text-3xl font-black leading-tight text-[#1A1A1A] md:text-4xl"
                  style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                >
                  {p.title}
                </h3>
                <p className="max-w-md text-base leading-relaxed text-[#1A1A1A]/55">
                  {p.body}
                </p>
                <div
                  className="mt-8 h-[2px] w-12"
                  style={{ background: `linear-gradient(90deg, ${GOLD}, ${ROSE})` }}
                />
              </div>
            </motion.div>

            {/* Image placeholder */}
            <motion.div
              className={`relative overflow-hidden ${
                isEven ? "order-2 md:order-2" : "order-2 md:order-1"
              }`}
              style={{ background: "#E8E4DC", minHeight: "360px" }}
              initial={{ opacity: 0, x: isEven ? 60 : -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative h-full w-full" style={{ minHeight: "360px" }}>
                <Image
                  src={p.img}
                  alt={p.title}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </motion.div>
          </div>
        );
      })}
    </section>
  );
}
