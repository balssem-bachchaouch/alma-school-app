"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Devoir, PlanningSlot, CoursParticulier } from "@/lib/types";
import { getMatiereConfig } from "@/lib/constants";

const JOURS_COURT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
              "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

type DayEvent = { type: "devoir"; matiere: string; titre: string; completed: boolean }
              | { type: "cours"; nom: string; color: string }
              | { type: "planning"; titre: string; color: string };

function getCalendarDays(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDow = (first.getDay() + 6) % 7; // 0=Lun
  const days: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

const COURS_PALETTE = ["#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#84cc16"];
function getCoursColor(nom: string) {
  let h = 0;
  for (let i = 0; i < nom.length; i++) h = (h * 31 + nom.charCodeAt(i)) & 0x7fffffff;
  return COURS_PALETTE[h % COURS_PALETTE.length];
}

const SLOT_COLORS: Record<string, string> = {
  blue: "#3b82f6", violet: "#7c3aed", pink: "#ec4899", green: "#10b981",
  orange: "#f59e0b", red: "#ef4444", teal: "#14b8a6", yellow: "#eab308",
};

export default function CalendrierPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [devoirs, setDevoirs] = useState<Devoir[]>([]);
  const [slots, setSlots] = useState<PlanningSlot[]>([]);
  const [cours, setCours] = useState<CoursParticulier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/devoirs").then(r => r.ok ? r.json() : []),
      fetch("/api/planning").then(r => r.ok ? r.json() : []),
      fetch("/api/cours").then(r => r.ok ? r.json() : []),
    ]).then(([d, s, c]) => {
      setDevoirs(d);
      setSlots(s);
      setCours(c);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const days = getCalendarDays(year, month);
  const todayISO = today.toISOString().split("T")[0];

  function getEventsForDate(date: Date): DayEvent[] {
    const iso = date.toISOString().split("T")[0];
    const dow = (date.getDay() + 6) % 7;
    const events: DayEvent[] = [];

    // Devoirs
    devoirs.filter(d => d.dueDate === iso).forEach(d => {
      events.push({ type: "devoir", matiere: d.matiere, titre: d.titre, completed: d.completed });
    });

    // Planning slots (recurring by day of week)
    slots.filter(s => s.day === dow).forEach(s => {
      const color = SLOT_COLORS[s.colorClass] ?? "#7c3aed";
      events.push({ type: "planning", titre: s.titre, color });
    });

    // Cours particuliers séances
    for (const c of cours) {
      for (const cy of c.cycles) {
        for (const s of cy.seances) {
          if (s.datePrevu === iso) {
            events.push({ type: "cours", nom: c.nom, color: getCoursColor(c.nom) });
          }
        }
      }
    }

    return events;
  }

  const selectedEvents = selectedDay ? getEventsForDate(selectedDay) : [];

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <div className="px-4 pt-6 pb-28 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/planning" className="p-2 rounded-xl active:scale-90 transition-transform" style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }}>
          <ChevronLeft size={18} />
        </Link>
        <h1 className="text-xl font-extrabold flex-1" style={{ color: "#3b0764" }}>📅 Calendrier</h1>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 rounded-xl active:scale-90 transition-transform" style={{ color: "#7c3aed", background: "rgba(124,58,237,0.08)" }}>
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-base font-extrabold" style={{ color: "#3b0764" }}>
          {MOIS[month]} {year}
        </h2>
        <button onClick={nextMonth} className="p-2 rounded-xl active:scale-90 transition-transform" style={{ color: "#7c3aed", background: "rgba(124,58,237,0.08)" }}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Days header */}
      <div className="grid grid-cols-7 mb-1">
        {JOURS_COURT.map(j => (
          <div key={j} className="text-center text-xs font-bold py-1" style={{ color: "#8b5cf6" }}>{j}</div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((date, i) => {
            if (!date) return <div key={i} />;
            const iso = date.toISOString().split("T")[0];
            const isToday = iso === todayISO;
            const isSelected = selectedDay?.toISOString().split("T")[0] === iso;
            const events = getEventsForDate(date);
            const hasDevoir = events.some(e => e.type === "devoir" && !e.completed);
            const hasOverdue = events.some(e => e.type === "devoir" && !e.completed && iso < todayISO);
            const hasCours = events.some(e => e.type === "cours");
            const hasPlanning = events.some(e => e.type === "planning");

            return (
              <button
                key={i}
                onClick={() => setSelectedDay(isSelected ? null : date)}
                className="flex flex-col items-center py-1.5 rounded-xl transition-all min-h-[52px]"
                style={isSelected
                  ? { background: "linear-gradient(135deg, #7c3aed, #ec4899)" }
                  : isToday
                  ? { background: "rgba(124,58,237,0.15)", border: "1.5px solid #7c3aed" }
                  : { background: "rgba(255,255,255,0.6)" }
                }
              >
                <span className="text-xs font-bold" style={{
                  color: isSelected ? "#fff" : isToday ? "#7c3aed" : date.getMonth() === month ? "#3b0764" : "#c4b5fd"
                }}>
                  {date.getDate()}
                </span>
                {/* Event dots */}
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center px-1">
                  {hasOverdue && <span className="w-1.5 h-1.5 rounded-full" style={{ background: isSelected ? "#fff" : "#dc2626" }} />}
                  {hasDevoir && !hasOverdue && <span className="w-1.5 h-1.5 rounded-full" style={{ background: isSelected ? "#fff" : "#7c3aed" }} />}
                  {hasCours && <span className="w-1.5 h-1.5 rounded-full" style={{ background: isSelected ? "#fff" : "#ec4899" }} />}
                  {hasPlanning && <span className="w-1.5 h-1.5 rounded-full" style={{ background: isSelected ? "#fff" : "#10b981" }} />}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-3 mt-3 flex-wrap">
        {[
          { color: "#7c3aed", label: "Devoir" },
          { color: "#dc2626", label: "En retard" },
          { color: "#ec4899", label: "Cours" },
          { color: "#10b981", label: "Planning" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-xs" style={{ color: "#6b7280" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="mt-4 rounded-3xl p-4" style={{ background: "#fff", border: "1px solid rgba(139,92,246,0.2)", boxShadow: "0 2px 12px rgba(124,58,237,0.1)" }}>
          <h3 className="text-sm font-extrabold mb-3" style={{ color: "#3b0764" }}>
            {selectedDay.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </h3>
          {selectedEvents.length === 0 ? (
            <p className="text-xs text-center py-2" style={{ color: "#9ca3af" }}>Rien de prévu 🎉</p>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedEvents.map((e, idx) => {
                if (e.type === "devoir") {
                  const cfg = getMatiereConfig(e.matiere);
                  const iso = selectedDay.toISOString().split("T")[0];
                  const overdue = !e.completed && iso < todayISO;
                  return (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-xl"
                      style={{ background: overdue ? "#fff5f5" : "#f5f3ff", border: `1px solid ${overdue ? "rgba(220,38,38,0.2)" : "rgba(124,58,237,0.15)"}` }}>
                      <span className="text-base">📚</span>
                      <div className="flex-1 min-w-0">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>{e.matiere}</span>
                        <p className="text-xs mt-0.5 font-semibold truncate" style={{ color: "#3b0764", textDecoration: e.completed ? "line-through" : "none" }}>{e.titre}</p>
                      </div>
                      {overdue && <span className="text-xs font-bold shrink-0" style={{ color: "#dc2626" }}>Retard</span>}
                      {e.completed && <span className="text-green-500 text-sm shrink-0">✓</span>}
                    </div>
                  );
                }
                if (e.type === "cours") {
                  return (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-xl"
                      style={{ background: e.color + "15", border: `1px solid ${e.color}40` }}>
                      <span className="text-base">🎓</span>
                      <p className="text-xs font-semibold" style={{ color: "#3b0764" }}>{e.nom}</p>
                    </div>
                  );
                }
                if (e.type === "planning") {
                  return (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-xl"
                      style={{ background: e.color + "15", border: `1px solid ${e.color}40` }}>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: e.color }} />
                      <p className="text-xs font-semibold" style={{ color: "#3b0764" }}>{e.titre}</p>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
