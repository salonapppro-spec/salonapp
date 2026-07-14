'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type Variants,
} from 'framer-motion';

/* ── Анимационни variants ───────────────────────── */
const textContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const fromLeft: Variants = {
  hidden: { opacity: 0, x: -48 },
  show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.2, 0.85, 0.25, 1] } },
};

export default function HeroSection() {
  const reduce = useReducedMotion();

  /* ── 3D parallax с мишката ── */
  const wrapRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [11, -11]), { stiffness: 150, damping: 18 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-16, 16]), { stiffness: 150, damping: 18 });

  function handleMove(e: React.MouseEvent) {
    if (reduce || !wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }
  function handleLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <section className="relative overflow-hidden bg-[#F8EBDD]">
      {/* Gold dust — рендерира се само на сървъра (статичен), тук не се ползва */}

      <div className="relative mx-auto max-w-[1400px] flex flex-col lg:flex-row lg:items-center lg:min-h-[calc(100vh-57px)]">

        {/* ───────── ЛЯВА КОЛОНА: текст ───────── */}
        <motion.div
          variants={textContainer}
          initial="hidden"
          animate="show"
          className="relative z-10 flex flex-col justify-center px-8 py-12 md:px-12 lg:w-[52%] lg:pl-24 lg:pr-8"
        >
          {/* Badge */}
          <motion.div variants={fromLeft} className="mb-5 inline-flex items-center self-start rounded-full border border-[#E8DDD0] bg-[#EEE6DC] px-4 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#C79A4B]">
              Сайт и резервационна система за твоя салон
            </span>
          </motion.div>

          {/* H1 */}
          <motion.h1
            variants={fromLeft}
            className="playfair font-bold leading-[1.1] tracking-tight text-[#3D1F0A]"
            style={{ fontSize: 'clamp(2rem, 5vw, 5rem)' }}
          >
            Твоят бизнес заслужава
            <br />
            <span style={{ color: '#C79A4B' }}>повече от тефтер.</span>
          </motion.h1>

          {/* Paragraph */}
          <motion.p
            variants={fromLeft}
            className="mt-5 text-[15px] leading-relaxed text-[#5A5550]"
          >
            Спри да делиш клиентите си с конкуренцията. Получи собствен сайт и автоматизирана система за резервации.{' '}
            <strong className="text-[#3D1F0A]">
              Ние изграждаме всичко и настройваме услугите ти вместо теб – напълно безплатно.
            </strong>
          </motion.p>

          {/* Buttons */}
          <motion.div variants={fromLeft} className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/get-started"
              className="btn-pulse inline-flex min-h-[44px] items-center justify-center bg-[#C79A4B] px-6 text-[11px] font-semibold uppercase tracking-widest text-white transition hover:bg-[#A6823A]"
            >
              Заяви безплатна консултация и сайт
            </Link>
            <Link
              href="/demo"
              className="inline-flex min-h-[44px] items-center justify-center border border-[#3D1F0A]/30 px-6 text-[11px] font-semibold uppercase tracking-widest text-[#3D1F0A] transition hover:border-[#C79A4B] hover:text-[#C79A4B]"
            >
              Разгледай админ панела
            </Link>
            <a
              href="#demo"
              className="inline-flex min-h-[44px] items-center justify-center border border-[#3D1F0A]/30 px-6 text-[11px] font-semibold uppercase tracking-widest text-[#3D1F0A] transition hover:border-[#C79A4B] hover:text-[#C79A4B]"
            >
              Виж демо салон
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div variants={fromLeft} className="mt-6 flex flex-wrap gap-x-4 gap-y-2">
            {['Без банкова карта при регистрация', 'Без договори', 'Спираш, когато поискаш'].map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-sm text-[#5A5550]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C79A4B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {t}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* ───────── ДЯСНА КОЛОНА: изображение (Desktop) ───────── */}
        <div
          ref={wrapRef}
          className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center [perspective:1600px] relative"
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
        >
          {/* топъл блясък */}
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, delay: 0.7 }}
            className="pointer-events-none absolute inset-0 -z-10 blur-[34px]"
            style={{ background: 'radial-gradient(55% 55% at 55% 45%, rgba(201,154,94,0.28), transparent 70%)' }}
          />

          {/* parallax tilt */}
          <motion.div style={reduce ? undefined : { rotateX, rotateY, transformStyle: 'preserve-3d' }}>
            {/* entrance отдясно */}
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: 100, rotateY: -16, scale: 0.94 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, x: 0, rotateY: 0, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 0.85, 0.25, 1] }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* idle float */}
              <motion.div
                animate={reduce ? undefined : { y: [0, -12, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Image
                  src="/hero-mockup-clean.webp"
                  alt="SalonApp — сайт и приложение за салони"
                  width={1157}
                  height={1016}
                  priority
                  className="h-auto w-[110%] max-w-none drop-shadow-[36px_42px_56px_rgba(70,45,28,0.28)]"
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* ───────── Мобилен мокъп (под текста) ───────── */}
        <motion.div
          className="lg:hidden w-full px-4 pb-8 pt-2"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 32 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 0.85, 0.25, 1] }}
        >
          <Image
            src="/hero-mockup-clean.webp"
            alt="SalonApp — сайт и приложение за салони"
            width={1157}
            height={1016}
            priority
            className="h-auto w-full object-contain drop-shadow-[0_24px_40px_rgba(70,45,28,0.22)]"
          />
        </motion.div>
      </div>
    </section>
  );
}
