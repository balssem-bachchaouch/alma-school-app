"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Printer } from "lucide-react";
import type { Devoir, Tache, CoursParticulier } from "@/lib/types";
import { getMatiereConfig } from "@/lib/constants";
import { getGameStats } from "@/lib/storage";
import { getLevelProgress } from "@/lib/xp";

type Stats = {
  devoirs: { total: number; done: number; enRetard: number; parMatiere: Record<string, { total: number; done: number }> };
  taches: { total: number; terminee: number; enCours: number; aFaire: number; parType: Record<string, number> };
  cours: { totalSeances: number; seancesDone: number; revenus: Record<string, number> };
};

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: "rgba(139,92,246,0.1)" }}>
      <motion.div className="h-2 rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }} />
    </div>
  );
}

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <svg viewBox="0 0 100 10" className="w-full h-2.5">
      <rect x={0} y={0} width={100} height={10} rx={5} fill={color + "20"} />
      <motion.rect x={0} y={0} width={Math.max(0, Math.min(100, pct))} height={10} rx={5} fill={color}
        initial={{ width: 0 }} animate={{ width: Math.max(0, Math.min(100, pct)) }}
        transition={{ duration: 0.6, ease: "easeOut" }} />
    </svg>
  );
}

function DonutChart({ done, total, color }: { done: number; total: number; color: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? done / total : 0;
  return (
    <svg viewBox="0 0 88 88" width={88} height={88}>
      <circle cx={44} cy={44} r={r} fill="none" stroke={color + "20"} strokeWidth={10} />
      <motion.circle cx={44} cy={44} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeLinecap="round" strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ * (1 - pct) }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        transform="rotate(-90 44 44)" />
      <text x="44" y="48" textAnchor="middle" fontWeight="800" fontSize="16" fill={color}>
        {total > 0 ? Math.round(pct * 100) : 0}%
      </text>
    </svg>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [gameStats, setGameStats] = useState<ReturnType<typeof getGameStats> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setGameStats(getGameStats());
    Promise.all([
      fetch("/api/devoirs").then(r => r.ok ? r.json() : []) as Promise<Devoir[]>,
      fetch("/api/taches").then(r => r.ok ? r.json() : []) as Promise<Tache[]>,
      fetch("/api/cours").then(r => r.ok ? r.json() : []) as Promise<CoursParticulier[]>,
    ]).then(([devoirs, taches, cours]) => {
      const parMatiere: Record<string, { total: number; done: number }> = {};
      devoirs.forEach(d => {
        if (!parMatiere[d.matiere]) parMatiere[d.matiere] = { total: 0, done: 0 };
        parMatiere[d.matiere].total++;
        if (d.completed) parMatiere[d.matiere].done++;
      });

      const parType: Record<string, number> = {};
      taches.forEach(t => { parType[t.type] = (parType[t.type] ?? 0) + 1; });

      const revenus: Record<string, number> = {};
      let totalSeances = 0, seancesDone = 0;
      cours.forEach(c => {
        c.cycles.forEach(cy => {
          cy.seances.forEach(s => {
            totalSeances++;
            if (s.done) seancesDone++;
          });
          if (cy.montantPaye && cy.montantPaye > 0)
            revenus[c.devise] = (revenus[c.devise] ?? 0) + cy.montantPaye;
        });
      });

      setStats({
        devoirs: { total: devoirs.length, done: devoirs.filter(d => d.completed).length, enRetard: devoirs.filter(d => !d.completed && d.dueDate < today).length, parMatiere },
        taches: { total: taches.length, terminee: taches.filter(t => t.statut === "Terminé").length, enCours: taches.filter(t => t.statut === "En cours").length, aFaire: taches.filter(t => t.statut === "À faire").length, parType },
        cours: { totalSeances, seancesDone, revenus },
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const level = gameStats ? getLevelProgress(gameStats.xp ?? 0) : null;

  const handlePrint = () => {
    window.print();
  };

  if (loading) return (
    <div className="flex justify-center items-center pt-24">
      <div className="w-8 h-8 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
    </div>
  );

  return (
    <div className="pt-6 pb-28 px-4 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-extrabold" style={{ color: "#3b0764" }}>📊 Statistiques</h1>
        <motion.button whileTap={{ scale: 0.9 }} onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-bold print:hidden"
          style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }}>
          <Printer size={15} /> PDF
        </motion.button>
      </div>

      {/* XP Level card */}
      {level && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-4 mb-4 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${level.color}, ${level.color}cc)`, boxShadow: `0 8px 32px ${level.color}40` }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-white/70 font-bold uppercase tracking-wide">Ton niveau</p>
              <p className="text-2xl font-extrabold text-white">Niv. {level.level} · {level.name}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-extrabold text-white">{gameStats?.xp ?? 0}</p>
              <p className="text-xs text-white/70">XP total</p>
            </div>
          </div>
          <div className="h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
            <motion.div className="h-full rounded-full" style={{ background: "rgba(255,255,255,0.9)" }}
              initial={{ width: 0 }} animate={{ width: `${level.pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }} />
          </div>
          <p className="text-xs text-white/70 mt-1">{level.current}/{level.needed} XP → niveau {level.level + 1}</p>
        </motion.div>
      )}

      {stats && (
        <div className="flex flex-col gap-4">
          {/* Devoirs */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-3xl p-4"
            style={{ background: "#fff", border: "1px solid rgba(139,92,246,0.15)", boxShadow: "0 2px 12px rgba(124,58,237,0.08)" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-extrabold" style={{ color: "#3b0764" }}>📚 Devoirs</h2>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <DonutChart done={stats.devoirs.done} total={stats.devoirs.total} color="#7c3aed" />
              <div className="flex flex-col gap-2 flex-1">
                {[
                  { l: "Total", v: stats.devoirs.total, c: "#7c3aed" },
                  { l: "Terminés", v: stats.devoirs.done, c: "#10b981" },
                  { l: "En retard", v: stats.devoirs.enRetard, c: "#dc2626" },
                ].map(s => (
                  <div key={s.l} className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: "#6b7280" }}>{s.l}</span>
                    <span className="text-sm font-extrabold" style={{ color: s.c }}>{s.v}</span>
                  </div>
                ))}
              </div>
            </div>
            {Object.entries(stats.devoirs.parMatiere).sort((a, b) => b[1].total - a[1].total).map(([matiere, data]) => {
              const cfg = getMatiereConfig(matiere);
              const pct = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0;
              return (
                <div key={matiere} className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>{matiere}</span>
                    <span className="text-xs" style={{ color: "#6b7280" }}>{data.done}/{data.total} · {pct}%</span>
                  </div>
                  <MiniBar pct={pct} color="#8b5cf6" />
                </div>
              );
            })}
          </motion.div>

          {/* Tâches */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="rounded-3xl p-4"
            style={{ background: "#fff", border: "1px solid rgba(139,92,246,0.15)", boxShadow: "0 2px 12px rgba(124,58,237,0.08)" }}>
            <h2 className="text-sm font-extrabold mb-3" style={{ color: "#3b0764" }}>✅ Tâches</h2>
            <div className="flex items-center gap-4 mb-3">
              <DonutChart done={stats.taches.terminee} total={stats.taches.total} color="#10b981" />
              <div className="flex flex-col gap-2 flex-1">
                {[
                  { l: "À faire", v: stats.taches.aFaire, c: "#6366f1" },
                  { l: "En cours", v: stats.taches.enCours, c: "#f59e0b" },
                  { l: "Terminées", v: stats.taches.terminee, c: "#10b981" },
                ].map(s => (
                  <div key={s.l} className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: "#6b7280" }}>{s.l}</span>
                    <span className="text-sm font-extrabold" style={{ color: s.c }}>{s.v}</span>
                  </div>
                ))}
              </div>
            </div>
            {Object.entries(stats.taches.parType).map(([type, count]) => {
              const colors: Record<string, string> = { Perso: "#3b82f6", École: "#7c3aed", Étude: "#14b8a6" };
              const color = colors[type] ?? "#7c3aed";
              return (
                <div key={type} className="mb-1.5">
                  <div className="flex justify-between mb-0.5">
                    <span className="text-xs" style={{ color }}>{type}</span>
                    <span className="text-xs font-bold" style={{ color }}>{count}</span>
                  </div>
                  <MiniBar pct={(count / Math.max(1, stats.taches.total)) * 100} color={color} />
                </div>
              );
            })}
          </motion.div>

          {/* Gamification */}
          {gameStats && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="rounded-3xl p-4"
              style={{ background: "#fff", border: "1px solid rgba(245,158,11,0.3)", boxShadow: "0 2px 12px rgba(245,158,11,0.1)" }}>
              <h2 className="text-sm font-extrabold mb-3" style={{ color: "#3b0764" }}>🏆 Récompenses</h2>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { e: "🪙", v: gameStats.coins, l: "Pièces" },
                  { e: "⚡", v: gameStats.xp ?? 0, l: "XP total" },
                  { e: "🔥", v: gameStats.streak, l: "Série" },
                  { e: "✅", v: gameStats.totalCompleted, l: "Devoirs" },
                  { e: "⏱️", v: gameStats.pomodorosCompleted ?? 0, l: "Pomodoros" },
                  { e: "⭐", v: level?.level ?? 1, l: "Niveau" },
                ].map(s => (
                  <div key={s.l} className="rounded-2xl p-2.5 text-center" style={{ background: "rgba(245,158,11,0.08)" }}>
                    <span className="text-xl">{s.e}</span>
                    <p className="text-lg font-extrabold" style={{ color: "#d97706" }}>{s.v}</p>
                    <p className="text-xs" style={{ color: "#6b7280" }}>{s.l}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Cours */}
          {stats.cours.totalSeances > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="rounded-3xl p-4"
              style={{ background: "#fff", border: "1px solid rgba(139,92,246,0.15)", boxShadow: "0 2px 12px rgba(124,58,237,0.08)" }}>
              <h2 className="text-sm font-extrabold mb-3" style={{ color: "#3b0764" }}>🎓 Cours particuliers</h2>
              <div className="flex items-center gap-4 mb-3">
                <DonutChart done={stats.cours.seancesDone} total={stats.cours.totalSeances} color="#ec4899" />
                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex justify-between">
                    <span className="text-xs" style={{ color: "#6b7280" }}>Séances faites</span>
                    <span className="text-sm font-extrabold" style={{ color: "#ec4899" }}>{stats.cours.seancesDone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs" style={{ color: "#6b7280" }}>Total</span>
                    <span className="text-sm font-extrabold" style={{ color: "#8b5cf6" }}>{stats.cours.totalSeances}</span>
                  </div>
                </div>
              </div>
              {Object.entries(stats.cours.revenus).map(([devise, montant]) => (
                <div key={devise} className="flex items-center justify-between p-2 rounded-xl" style={{ background: "rgba(16,185,129,0.08)" }}>
                  <span className="text-xs" style={{ color: "#6b7280" }}>Revenus {devise}</span>
                  <span className="text-sm font-extrabold" style={{ color: "#10b981" }}>{montant.toLocaleString("fr-FR")} {devise}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
