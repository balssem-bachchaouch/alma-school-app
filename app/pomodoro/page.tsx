"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Coffee, BookOpen } from "lucide-react";
import { getGameStats, saveGameStats } from "@/lib/storage";
import { addXP, XP_GAINS } from "@/lib/xp";

type Mode = "focus" | "break";

const MODES = {
  focus: { label: "Concentration", emoji: "🧠", duration: 25 * 60, color: "#7c3aed", bg: "linear-gradient(135deg, #7c3aed, #a855f7)", light: "#f5f3ff" },
  break: { label: "Pause", emoji: "☕", duration: 5 * 60, color: "#10b981", bg: "linear-gradient(135deg, #10b981, #34d399)", light: "#f0fdf4" },
};

function beep(freq = 440, dur = 200, vol = 0.3) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.value = vol;
    osc.start();
    osc.stop(ctx.currentTime + dur / 1000);
    setTimeout(() => ctx.close(), dur + 100);
  } catch {}
}

function celebrate() {
  beep(523, 150);
  setTimeout(() => beep(659, 150), 180);
  setTimeout(() => beep(784, 300), 360);
}

export default function PomodoroPage() {
  const [mode, setMode] = useState<Mode>("focus");
  const [remaining, setRemaining] = useState(MODES.focus.duration);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cfg = MODES[mode];
  const total = cfg.duration;
  const pct = ((total - remaining) / total) * 100;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const complete = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (mode === "focus") {
      celebrate();
      setSessions(s => s + 1);
      const stats = getGameStats();
      const newStats = { ...addXP(stats, XP_GAINS.pomodoro_complete), coins: stats.coins + 5, pomodorosCompleted: (stats.pomodorosCompleted ?? 0) + 1 };
      saveGameStats(newStats);
      showToast("🎉 Bravo ! +15 XP +5 🪙");
      setMode("break");
      setRemaining(MODES.break.duration);
    } else {
      beep(440, 200);
      showToast("☕ Pause terminée ! Prêt à reprendre ?");
      setMode("focus");
      setRemaining(MODES.focus.duration);
    }
  }, [mode]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) { complete(); return 0; }
          return r - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, complete]);

  const toggle = () => { beep(880, 80); setRunning(r => !r); };

  const reset = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRemaining(cfg.duration);
  };

  const switchMode = (m: Mode) => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setMode(m);
    setRemaining(MODES[m].duration);
  };

  const mins = String(Math.floor(remaining / 60)).padStart(2, "0");
  const secs = String(remaining % 60).padStart(2, "0");

  const circumference = 2 * Math.PI * 110;
  const dashOffset = circumference * (1 - pct / 100);

  return (
    <div className="pt-6 pb-28 px-4 max-w-sm mx-auto flex flex-col items-center">

      {/* Header */}
      <h1 className="text-2xl font-extrabold mb-1" style={{ color: "#3b0764" }}>⏱️ Pomodoro</h1>
      <p className="text-sm mb-6" style={{ color: "#8b5cf6" }}>Travaille 25 min, repose-toi 5 min</p>

      {/* Mode selector */}
      <div className="flex gap-2 mb-8 p-1 rounded-2xl" style={{ background: "rgba(139,92,246,0.08)" }}>
        {(["focus", "break"] as Mode[]).map(m => (
          <button key={m} onClick={() => switchMode(m)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={mode === m ? { background: MODES[m].color, color: "#fff" } : { color: MODES[m].color }}>
            {m === "focus" ? <BookOpen size={14} /> : <Coffee size={14} />}
            {MODES[m].label}
          </button>
        ))}
      </div>

      {/* Circular timer */}
      <div className="relative mb-8">
        <svg width={260} height={260} viewBox="0 0 260 260">
          {/* Background circle */}
          <circle cx={130} cy={130} r={110} fill="none" stroke={cfg.color + "20"} strokeWidth={12} />
          {/* Progress arc */}
          <motion.circle
            cx={130} cy={130} r={110}
            fill="none"
            stroke={cfg.color}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 130 130)"
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 0.3, ease: "linear" }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span className="text-4xl mb-1"
            animate={running ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}>
            {cfg.emoji}
          </motion.span>
          <motion.p
            key={remaining}
            className="text-5xl font-extrabold font-mono"
            style={{ color: cfg.color }}
            animate={{ scale: remaining % 60 === 0 && remaining !== total ? [1, 1.08, 1] : 1 }}
            transition={{ duration: 0.3 }}>
            {mins}:{secs}
          </motion.p>
          <p className="text-sm font-semibold mt-1" style={{ color: "#6b7280" }}>{cfg.label}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-8">
        <motion.button whileTap={{ scale: 0.88 }} onClick={reset}
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(139,92,246,0.1)", color: "#7c3aed" }}>
          <RotateCcw size={18} />
        </motion.button>

        <motion.button whileTap={{ scale: 0.9 }} onClick={toggle}
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-lg"
          style={{ background: cfg.bg, boxShadow: `0 8px 24px ${cfg.color}50` }}
          animate={running ? { boxShadow: [`0 8px 24px ${cfg.color}50`, `0 8px 32px ${cfg.color}80`, `0 8px 24px ${cfg.color}50`] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}>
          {running ? <Pause size={28} /> : <Play size={28} />}
        </motion.button>

        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(139,92,246,0.08)" }}>
          <span className="text-lg font-extrabold" style={{ color: "#7c3aed" }}>{sessions}</span>
        </div>
      </div>

      {/* Session counter */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-8 h-3 rounded-full transition-colors"
            style={{ background: i < sessions % 4 ? cfg.color : "rgba(139,92,246,0.15)" }} />
        ))}
      </div>

      {/* Tips */}
      <div className="w-full rounded-3xl p-4" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)" }}>
        <p className="text-xs font-extrabold mb-2" style={{ color: "#7c3aed" }}>💡 Conseils</p>
        <div className="flex flex-col gap-1.5">
          {["Éteins les notifications de ton téléphone 📵", "Prépare tout avant de lancer ✏️", "Tu gagnes +15 XP et +5🪙 par Pomodoro 🏆"].map((t, i) => (
            <p key={i} className="text-xs" style={{ color: "#6d28d9" }}>• {t}</p>
          ))}
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-bold text-white whitespace-nowrap"
            style={{ background: cfg.bg, boxShadow: `0 8px 24px ${cfg.color}60` }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
