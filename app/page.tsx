"use client";

import { useEffect, useState } from "react";
import { Clock, CheckCircle2, Circle, User, Flame } from "lucide-react";
import type { Devoir } from "@/lib/types";
import { getDevoirs, saveDevoirs } from "@/lib/storage";
import { getMatiereConfig } from "@/lib/constants";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}
function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

export default function HomePage() {
  const [devoirs, setDevoirs] = useState<Devoir[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setDevoirs(getDevoirs());
    setLoaded(true);
  }, []);

  const today = todayStr();
  const tomorrow = tomorrowStr();

  const devoirsAujourdhui = devoirs.filter((d) => d.dueDate === today);
  const devoirsDemain = devoirs.filter((d) => d.dueDate === tomorrow);

  const toggle = (id: string) => {
    const updated = devoirs.map((d) =>
      d.id === id ? { ...d, completed: !d.completed } : d
    );
    setDevoirs(updated);
    saveDevoirs(updated);
  };

  const todayDate = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (!loaded) return null;

  return (
    <div className="px-4 pt-8 pb-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 leading-tight">
            Bonjour ALMA ! 👋
          </h1>
          <p className="text-gray-400 mt-1 capitalize text-sm">{todayDate}</p>
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
          Tu as {devoirsAujourdhui.length} devoir
          {devoirsAujourdhui.length !== 1 ? "s" : ""} aujourd&apos;hui, courage !
        </p>
        <div className="flex items-center justify-center gap-2 mt-3 bg-white/25 rounded-2xl py-2 px-4 w-fit mx-auto">
          <Flame size={16} className="text-orange-100" />
          <span className="font-bold text-white text-sm">🔥 5 jours de suite !</span>
        </div>
      </div>

      {/* Aujourd'hui */}
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-gray-800 mb-3">📖 Aujourd&apos;hui</h2>
        {devoirsAujourdhui.length === 0 ? (
          <p className="text-center text-gray-400 py-4">Aucun devoir aujourd&apos;hui 🎉</p>
        ) : (
          <div className="flex flex-col gap-3">
            {devoirsAujourdhui.map((d) => {
              const cfg = getMatiereConfig(d.matiere);
              return (
                <div
                  key={d.id}
                  className={`rounded-3xl p-4 ${cfg.bg} flex items-center gap-4 transition-opacity ${d.completed ? "opacity-50" : ""}`}
                >
                  <div className={`w-3 h-3 rounded-full ${cfg.dot} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.badge}`}>
                      {d.matiere}
                    </span>
                    <p className={`text-gray-700 font-semibold mt-1.5 text-sm ${d.completed ? "line-through text-gray-400" : ""}`}>
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
                    {d.completed ? (
                      <CheckCircle2 size={30} className="text-green-500" />
                    ) : (
                      <Circle size={30} className="text-gray-300" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Demain */}
      <div>
        <h2 className="text-xl font-extrabold text-gray-800 mb-3">🌙 Demain</h2>
        {devoirsDemain.length === 0 ? (
          <p className="text-center text-gray-400 py-4">Aucun devoir pour demain</p>
        ) : (
          <div className="flex flex-col gap-2">
            {devoirsDemain.map((d) => {
              const cfg = getMatiereConfig(d.matiere);
              return (
                <div
                  key={d.id}
                  className="rounded-3xl p-4 bg-white flex items-center gap-3 shadow-sm"
                >
                  <div className={`w-3 h-3 rounded-full ${cfg.dot} flex-shrink-0`} />
                  <div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.badge}`}>
                      {d.matiere}
                    </span>
                    <p className="text-gray-500 text-sm mt-1">{d.titre}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
