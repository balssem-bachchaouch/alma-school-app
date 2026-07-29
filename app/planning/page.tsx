"use client";

const fullDays = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

const slots = [
  { day: 0, label: "École", time: "8h – 12h", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { day: 1, label: "École", time: "8h – 12h", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { day: 2, label: "École", time: "8h – 12h", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { day: 3, label: "École", time: "8h – 12h", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { day: 4, label: "École", time: "8h – 12h", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { day: 0, label: "Cours d'arabe", time: "14h – 16h", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { day: 2, label: "Cours d'arabe", time: "14h – 16h", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { day: 1, label: "Karaté", time: "17h – 18h30", color: "bg-violet-100 text-violet-700 border-violet-200" },
];

export default function PlanningPage() {
  return (
    <div className="px-4 pt-8 pb-4 max-w-md mx-auto">
      <h1 className="text-2xl font-extrabold text-gray-800 mb-6">📅 Mon Planning</h1>

      <div className="flex flex-col gap-4">
        {fullDays.map((day, i) => {
          const daySlots = slots.filter((s) => s.day === i);
          return (
            <div key={day} className="bg-white rounded-3xl p-4 shadow-sm">
              <h2 className="font-bold text-gray-700 mb-3">{day}</h2>
              <div className="flex flex-col gap-2">
                {daySlots.map((slot, j) => (
                  <div
                    key={j}
                    className={`rounded-2xl px-4 py-3 border ${slot.color} flex items-center justify-between`}
                  >
                    <span className="font-semibold text-sm">{slot.label}</span>
                    <span className="text-xs opacity-70 font-medium">{slot.time}</span>
                  </div>
                ))}
                {daySlots.length === 0 && (
                  <p className="text-gray-300 text-sm text-center py-2">Aucun cours</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
