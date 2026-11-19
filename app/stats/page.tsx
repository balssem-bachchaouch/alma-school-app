"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { Devoir, Tache, CoursParticulier } from "@/lib/types";
import { getMatiereConfig } from "@/lib/constants";

type Stats = {
  devoirs: { total: number; done: number; enRetard: number; parMatiere: Record<string, { total: number; done: number }> };
  taches: { total: number; terminee: number; enCours: number; aFaire: number; parType: Record<string, number> };
  cours: { totalSeances: number; seancesDone: number; revenus: Record<string, number> };
};

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function StatCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl p-4" style={{ background: "#fff", border: "1px solid rgba(139,92,246,0.15)", boxShadow: "0 2px 12px rgba(124,58,237,0.08)" }}>
      <h2 className="text-sm font-extrabold mb-3" style={{ color: "#3b0764" }}>{title}</h2>
      {children}
    </div>
  );
}

function BigStat({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center px-3 py-2 rounded-2xl" style={{ background: color + "15" }}>
      <span className="text-2xl font-extrabold" style={{ color }}>{value}</span>
      <span className="text-xs text-center mt-0.5" style={{ color: "#6b7280" }}>{label}</span>
    </div>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];

    Promise.all([
      fetch("/api/devoirs").then(r => r.ok ? r.json() : []) as Promise<Devoir[]>,
      fetch("/api/taches").then(r => r.ok ? r.json() : []) as Promise<Tache[]>,
      fetch("/api/cours").then(r => r.ok ? r.json() : []) as Promise<CoursParticulier[]>,
    ]).then(([devoirs, taches, cours]) => {
      // Devoirs stats
      const parMatiere: Record<string, { total: number; done: number }> = {};
      devoirs.forEach(d => {
        if (!parMatiere[d.matiere]) parMatiere[d.matiere] = { total: 0, done: 0 };
        parMatiere[d.matiere].total++;
        if (d.completed) parMatiere[d.matiere].done++;
      });

      const devoirsStats = {
        total: devoirs.length,
        done: devoirs.filter(d => d.completed).length,
        enRetard: devoirs.filter(d => !d.completed && d.dueDate < today).length,
        parMatiere,
      };

      // Tâches stats
      const parType: Record<string, number> = {};
      taches.forEach(t => {
        parType[t.type] = (parType[t.type] ?? 0) + 1;
      });
      const tachesStats = {
        total: taches.length,
        terminee: taches.filter(t => t.statut === "Terminé").length,
        enCours: taches.filter(t => t.statut === "En cours").length,
        aFaire: taches.filter(t => t.statut === "À faire").length,
        parType,
      };

      // Cours stats
      const revenus: Record<string, number> = {};
      let totalSeances = 0;
      let seancesDone = 0;
      cours.forEach(c => {
        c.cycles.forEach(cy => {
          cy.seances.forEach(s => {
            totalSeances++;
            if (s.done) seancesDone++;
          });
          if (cy.montantPaye && cy.montantPaye > 0) {
            revenus[c.devise] = (revenus[c.devise] ?? 0) + cy.montantPaye;
          }
        });
      });

      setStats({ devoirs: devoirsStats, taches: tachesStats, cours: { totalSeances, seancesDone, revenus } });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="px-4 pt-6 pb-28 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link href="/" className="p-2 rounded-xl active:scale-90 transition-transform" style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }}>
          <ChevronLeft size={18} />
        </Link>
        <h1 className="text-xl font-extrabold flex-1" style={{ color: "#3b0764" }}>📊 Statistiques</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
        </div>
      ) : stats ? (
        <div className="flex flex-col gap-4">
          {/* Devoirs */}
          <StatCard title="📚 Devoirs">
            <div className="grid grid-cols-3 gap-2 mb-4">
              <BigStat value={stats.devoirs.total} label="Total" color="#7c3aed" />
              <BigStat value={stats.devoirs.done} label="Terminés" color="#10b981" />
              <BigStat value={stats.devoirs.enRetard} label="En retard" color="#dc2626" />
            </div>
            {/* Completion bar */}
            <div className="mb-1 flex justify-between">
              <span className="text-xs" style={{ color: "#6b7280" }}>Taux de complétion</span>
              <span className="text-xs font-bold" style={{ color: "#7c3aed" }}>
                {stats.devoirs.total > 0 ? Math.round((stats.devoirs.done / stats.devoirs.total) * 100) : 0}%
              </span>
            </div>
            <ProgressBar value={stats.devoirs.done} max={stats.devoirs.total} color="#7c3aed" />
            {/* Per matiere */}
            {Object.keys(stats.devoirs.parMatiere).length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {Object.entries(stats.devoirs.parMatiere)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([matiere, data]) => {
                    const cfg = getMatiereConfig(matiere);
                    return (
                      <div key={matiere}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>{matiere}</span>
                          <span className="text-xs" style={{ color: "#6b7280" }}>{data.done}/{data.total}</span>
                        </div>
                        <ProgressBar value={data.done} max={data.total} color="#8b5cf6" />
                      </div>
                    );
                  })}
              </div>
            )}
          </StatCard>

          {/* Tâches */}
          <StatCard title="✅ Tâches">
            <div className="grid grid-cols-3 gap-2 mb-4">
              <BigStat value={stats.taches.aFaire} label="À faire" color="#f59e0b" />
              <BigStat value={stats.taches.enCours} label="En cours" color="#3b82f6" />
              <BigStat value={stats.taches.terminee} label="Terminées" color="#10b981" />
            </div>
            <div className="mb-1 flex justify-between">
              <span className="text-xs" style={{ color: "#6b7280" }}>Progression globale</span>
              <span className="text-xs font-bold" style={{ color: "#10b981" }}>
                {stats.taches.total > 0 ? Math.round((stats.taches.terminee / stats.taches.total) * 100) : 0}%
              </span>
            </div>
            <ProgressBar value={stats.taches.terminee} max={stats.taches.total} color="#10b981" />
            {/* Par type */}
            {Object.keys(stats.taches.parType).length > 0 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {Object.entries(stats.taches.parType).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: "rgba(124,58,237,0.08)" }}>
                    <span className="text-xs font-bold" style={{ color: "#3b0764" }}>{type}</span>
                    <span className="text-xs font-extrabold" style={{ color: "#7c3aed" }}>{count}</span>
                  </div>
                ))}
              </div>
            )}
          </StatCard>

          {/* Cours */}
          <StatCard title="🎓 Cours particuliers">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <BigStat value={stats.cours.seancesDone} label="Séances faites" color="#ec4899" />
              <BigStat value={stats.cours.totalSeances - stats.cours.seancesDone} label="Restantes" color="#8b5cf6" />
            </div>
            {stats.cours.totalSeances > 0 && (
              <>
                <div className="mb-1 flex justify-between">
                  <span className="text-xs" style={{ color: "#6b7280" }}>Avancement</span>
                  <span className="text-xs font-bold" style={{ color: "#ec4899" }}>
                    {Math.round((stats.cours.seancesDone / stats.cours.totalSeances) * 100)}%
                  </span>
                </div>
                <ProgressBar value={stats.cours.seancesDone} max={stats.cours.totalSeances} color="#ec4899" />
              </>
            )}
            {/* Revenus par devise */}
            {Object.keys(stats.cours.revenus).length > 0 && (
              <div className="mt-3 flex flex-col gap-1">
                <span className="text-xs font-bold" style={{ color: "#6b7280" }}>Revenus encaissés</span>
                {Object.entries(stats.cours.revenus).map(([devise, montant]) => (
                  <div key={devise} className="flex items-center justify-between p-2 rounded-xl" style={{ background: "rgba(16,185,129,0.08)" }}>
                    <span className="text-xs" style={{ color: "#6b7280" }}>{devise}</span>
                    <span className="text-sm font-extrabold" style={{ color: "#10b981" }}>
                      {montant.toLocaleString("fr-FR")} {devise}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </StatCard>

          {/* Empty state */}
          {stats.devoirs.total === 0 && stats.taches.total === 0 && stats.cours.totalSeances === 0 && (
            <div className="flex flex-col items-center py-12 gap-3">
              <span className="text-5xl">📊</span>
              <p className="text-sm font-bold" style={{ color: "#6b7280" }}>Pas encore de données</p>
              <p className="text-xs text-center" style={{ color: "#9ca3af" }}>Commence à ajouter des devoirs, tâches et cours pour voir tes statistiques ici.</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
