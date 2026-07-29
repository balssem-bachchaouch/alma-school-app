"use client";

import { useState } from "react";
import { Plus, Clock, CheckCircle2, Circle } from "lucide-react";

const devoirsData = [
  {
    date: "Aujourd'hui",
    devoirs: [
      { id: 1, matiere: "Mathématiques", titre: "Exercices page 45", duree: "30 min", badge: "bg-orange-100 text-orange-700", dot: "bg-orange-400" },
      { id: 2, matiere: "Français", titre: "Rédaction sur les vacances", duree: "45 min", badge: "bg-blue-100 text-blue-700", dot: "bg-blue-400" },
      { id: 3, matiere: "Arabe", titre: "Apprendre vocabulaire leçon 3", duree: "20 min", badge: "bg-green-100 text-green-700", dot: "bg-green-400" },
    ],
  },
  {
    date: "Demain",
    devoirs: [
      { id: 4, matiere: "Sciences", titre: "Schéma de la cellule", duree: "40 min", badge: "bg-violet-100 text-violet-700", dot: "bg-violet-400" },
      { id: 5, matiere: "Anglais", titre: "Verbes irréguliers", duree: "25 min", badge: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-400" },
    ],
  },
  {
    date: "Après-demain",
    devoirs: [
      { id: 6, matiere: "Histoire-Géo", titre: "Résumé chapitre 3 : Les Romains", duree: "35 min", badge: "bg-pink-100 text-pink-700", dot: "bg-pink-400" },
    ],
  },
];

export default function DevoirsPage() {
  const [completed, setCompleted] = useState<number[]>([]);

  const toggle = (id: number) =>
    setCompleted((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  return (
    <div className="px-4 pt-8 pb-4 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-800">📚 Mes Devoirs</h1>
        <button className="flex items-center gap-1.5 bg-violet-500 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-sm active:scale-95 transition-transform">
          <Plus size={16} />
          Ajouter
        </button>
      </div>

      {devoirsData.map((group) => (
        <div key={group.date} className="mb-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            {group.date}
          </h2>
          <div className="flex flex-col gap-3">
            {group.devoirs.map((d) => {
              const done = completed.includes(d.id);
              return (
                <div
                  key={d.id}
                  className={`bg-white rounded-3xl p-4 flex items-center gap-4 shadow-sm transition-opacity ${done ? "opacity-50" : ""}`}
                >
                  <div className={`w-3 h-3 rounded-full ${d.dot} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${d.badge}`}>
                      {d.matiere}
                    </span>
                    <p className={`text-gray-700 font-semibold mt-1.5 text-sm ${done ? "line-through text-gray-400" : ""}`}>
                      {d.titre}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-400">{d.duree}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggle(d.id)}
                    className="flex-shrink-0 active:scale-90 transition-transform"
                  >
                    {done ? (
                      <CheckCircle2 size={30} className="text-green-500" />
                    ) : (
                      <Circle size={30} className="text-gray-300" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
