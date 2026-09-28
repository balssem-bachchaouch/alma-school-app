"use client";

import { useState } from "react";
import { HelpCircle, X } from "lucide-react";

export interface HelpSection {
  emoji: string;
  title: string;
  items: string[];
}

interface HelpButtonProps {
  pageTitle: string;
  sections: HelpSection[];
}

export default function HelpButton({ pageTitle, sections }: HelpButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
        style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }}
        title="Guide d'utilisation"
      >
        <HelpCircle size={17} strokeWidth={2.2} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
          style={{ background: "rgba(59,7,100,0.4)", backdropFilter: "blur(4px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl overflow-hidden"
            style={{
              background: "#ffffff",
              boxShadow: "0 20px 60px rgba(124,58,237,0.25)",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              }}
            >
              <div className="flex items-center gap-2">
                <HelpCircle size={18} className="text-white opacity-90" />
                <span className="font-extrabold text-white text-sm">Guide — {pageTitle}</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                <X size={14} className="text-white" />
              </button>
            </div>

            {/* Sections */}
            <div className="flex flex-col gap-0 px-5 py-4">
              {sections.map((s, i) => (
                <div
                  key={i}
                  className="py-3"
                  style={{
                    borderBottom: i < sections.length - 1
                      ? "1px solid rgba(139,92,246,0.1)"
                      : "none",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{s.emoji}</span>
                    <span className="font-bold text-sm" style={{ color: "#3b0764" }}>
                      {s.title}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-1.5 pl-1">
                    {s.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs" style={{ color: "#6d28d9" }}>
                        <span
                          className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: "#c4b5fd" }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
