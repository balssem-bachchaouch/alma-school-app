"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PlanningSlot, CoursParticulier } from "@/lib/types";
import { SLOT_COLORS, CATEGORIES_PLANNING, DAYS_FULL } from "@/lib/constants";

const getTodayDay = () => (new Date().getDay() + 6) % 7;

const EMPTY_FORM = {
  titre: "",
  categorie: "",
  day: "0",
  startTime: "08:00",
  endTime: "12:00",
  colorKey: "blue",
};

const TT_START = 7;
const TT_END = 21;
const HOUR_PX = 64;

function timeToY(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return ((h - TT_START) * 60 + m) * (HOUR_PX / 60);
}

const COURS_PALETTE = [
  { bg: "#fce7f3", border: "#ec4899", text: "#be185d" },
  { bg: "#dbeafe", border: "#3b82f6", text: "#1d4ed8" },
  { bg: "#d1fae5", border: "#10b981", text: "#065f46" },
  { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" },
  { bg: "#fee2e2", border: "#ef4444", text: "#991b1b" },
  { bg: "#ccfbf1", border: "#14b8a6", text: "#115e59" },
  { bg: "#e0e7ff", border: "#6366f1", text: "#3730a3" },
  { bg: "#fdf4ff", border: "#c026d3", text: "#86198f" },
];

function getCoursColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0x7fffffff;
  }
  return COURS_PALETTE[hash % COURS_PALETTE.length];
}

export default function PlanningPage() {
  const [slots, setSlots] = useState<PlanningSlot[]>([]);
  const [cours, setCours] = useState<CoursParticulier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PlanningSlot | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const todayDay = getTodayDay();

  const loadSlots = async () => {
    try {
      const res = await fetch("/api/planning");
      if (!res.ok) throw new Error("Erreur de chargement");
      const data: PlanningSlot[] = await res.json();
      setSlots(data);
      setError(null);
    } catch {
      setError("Impossible de charger le planning");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
    fetch("/api/cours")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: CoursParticulier[]) => setCours(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (slot: PlanningSlot) => {
    setEditing(slot);
    const colorKey = SLOT_COLORS.find((c) => c.classes === slot.colorClass)?.key ?? "blue";
    setForm({
      titre: slot.titre,
      categorie: slot.categorie,
      day: String(slot.day),
      startTime: slot.startTime,
      endTime: slot.endTime,
      colorKey,
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.titre || !form.categorie) return;
    const colorClasses =
      SLOT_COLORS.find((c) => c.key === form.colorKey)?.classes ?? SLOT_COLORS[0].classes;
    const payload = {
      titre: form.titre,
      categorie: form.categorie,
      day: Number(form.day),
      startTime: form.startTime,
      endTime: form.endTime,
      colorClass: colorClasses,
    };

    if (editing) {
      const res = await fetch(`/api/planning/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated: PlanningSlot = await res.json();
        setSlots((prev) => prev.map((s) => (s.id === editing.id ? updated : s)));
      }
    } else {
      const res = await fetch("/api/planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created: PlanningSlot = await res.json();
        setSlots((prev) => [...prev, created]);
      }
    }
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer ce créneau ?")) return;
    const res = await fetch(`/api/planning/${id}`, { method: "DELETE" });
    if (res.ok) setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="px-4 pt-8 pb-24 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold" style={{ color: "#3b0764" }}>📅 Mon Planning</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-sm active:scale-95 transition-transform"
          style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
        >
          <Plus size={16} />
          Ajouter
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-8">
          <p className="text-red-500 text-sm mb-3">{error}</p>
          <button
            onClick={loadSlots}
            className="text-sm px-4 py-2 rounded-2xl text-white font-semibold"
            style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
          >
            Réessayer
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ── Mobile: vue carte par jour ── */}
          <div className="md:hidden flex flex-col gap-4">
            {DAYS_FULL.map((day, i) => {
              const daySlots = slots.filter((s) => s.day === i);
              const coursParJour = cours.filter((c) => c.jours.some((j) => j.day === i));
              const isToday = i === todayDay;
              return (
                <div
                  key={day}
                  className="rounded-3xl p-4"
                  style={{
                    background: "#ffffff",
                    border: isToday
                      ? "1px solid rgba(236,72,153,0.5)"
                      : "1px solid rgba(139,92,246,0.2)",
                    boxShadow: "0 2px 12px rgba(124,58,237,0.08)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="font-bold" style={{ color: "#3b0764" }}>{day}</h2>
                    {isToday && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold text-white"
                        style={{ background: "linear-gradient(90deg, #ec4899, #7c3aed)" }}
                      >
                        Aujourd&apos;hui
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {daySlots.map((slot) => {
                      const colorHex = SLOT_COLORS.find((c) => c.classes === slot.colorClass)?.hex ?? "#7c3aed";
                      return (
                        <div
                          key={slot.id}
                          className="flex items-center justify-between"
                          style={{
                            background: "#ffffff",
                            borderLeft: `4px solid ${colorHex}`,
                            borderRadius: "16px",
                            boxShadow: "0 2px 8px rgba(124,58,237,0.1)",
                            padding: "12px 14px",
                          }}
                        >
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-sm" style={{ color: "#3b0764" }}>{slot.titre}</span>
                            <span className="text-xs" style={{ color: "#6d28d9" }}>
                              {slot.startTime} – {slot.endTime}
                            </span>
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full w-fit"
                              style={{ background: `${colorHex}22`, color: "#3b0764" }}
                            >
                              {slot.categorie}
                            </span>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => openEdit(slot)}
                              className="p-2.5 rounded-xl active:scale-90 transition-transform"
                              style={{ color: "#7c3aed" }}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(slot.id)}
                              className="p-2.5 rounded-xl active:scale-90 transition-transform text-red-500"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {coursParJour.map((cp) => {
                      const jourInfo = cp.jours.find((j) => j.day === i);
                      const clr = getCoursColor(cp.nom);
                      return (
                        <div
                          key={cp.id}
                          style={{
                            background: clr.bg,
                            borderLeft: `4px solid ${clr.border}`,
                            borderRadius: "16px",
                            padding: "12px 14px",
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{ background: clr.border + "22", color: clr.text }}
                            >
                              {cp.nom}
                            </span>
                            {jourInfo && (
                              <span className="text-xs font-semibold" style={{ color: clr.text }}>
                                {jourInfo.startTime} – {jourInfo.endTime}
                              </span>
                            )}
                          </div>
                          {cp.matieres.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-1">
                              {cp.matieres.map((m) => (
                                <span
                                  key={m}
                                  className="text-xs px-1.5 py-0.5 rounded-full"
                                  style={{ background: clr.border + "22", color: clr.text }}
                                >
                                  {m}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-xs" style={{ color: clr.border }}>🎓 Cours particulier</p>
                        </div>
                      );
                    })}
                    {daySlots.length === 0 && coursParJour.length === 0 && (
                      <p className="text-sm text-center py-2" style={{ color: "rgba(109,40,217,0.4)" }}>
                        Aucun cours
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Desktop: tableau emploi du temps ── */}
          <div
            className="hidden md:flex"
            style={{
              background: "#ffffff",
              borderRadius: 20,
              border: "1px solid rgba(139,92,246,0.2)",
              boxShadow: "0 4px 24px rgba(124,58,237,0.1)",
              overflow: "hidden",
            }}
          >
            {/* Colonne horaires */}
            <div style={{ width: 56, flexShrink: 0, background: "#f9f7ff" }}>
              {/* En-tête vide */}
              <div
                style={{
                  height: 50,
                  borderBottom: "1px solid rgba(139,92,246,0.15)",
                  borderRight: "1px solid rgba(139,92,246,0.15)",
                }}
              />
              {/* Heures */}
              <div
                style={{
                  position: "relative",
                  height: `${(TT_END - TT_START) * HOUR_PX}px`,
                  borderRight: "1px solid rgba(139,92,246,0.15)",
                }}
              >
                {Array.from({ length: TT_END - TT_START + 1 }, (_, i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      top: `${i * HOUR_PX - 7}px`,
                      left: 0,
                      right: 4,
                      textAlign: "right",
                      fontSize: 10,
                      fontWeight: 600,
                      color: "#a78bfa",
                      userSelect: "none",
                      lineHeight: "14px",
                    }}
                  >
                    {String(TT_START + i).padStart(2, "0")}h
                  </div>
                ))}
              </div>
            </div>

            {/* Colonnes par jour */}
            {DAYS_FULL.map((day, dayIdx) => {
              const isToday = dayIdx === todayDay;
              const daySlots = slots.filter((s) => s.day === dayIdx);
              const dayCoursParticuliers = cours.filter((cp) =>
                cp.jours.some((j) => j.day === dayIdx)
              );

              return (
                <div
                  key={day}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    borderLeft: "1px solid rgba(139,92,246,0.1)",
                  }}
                >
                  {/* En-tête du jour */}
                  <div
                    style={{
                      height: 50,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 5,
                      fontWeight: 800,
                      fontSize: 11,
                      color: isToday ? "#7c3aed" : "#3b0764",
                      background: isToday
                        ? "rgba(124,58,237,0.08)"
                        : "#f9f7ff",
                      borderBottom: "1px solid rgba(139,92,246,0.15)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {day.substring(0, 3)}
                    {isToday && (
                      <div
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: "#ec4899",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>

                  {/* Zone événements */}
                  <div
                    style={{
                      position: "relative",
                      height: `${(TT_END - TT_START) * HOUR_PX}px`,
                      background: isToday ? "rgba(124,58,237,0.012)" : "transparent",
                    }}
                  >
                    {/* Lignes horaires */}
                    {Array.from({ length: TT_END - TT_START }, (_, i) => (
                      <div
                        key={i}
                        style={{
                          position: "absolute",
                          top: `${i * HOUR_PX}px`,
                          left: 0,
                          right: 0,
                          borderTop: `1px solid rgba(139,92,246,0.18)`,
                          pointerEvents: "none",
                        }}
                      />
                    ))}

                    {/* Créneaux réguliers */}
                    {daySlots.map((slot) => {
                      const colorHex =
                        SLOT_COLORS.find((c) => c.classes === slot.colorClass)?.hex ?? "#7c3aed";
                      const top = timeToY(slot.startTime);
                      const height = Math.max(timeToY(slot.endTime) - top, 22);
                      return (
                        <div
                          key={slot.id}
                          onClick={() => openEdit(slot)}
                          title={`${slot.titre} · ${slot.startTime}–${slot.endTime}`}
                          style={{
                            position: "absolute",
                            top: top + 1,
                            left: 2,
                            right: 2,
                            height: height - 2,
                            background: `${colorHex}28`,
                            borderLeft: `4px solid ${colorHex}`,
                            borderRadius: 6,
                            padding: "3px 5px",
                            overflow: "hidden",
                            cursor: "pointer",
                            zIndex: 2,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: colorHex,
                              lineHeight: "13px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {slot.titre}
                          </div>
                          {height > 32 && (
                            <div
                              style={{
                                fontSize: 9,
                                color: "#6d28d9",
                                marginTop: 1,
                                lineHeight: "12px",
                              }}
                            >
                              {slot.startTime} – {slot.endTime}
                            </div>
                          )}
                          {height > 46 && (
                            <div
                              style={{
                                fontSize: 9,
                                color: "#9ca3af",
                                marginTop: 1,
                                lineHeight: "12px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {slot.categorie}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Cours particuliers */}
                    {dayCoursParticuliers.map((cp) => {
                      const jourInfo = cp.jours.find((j) => j.day === dayIdx)!;
                      const top = timeToY(jourInfo.startTime);
                      const height = Math.max(timeToY(jourInfo.endTime) - top, 22);
                      const clr = getCoursColor(cp.nom);
                      return (
                        <div
                          key={cp.id}
                          title={`${cp.nom} · ${jourInfo.startTime}–${jourInfo.endTime} · Cours particulier`}
                          style={{
                            position: "absolute",
                            top: top + 1,
                            left: 2,
                            right: 2,
                            height: height - 2,
                            background: clr.bg,
                            borderLeft: `4px solid ${clr.border}`,
                            borderRadius: 6,
                            padding: "3px 5px",
                            overflow: "hidden",
                            zIndex: 2,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              color: clr.text,
                              lineHeight: "13px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {cp.nom}
                          </div>
                          {height > 32 && (
                            <div
                              style={{
                                fontSize: 9,
                                color: clr.border,
                                marginTop: 1,
                                lineHeight: "12px",
                              }}
                            >
                              🎓 {jourInfo.startTime} – {jourInfo.endTime}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ color: "#3b0764" }}>
              {editing ? "Modifier le créneau" : "Ajouter un créneau"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Titre</Label>
              <Input
                className="rounded-2xl"
                placeholder="Ex: Cours d'arabe"
                value={form.titre}
                onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Catégorie</Label>
              <Select
                value={form.categorie}
                onValueChange={(v) => setForm((f) => ({ ...f, categorie: v ?? f.categorie }))}
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Choisir une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES_PLANNING.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Jour</Label>
              <Select
                value={form.day}
                onValueChange={(v) => setForm((f) => ({ ...f, day: v ?? f.day }))}
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_FULL.map((d, i) => (
                    <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <Label style={{ color: "#3b0764" }}>Début</Label>
                <Input
                  type="time"
                  className="rounded-2xl"
                  value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <Label style={{ color: "#3b0764" }}>Fin</Label>
                <Input
                  type="time"
                  className="rounded-2xl"
                  value={form.endTime}
                  onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Couleur</Label>
              <div className="flex gap-2">
                {SLOT_COLORS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, colorKey: c.key }))}
                    className={`w-8 h-8 rounded-full ${c.dot} transition-transform active:scale-90 ${
                      form.colorKey === c.key ? "ring-2 ring-offset-2 ring-violet-400 scale-110" : ""
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editing && (
              <button
                onClick={async () => {
                  if (!window.confirm("Supprimer ce créneau ?")) return;
                  setOpen(false);
                  const res = await fetch(`/api/planning/${editing.id}`, { method: "DELETE" });
                  if (res.ok) setSlots((prev) => prev.filter((s) => s.id !== editing.id));
                }}
                className="px-4 py-2 rounded-2xl font-semibold text-sm mr-auto"
                style={{ color: "#ef4444" }}
              >
                Supprimer
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-2xl font-semibold text-sm"
              style={{ color: "#7c3aed" }}
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={!form.titre || !form.categorie}
              className="px-5 py-2 rounded-2xl text-white font-bold text-sm disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
            >
              {editing ? "Modifier" : "Ajouter"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
