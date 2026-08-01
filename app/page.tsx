"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, Circle } from "lucide-react";
import type { Devoir, GameStats } from "@/lib/types";
import { getDevoirs, saveDevoirs, getGameStats, saveGameStats } from "@/lib/storage";
import { getMatiereConfig } from "@/lib/constants";
import { updateStreak } from "@/lib/streak";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}
function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}
function getTodayFr() {
  const s = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function streakLabel(streak: number): string {
  if (streak === 0) return "Commence ta série !";
  if (streak === 1) return "1 jour de suite ! 🔥";
  return `${streak} jours de suite ! 🔥`;
}

export default function HomePage() {
  const [devoirs, setDevoirs] = useState<Devoir[]>([]);
  const [stats, setStats] = useState<GameStats>({ coins: 0, totalCompleted: 0, lastActiveDate: "", streak: 0 });
  const [badges, setBadges] = useState<string[]>(["🌟 Premier pas"]);
  const [loaded, setLoaded] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    setDevoirs(getDevoirs());
    const rawStats = getGameStats();
    const updated = updateStreak(rawStats);
    saveGameStats(updated);
    setStats(updated);
    const stored = localStorage.getItem("alma_badges");
    if (stored) setBadges(JSON.parse(stored) as string[]);
    setLoaded(true);
  }, []);

  const today = todayStr();
  const tomorrow = tomorrowStr();

  const devoirsAujourdhui = devoirs.filter((d) => d.dueDate === today);
  const devoirsDemain = devoirs.filter((d) => d.dueDate === tomorrow);
  const nextPending = devoirsAujourdhui.find((d) => !d.completed);

  const toggle = (id: string) => {
    const updated = devoirs.map((d) =>
      d.id === id ? { ...d, completed: !d.completed } : d
    );
    setDevoirs(updated);
    saveDevoirs(updated);
  };

  const badgeSlots = [
    ...badges.slice(0, 3),
    ...Array(Math.max(0, 3 - badges.length)).fill("???"),
  ].slice(0, 3);

  if (!loaded) return null;

  return (
    <div className="px-4 pt-4 pb-4 max-w-md mx-auto">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between mb-3">
        <motion.div
          key={stats.coins}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
        >
          🪙 {stats.coins}
        </motion.div>
        <span className="text-xs font-bold tracking-widest" style={{ color: "#c084fc" }}>
          ALMA
        </span>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-base"
          style={{ background: "linear-gradient(135deg, #ec4899, #8b5cf6)" }}
        >
          👧
        </div>
      </div>

      {/* ── HERO CARD ── */}
      <div
        className="rounded-3xl mb-3 text-center overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #1a0540 0%, #2d0e6e 50%, #4a1580 100%)",
          padding: "16px",
        }}
      >
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#e9d5ff" }}>
          Bonjour ALMA 👋
        </p>
        <p className="text-lg font-extrabold text-white mb-3">{getTodayFr()}</p>

        <motion.div
          className="text-6xl mb-3 inline-block"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          🐱
        </motion.div>

        <div
          className="rounded-2xl py-2 px-4 text-sm font-semibold text-white w-fit mx-auto mb-3"
          style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}
        >
          Tu as {devoirsAujourdhui.length} devoir
          {devoirsAujourdhui.length !== 1 ? "s" : ""} aujourd&apos;hui !
        </div>

        <div className="flex justify-center">
          <motion.div
            className="relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
          >
            {stats.streak > 0 && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
                animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <span className="relative">{streakLabel(stats.streak)}</span>
          </motion.div>
        </div>
      </div>

      {/* ── LEVEL BAR ── */}
      <div className="mb-4 px-1">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm font-bold" style={{ color: "#c084fc" }}>Niveau 2</span>
          <span className="text-xs" style={{ color: "#a78bfa" }}>10 pts → niveau 3</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div
            className="h-full rounded-full"
            style={{ width: "72%", background: "linear-gradient(90deg, #8b5cf6, #ec4899)" }}
          />
        </div>
      </div>

      {/* ── DÉFIS DU JOUR ── */}
      <div className="mb-5">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#f9a8d4" }}>
          🎯 Défis du jour
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <div
            className="rounded-2xl p-3"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(192,132,252,0.3)" }}
          >
            {nextPending ? (
              <>
                <p className="text-xs font-bold text-white mb-0.5 truncate">{nextPending.matiere}</p>
                <p className="text-xs truncate" style={{ color: "#a78bfa" }}>{nextPending.titre}</p>
              </>
            ) : (
              <>
                <p className="text-xs font-bold text-white mb-0.5">Tout fait !</p>
                <p className="text-xs" style={{ color: "#a78bfa" }}>Bravo 🎉</p>
              </>
            )}
            <p className="text-xs font-bold mt-1.5" style={{ color: "#f59e0b" }}>+10 🪙</p>
          </div>
          <div
            className="rounded-2xl p-3"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(192,132,252,0.3)" }}
          >
            <p className="text-xs font-bold text-white mb-0.5">✅ Mission 1</p>
            <p className="text-xs" style={{ color: "#a78bfa" }}>Terminée !</p>
            <p className="text-xs font-bold mt-1.5" style={{ color: "#a78bfa" }}>+5 pts ⭐</p>
          </div>
        </div>
      </div>

      {/* ── AUJOURD'HUI ── */}
      <div className="mb-5">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#f9a8d4" }}>
          📖 Aujourd&apos;hui
        </h2>
        {devoirsAujourdhui.length === 0 ? (
          <p className="text-center py-3 text-sm" style={{ color: "#a78bfa" }}>Aucun devoir 🎉</p>
        ) : (
          <div className="flex flex-col gap-2">
            {devoirsAujourdhui.map((d) => {
              const cfg = getMatiereConfig(d.matiere);
              return (
                <div
                  key={d.id}
                  className={`rounded-[20px] p-4 flex items-center gap-3 transition-opacity ${d.completed ? "opacity-40" : ""}`}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(139,92,246,0.25)" }}
                >
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${cfg.dot}`} />
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full opacity-90 ${cfg.badge}`}>
                      {d.matiere}
                    </span>
                    <p className={`font-semibold mt-1.5 text-sm text-white ${d.completed ? "line-through" : ""}`}>
                      {d.titre}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock size={12} style={{ color: "#a78bfa" }} />
                      <span className="text-xs" style={{ color: "#a78bfa" }}>{d.duree}</span>
                    </div>
                  </div>
                  <button onClick={() => toggle(d.id)} className="flex-shrink-0 active:scale-90 transition-transform">
                    {d.completed
                      ? <CheckCircle2 size={28} className="text-green-400" />
                      : <Circle size={28} style={{ color: "rgba(255,255,255,0.3)" }} />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── DEMAIN ── */}
      <div className="mb-5">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#f9a8d4" }}>
          🌙 Demain
        </h2>
        {devoirsDemain.length === 0 ? (
          <p className="text-center py-3 text-sm" style={{ color: "#a78bfa" }}>Aucun devoir pour demain</p>
        ) : (
          <div className="flex flex-col gap-2">
            {devoirsDemain.map((d) => {
              const cfg = getMatiereConfig(d.matiere);
              return (
                <div
                  key={d.id}
                  className="rounded-[20px] p-4 flex items-center gap-3"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(139,92,246,0.25)" }}
                >
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${cfg.dot}`} />
                  <div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full opacity-90 ${cfg.badge}`}>
                      {d.matiere}
                    </span>
                    <p className="text-sm mt-1" style={{ color: "#a78bfa" }}>{d.titre}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── BADGES ── */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#f9a8d4" }}>
          🏅 Mes badges
        </h2>
        <div className="flex gap-2 flex-wrap">
          {badgeSlots.map((badge, i) => (
            <span
              key={i}
              className="text-xs px-3 py-1.5 rounded-full font-semibold"
              style={
                badge === "???"
                  ? { background: "rgba(255,255,255,0.08)", color: "#6b7280" }
                  : { background: "rgba(139,92,246,0.25)", color: "#e9d5ff" }
              }
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
