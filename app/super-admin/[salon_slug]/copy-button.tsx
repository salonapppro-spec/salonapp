"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="shrink-0 rounded-lg border border-neutral-600 px-4 py-2 text-sm font-semibold text-neutral-200 hover:bg-neutral-800"
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? "✓ Копирано" : "Копирай"}
    </button>
  );
}
