"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type FaqItem = {
  q: string;
  a: string;
  accent?: "phone";
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <motion.svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ duration: 0.25 }}
      className="shrink-0 text-[#C9A84C]"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </motion.svg>
  );
}

function FaqRow({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[#1A1A1A]/8 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 py-5 text-left"
      >
        <span
          className="mr-1 h-[2px] w-4 shrink-0 transition-all duration-300"
          style={{ background: open ? "#C9A84C" : "rgba(26,26,26,0.15)" }}
        />
        <span className="flex-1 text-sm font-bold text-[#1A1A1A]/80">
          {item.q}
        </span>
        <ChevronIcon open={open} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 pl-9 pr-6 text-sm leading-relaxed text-[#1A1A1A]/50">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FaqAccordion({
  items,
}: {
  items: FaqItem[];
  sharp?: boolean;
}) {
  return (
    <div className="divide-y-0">
      {items.map((item) => (
        <FaqRow key={item.q} item={item} />
      ))}
    </div>
  );
}
