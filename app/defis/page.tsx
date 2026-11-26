"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getDefis, saveDefis, getGameStats, saveGameStats } from "@/lib/storage";
import { addXP, XP_GAINS } from "@/lib/xp";
import type { DefiWeekly } from "@/lib/types";

const TYPE_ICONS: Record<string, string> = {
  devoirs: "📚", pomodoro: "⏱️", taches: "✅", flashcards: "🃏", streak: "🔥",
};

export default function DefisPage() {
  const [defis, setDefis] = useState<DefiWeekly[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    setDefis(getDefis());
  }, []);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  const updateProgress = (id: string, delta: number) => {
    const updated = defis.map(d => {
      if (d.id !== id || d.done) return d;
      const newProgress = Math.min(d.cible, d.progres + delta);
      const justDone = newProgress >= d.cible && !d.done;
      if (justDone) {
        const stats = getGameStats();
        const newStats = {
          ...addXP(stats, XP_GAINS.defi_complete),
          coins: stats.coins + d.recompense,
        };
        saveGameStats(newStats);
        showToast(`🎉 Défi complété ! +${d.recompense}🪙 +50 XP`);
      }
      return { ...d, progres: newProgress, done: newProgress >= d.cible };
    });
    setDefis(updated);
    saveDefis(updated);
  };

  const doneCount = defis.filter(d => d.done).length;
  const totalCoins = defis.filter(d => d.done).reduce((s, d) => s + d.recompense, 0);

  const weekStart = defis[0]?.weekStart ?? "";
  const weekLabel = weekStart
    ? new Date(weekStart + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
    : "";

  return (
    <div className="pt-6 pb-28 px-4 max-w-md mx-auto">
      {/* Header */}
      <h1 className="text-2xl font-extrabold mb-1" style={{ color: "#3b0764" }}>🎯 Défis de la semaine</h1>
      {weekLabel && (
        <p className="text-sm mb-5" style={{ color: "#8b5cf6" }}>Semaine du {weekLabel}</p>
      )}

      {/* Progress hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl p-5 mb-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", boxShadow: "0 8px 32px rgba(245,158,11,0.3)" }}>
        {["🏆", "⭐", "🎯", "✨"].map((e, i) => (
          <motion.span key={i} className="absolute text-xl opacity-20 select-none pointer-events-none"
            style={{ left: `${10 + i * 25}%`, top: "10%" }}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}>
            {e}
          </motion.span>
        ))}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-white/70 mb-1">Défis complétés</p>
            <p className="text-4xl font-extrabold text-white">{doneCount}/{defis.length}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-white/70 mb-1">Pièces gagnées</p>
            <p className="text-3xl font-extrabold text-white">🪙 {totalCoins}</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
          <motion.div className="h-full rounded-full" style={{ background: "rgba(255,255,255,0.9)" }}
            animate={{ width: `${(doneCount / Math.max(1, defis.length)) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }} />
        </div>
      </motion.div>

      {/* Defis list */}
      <div className="flex flex-col gap-3">
        {defis.map((defi, i) => {
          const pct = Math.round((defi.progres / defi.cible) * 100);

          return (
            <motion.div key={defi.id}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, type: "spring", stiffness: 280 }}
              className="rounded-3xl p-4 relative overflow-hidden"
              style={{
                background: defi.done ? "linear-gradient(135deg, #f0fdf4, #d1fae5)" : "#fff",
                border: `1.5px solid ${defi.done ? "#10b981" : "rgba(139,92,246,0.15)"}`,
                boxShadow: defi.done ? "0 4px 20px rgba(16,185,129,0.15)" : "0 2px 12px rgba(124,58,237,0.06)",
              }}>
              {defi.done && (
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                  style={{ background: "#10b981" }}>✓</div>
              )}
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl">{defi.emoji}</span>
                <div className="flex-1">
                  <p className="font-extrabold text-sm" style={{ color: defi.done ? "#065f46" : "#3b0764" }}>
                    {defi.titre}
                  </p>
                  <p className="text-xs" style={{ color: "#6b7280" }}>{defi.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-bold" style={{ color: "#d97706" }}>+{defi.recompense}🪙</span>
                  <br />
                  <span className="text-xs font-bold" style={{ color: "#7c3aed" }}>+50 XP</span>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-semibold" style={{ color: "#6b7280" }}>
                    {defi.progres}/{defi.cible} {TYPE_ICONS[defi.type]}
                  </span>
                  <span className="text-xs font-bold" style={{ color: defi.done ? "#10b981" : "#7c3aed" }}>
                    {pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(139,92,246,0.1)" }}>
                  <motion.div className="h-full rounded-full"
                    style={{ background: defi.done ? "#10b981" : "linear-gradient(90deg,#7c3aed,#ec4899)" }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5 }} />
                </div>
              </div>

              {!defi.done && (
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => updateProgress(defi.id, 1)}
                    className="flex-1 py-2 rounded-2xl text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
                    + 1 progrès
                  </motion.button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl p-3 text-center" style={{ background: "rgba(139,92,246,0.06)" }}>
        <p className="text-xs" style={{ color: "#8b5cf6" }}>
          🔄 Les défis se renouvellent chaque semaine automatiquement
        </p>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-bold text-white whitespace-nowrap"
            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
