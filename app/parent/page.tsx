"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Devoir, Tache } from "@/lib/types";
import { getGameStats } from "@/lib/storage";
import { getLevelProgress } from "@/lib/xp";

const PIN = "1234";

export default function ParentPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [devoirs, setDevoirs] = useState<Devoir[]>([]);
  const [taches, setTaches] = useState<Tache[]>([]);
  const [stats, setStats] = useState<ReturnType<typeof getGameStats> | null>(null);
  const [loading, setLoading] = useState(false);

  const tryPin = () => {
    if (pin === PIN) { setUnlocked(true); setError(""); }
    else { setError("Code incorrect. Essaie encore !"); setPin(""); }
  };

  useEffect(() => {
    if (!unlocked) return;
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    Promise.all([
      fetch("/api/devoirs").then(r => r.ok ? r.json() : []),
      fetch("/api/taches").then(r => r.ok ? r.json() : []),
    ]).then(([d, t]) => {
      setDevoirs(d);
      setTaches(t);
      setStats(getGameStats());
      setLoading(false);
    });
  }, [unlocked]);

  if (!unlocked) {
    return (
      <div className="pt-16 pb-28 px-4 max-w-xs mx-auto flex flex-col items-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260 }}
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-6"
          style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)", boxShadow: "0 8px 32px rgba(124,58,237,0.3)" }}>
          👨‍👩‍👦
        </motion.div>
        <h1 className="text-2xl font-extrabold mb-2 text-center" style={{ color: "#3b0764" }}>Mode Parent</h1>
        <p className="text-sm text-center mb-8" style={{ color: "#6b7280" }}>Entre le code parent pour voir la progression</p>

        <div className="w-full flex flex-col gap-3">
          <div className="flex gap-2 justify-center mb-2">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="w-10 h-10 rounded-2xl border-2 flex items-center justify-center text-xl font-bold"
                style={{ borderColor: pin.length > i ? "#7c3aed" : "rgba(139,92,246,0.2)", color: "#7c3aed" }}>
                {pin.length > i ? "●" : ""}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k, i) => (
              <motion.button key={i} whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (k === "⌫") setPin(p => p.slice(0, -1));
                  else if (k && pin.length < 4) setPin(p => p + k);
                }}
                className="h-14 rounded-2xl font-extrabold text-lg disabled:opacity-30"
                style={k ? { background: "rgba(139,92,246,0.08)", color: "#3b0764" } : { opacity: 0 }}
                disabled={!k}>
                {k}
              </motion.button>
            ))}
          </div>

          {error && <p className="text-xs text-center font-bold" style={{ color: "#dc2626" }}>{error}</p>}

          <motion.button whileTap={{ scale: 0.94 }} onClick={tryPin}
            disabled={pin.length < 4}
            className="w-full py-3 rounded-2xl text-white font-bold disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
            Entrer
          </motion.button>
          <p className="text-xs text-center" style={{ color: "#9ca3af" }}>Code par défaut : 1234</p>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="flex justify-center items-center pt-24">
      <div className="w-8 h-8 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
    </div>
  );

  const today = new Date().toISOString().split("T")[0];
  const devoirsDuJour = devoirs.filter(d => d.dueDate === today);
  const devoirsFaits = devoirsDuJour.filter(d => d.completed).length;
  const devoirsEnRetard = devoirs.filter(d => !d.completed && d.dueDate < today).length;
  const tachesTerminees = taches.filter(t => t.statut === "Terminé").length;
  const level = stats ? getLevelProgress(stats.xp ?? 0) : null;

  return (
    <div className="pt-6 pb-28 px-4 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-extrabold" style={{ color: "#3b0764" }}>👨‍👩‍👦 Rapport Parent</h1>
        <button onClick={() => setUnlocked(false)}
          className="text-xs font-bold px-3 py-1.5 rounded-xl"
          style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626" }}>
          🔒 Verrouiller
        </button>
      </div>

      <p className="text-xs mb-5 font-semibold" style={{ color: "#6b7280" }}>
        📅 {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
      </p>

      {/* Level card */}
      {level && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-4 mb-4"
          style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", boxShadow: "0 8px 32px rgba(124,58,237,0.25)" }}>
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className="text-xs text-white/70 font-bold">Niveau de votre enfant</p>
              <p className="text-2xl font-extrabold text-white">Niveau {level.level} · {level.name}</p>
            </div>
            <span className="text-3xl">⭐</span>
          </div>
          <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
            <motion.div className="h-full rounded-full" style={{ background: "rgba(255,255,255,0.9)", width: `${level.pct}%` }} />
          </div>
          <p className="text-xs text-white/70 mt-1">{level.current}/{level.needed} XP pour le prochain niveau</p>
        </motion.div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { v: `${devoirsFaits}/${devoirsDuJour.length}`, l: "Devoirs du jour", c: "#7c3aed", e: "📚" },
          { v: devoirsEnRetard, l: "Devoirs en retard", c: devoirsEnRetard > 0 ? "#dc2626" : "#10b981", e: "⚠️" },
          { v: tachesTerminees, l: "Tâches terminées", c: "#10b981", e: "✅" },
          { v: stats?.streak ?? 0, l: "Jours de suite", c: "#f59e0b", e: "🔥" },
          { v: stats?.coins ?? 0, l: "Pièces gagnées", c: "#d97706", e: "🪙" },
          { v: stats?.pomodorosCompleted ?? 0, l: "Sessions focus", c: "#ec4899", e: "⏱️" },
        ].map(s => (
          <div key={s.l} className="rounded-2xl p-3"
            style={{ background: s.c + "10", border: `1px solid ${s.c}20` }}>
            <span className="text-xl">{s.e}</span>
            <p className="text-2xl font-extrabold mt-1" style={{ color: s.c }}>{s.v}</p>
            <p className="text-xs" style={{ color: "#6b7280" }}>{s.l}</p>
          </div>
        ))}
      </div>

      {/* Devoirs du jour détail */}
      {devoirsDuJour.length > 0 && (
        <div className="rounded-3xl p-4 mb-4" style={{ background: "#fff", border: "1px solid rgba(139,92,246,0.15)" }}>
          <p className="text-sm font-extrabold mb-3" style={{ color: "#3b0764" }}>📚 Devoirs d&apos;aujourd&apos;hui</p>
          <div className="flex flex-col gap-2">
            {devoirsDuJour.map(d => (
              <div key={d.id} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: d.completed ? "#d1fae5" : "rgba(139,92,246,0.1)" }}>
                  <span style={{ fontSize: 11 }}>{d.completed ? "✓" : "○"}</span>
                </div>
                <span className="text-sm flex-1" style={{ color: d.completed ? "#9ca3af" : "#3b0764",
                  textDecoration: d.completed ? "line-through" : "none" }}>
                  {d.matiere} — {d.titre}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl p-3 text-center" style={{ background: "rgba(139,92,246,0.06)" }}>
        <p className="text-xs" style={{ color: "#8b5cf6" }}>💡 Ce rapport est en lecture seule</p>
      </div>
    </div>
  );
}
