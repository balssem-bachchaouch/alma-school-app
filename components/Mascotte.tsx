"use client";

import { motion } from "framer-motion";
import type { TargetAndTransition, Transition } from "framer-motion";
import type { GameStats, Devoir } from "@/lib/types";

export type MascotteState = "happy" | "celebrate" | "sleeping" | "sad" | "normal";

export function getMascotteState(
  stats: GameStats,
  devoirs: Devoir[],
  celebrating: boolean
): MascotteState {
  if (celebrating) return "celebrate";

  const today = new Date().toISOString().split("T")[0];
  const todayDevoirs = devoirs.filter((d) => d.dueDate === today);
  if (todayDevoirs.length > 0 && todayDevoirs.every((d) => d.completed) && stats.streak > 0) {
    return "happy";
  }

  const last = stats.lastActiveDate;
  if (!last) return "normal";

  const diffDays = Math.floor(
    (new Date().setHours(0, 0, 0, 0) - new Date(last + "T00:00:00").getTime()) /
      (1000 * 60 * 60 * 24)
  );
  if (diffDays >= 2) return "sleeping";
  if (diffDays === 1) return "sad";

  return "normal";
}

export function getMascotteMessage(state: MascotteState, devoirs: Devoir[]): string {
  const today = new Date().toISOString().split("T")[0];
  const count = devoirs.filter((d) => d.dueDate === today && !d.completed).length;
  switch (state) {
    case "happy":    return "Bravo ! Tous les devoirs sont faits ! 🎉";
    case "celebrate": return "Nouveau badge débloqué ! 🏅";
    case "sleeping": return "Réveille-toi, tes devoirs t'attendent ! 😴";
    case "sad":      return "Allez, reprends ta série ! 💪";
    default:         return `Tu as ${count} devoir${count !== 1 ? "s" : ""} aujourd'hui !`;
  }
}

const FILTER: Record<MascotteState, string> = {
  happy:     "drop-shadow(0 0 16px rgba(250,204,21,0.8))",
  celebrate: "drop-shadow(0 0 16px rgba(250,204,21,0.8))",
  sleeping:  "brightness(0.7) grayscale(0.3)",
  sad:       "brightness(0.8) hue-rotate(200deg)",
  normal:    "drop-shadow(0 0 12px rgba(180,100,255,0.8))",
};

const ANIM: Record<MascotteState, TargetAndTransition> = {
  normal:    { scale: [1, 1.05, 1] },
  happy:     { y: [0, -12, 0, -12, 0, -12, 0] },
  celebrate: { rotate: [-10, 10, -10, 10, -10, 10, -10, 0] },
  sleeping:  { scale: [0.95, 1, 0.95] },
  sad:       { y: [0, 3, 0, 3, 0] },
};

const TRANS: Record<MascotteState, Transition> = {
  normal:    { duration: 3, repeat: Infinity, ease: "easeInOut" },
  happy:     { duration: 0.6, repeat: 2, ease: "easeInOut" },
  celebrate: { duration: 0.3, repeat: 3, ease: "easeInOut" },
  sleeping:  { duration: 2, repeat: Infinity, ease: "easeInOut" },
  sad:       { duration: 0.5, repeat: 2, ease: "easeInOut" },
};

interface MascotteProps {
  state: MascotteState;
}

export default function Mascotte({ state }: MascotteProps) {
  return (
    <div className="relative inline-block">
      <motion.div
        key={state}
        className="text-6xl inline-block select-none"
        style={{ filter: FILTER[state] }}
        animate={ANIM[state]}
        transition={TRANS[state]}
      >
        🐱
      </motion.div>
      {state === "sleeping" && (
        <motion.span
          className="absolute -top-4 -right-2 text-lg pointer-events-none"
          animate={{ y: [0, -8, 0], opacity: [1, 0.4, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          💤
        </motion.span>
      )}
      {state === "sad" && (
        <motion.span
          className="absolute -top-2 -right-1 text-sm pointer-events-none"
          animate={{ y: [0, 4, 0], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        >
          😢
        </motion.span>
      )}
    </div>
  );
}
