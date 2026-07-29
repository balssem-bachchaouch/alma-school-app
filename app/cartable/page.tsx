"use client";

import { useState } from "react";

const items = [
  { id: 1, label: "Livre de maths", defaultChecked: true },
  { id: 2, label: "Cahier de français", defaultChecked: true },
  { id: 3, label: "Trousse", defaultChecked: false },
  { id: 4, label: "Gourde", defaultChecked: false },
  { id: 5, label: "Agenda", defaultChecked: false },
];

export default function CartablePage() {
  const [checked, setChecked] = useState<number[]>(
    items.filter((i) => i.defaultChecked).map((i) => i.id)
  );

  const toggle = (id: number) =>
    setChecked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const total = items.length;
  const done = checked.length;
  const pct = Math.round((done / total) * 100);
  const allDone = done === total;

  return (
    <div className="px-4 pt-8 pb-4 max-w-md mx-auto">
      <h1 className="text-2xl font-extrabold text-gray-800 mb-1">🎒 Mon Cartable</h1>
      <p className="text-gray-400 text-sm mb-6">Prépare ton cartable pour demain</p>

      {/* Progress bar */}
      <div className="bg-white rounded-3xl p-4 shadow-sm mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-600">
            {done}/{total} éléments prêts
          </span>
          <span className="text-sm font-bold text-violet-600">{pct}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-400 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const isChecked = checked.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              className={`w-full rounded-3xl p-4 flex items-center gap-4 text-left transition-all shadow-sm active:scale-[0.98] ${
                isChecked ? "bg-green-50" : "bg-white"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                  isChecked
                    ? "bg-green-400 border-green-400"
                    : "border-gray-300"
                }`}
              >
                {isChecked && (
                  <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                    <path
                      d="M1.5 5L5 8.5L11.5 1"
                      stroke="white"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span
                className={`font-semibold text-base transition-all ${
                  isChecked ? "line-through text-gray-400" : "text-gray-700"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {allDone && (
        <div className="mt-8 text-center bg-green-50 rounded-3xl py-6 px-4">
          <span className="text-4xl">🎉</span>
          <p className="text-green-600 font-extrabold text-lg mt-2">
            Cartable prêt ! Bravo ALMA !
          </p>
        </div>
      )}
    </div>
  );
}
