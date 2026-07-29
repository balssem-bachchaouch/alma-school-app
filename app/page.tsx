"use client";

import { useState } from "react";
import { Clock, CheckCircle2, Circle, User, Flame } from "lucide-react";

const devoirsAujourdhui = [
  {
    id: 1,
    matiere: "Mathématiques",
    titre: "Exercices page 45",
    duree: "30 min",
    bg: "bg-orange-50",
    badge: "bg-orange-100 text-orange-700",
    dot: "bg-orange-400",
  },
  {
    id: 2,
    matiere: "Français",
    titre: "Rédaction sur les vacances",
    duree: "45 min",
    bg: "bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-400",
  },
  {
    id: 3,
    matiere: "Arabe",
    titre: "Apprendre vocabulaire leçon 3",
    duree: "20 min",
    bg: "bg-green-50",
    badge: "bg-green-100 text-green-700",
    dot: "bg-green-400",
  },
];

const devoirsDemain = [
  {
    id: 4,
    matiere: "Sciences",
    titre: "Schéma de la cellule",
    badge: "bg-violet-100 text-violet-700",
    dot: "bg-violet-400",
  },
  {
    id: 5,
    matiere: "Anglais",
    titre: "Verbes irréguliers",
    badge: "bg-yellow-100 text-yellow-700",
    dot: "bg-yellow-400",
  },
];

export default function HomePage() {
  const [completed, setCompleted] = useState<number[]>([]);

  const toggle = (id: number) =>
    setCompleted((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="px-4 pt-8 pb-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 leading-tight">
            Bonjour ALMA ! 👋
          </h1>
          <p className="text-gray-400 mt-1 capitalize text-sm">{today}</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
          <User size={24} className="text-violet-500" />
        </div>
      </div>

      {/* Companion card */}
      <div
        className="rounded-3xl p-5 mb-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #C084FC 0%, #F472B6 100%)" }}
      >
        <div className="text-center mb-3">
          <span className="text-6xl select-none">🐱</span>
        </div>
        <p className="text-center font-bold text-white text-lg leading-snug">
          Tu as 3 devoirs aujourd&apos;hui, courage !
        </p>
        <div className="flex items-center justify-center gap-2 mt-3 bg-white/25 rounded-2xl py-2 px-4 w-fit mx-auto">
          <Flame size={16} className="text-orange-100" />
          <span className="font-bold text-white text-sm">🔥 5 jours de suite !</span>
        </div>
      </div>

      {/* Aujourd'hui */}
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-gray-800 mb-3">📖 Aujourd&apos;hui</h2>
        <div className="flex flex-col gap-3">
          {devoirsAujourdhui.map((d) => {
            const done = completed.includes(d.id);
            return (
              <div
                key={d.id}
                className={`rounded-3xl p-4 ${d.bg} flex items-center gap-4 transition-opacity ${done ? "opacity-50" : ""}`}
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

      {/* Demain */}
      <div>
        <h2 className="text-xl font-extrabold text-gray-800 mb-3">🌙 Demain</h2>
        <div className="flex flex-col gap-2">
          {devoirsDemain.map((d) => (
            <div
              key={d.id}
              className="rounded-3xl p-4 bg-white flex items-center gap-3 shadow-sm"
            >
              <div className={`w-3 h-3 rounded-full ${d.dot} flex-shrink-0`} />
              <div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${d.badge}`}>
                  {d.matiere}
                </span>
                <p className="text-gray-500 text-sm mt-1">{d.titre}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
