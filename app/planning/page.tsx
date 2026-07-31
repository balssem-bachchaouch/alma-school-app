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
import type { PlanningSlot } from "@/lib/types";
import { getPlanningSlots, savePlanningSlots } from "@/lib/storage";
import { SLOT_COLORS, CATEGORIES_PLANNING, DAYS_FULL } from "@/lib/constants";

// JS getDay(): 0=Sun…6=Sat → convert to 0=Lun…6=Dim
const getTodayDay = () => (new Date().getDay() + 6) % 7;

const EMPTY_FORM = {
  titre: "",
  categorie: "",
  day: "0",
  startTime: "08:00",
  endTime: "12:00",
  colorKey: "blue",
};

export default function PlanningPage() {
  const [slots, setSlots] = useState<PlanningSlot[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PlanningSlot | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const todayDay = getTodayDay();

  useEffect(() => {
    setSlots(getPlanningSlots());
    setLoaded(true);
  }, []);

  const persist = (updated: PlanningSlot[]) => {
    setSlots(updated);
    savePlanningSlots(updated);
  };

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (slot: PlanningSlot) => {
    setEditing(slot);
    const colorKey =
      SLOT_COLORS.find((c) => c.classes === slot.colorClass)?.key ?? "blue";
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

  const handleSubmit = () => {
    if (!form.titre || !form.categorie) return;
    const colorClasses =
      SLOT_COLORS.find((c) => c.key === form.colorKey)?.classes ??
      SLOT_COLORS[0].classes;
    const data: Omit<PlanningSlot, "id"> = {
      titre: form.titre,
      categorie: form.categorie,
      day: Number(form.day),
      startTime: form.startTime,
      endTime: form.endTime,
      colorClass: colorClasses,
    };
    if (editing) {
      persist(slots.map((s) => (s.id === editing.id ? { ...s, ...data } : s)));
    } else {
      persist([...slots, { id: crypto.randomUUID(), ...data }]);
    }
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Supprimer ce créneau ?")) return;
    persist(slots.filter((s) => s.id !== id));
  };

  if (!loaded) return null;

  return (
    <div className="px-4 pt-8 pb-4 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-800">📅 Mon Planning</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-violet-500 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-sm active:scale-95 transition-transform"
        >
          <Plus size={16} />
          Ajouter
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {DAYS_FULL.map((day, i) => {
          const daySlots = slots.filter((s) => s.day === i);
          const isToday = i === todayDay;
          return (
            <div
              key={day}
              className={`bg-white rounded-3xl p-4 shadow-sm ${isToday ? "border-2 border-violet-400" : ""}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-bold text-gray-700">{day}</h2>
                {isToday && (
                  <span className="text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-semibold">
                    Aujourd&apos;hui
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {daySlots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`rounded-2xl px-4 py-3 border ${slot.colorClass} flex items-center justify-between`}
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{slot.titre}</span>
                      <span className="text-xs opacity-70">
                        {slot.startTime} – {slot.endTime}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(slot)}
                        className="p-1.5 rounded-xl hover:bg-black/10 active:scale-90 transition-transform"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(slot.id)}
                        className="p-1.5 rounded-xl hover:bg-black/10 active:scale-90 transition-transform"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {daySlots.length === 0 && (
                  <p className="text-gray-300 text-sm text-center py-2">
                    Aucun cours
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier le créneau" : "Ajouter un créneau"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label>Titre</Label>
              <Input
                className="rounded-2xl"
                placeholder="Ex: Cours d'arabe"
                value={form.titre}
                onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Catégorie</Label>
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
              <Label>Jour</Label>
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
                <Label>Heure début</Label>
                <Input
                  type="time"
                  className="rounded-2xl"
                  value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <Label>Heure fin</Label>
                <Input
                  type="time"
                  className="rounded-2xl"
                  value={form.endTime}
                  onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Couleur</Label>
              <div className="flex gap-2">
                {SLOT_COLORS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, colorKey: c.key }))}
                    className={`w-8 h-8 rounded-full ${c.dot} transition-transform active:scale-90 ${form.colorKey === c.key ? "ring-2 ring-offset-2 ring-gray-500 scale-110" : ""}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-2xl text-gray-500 font-semibold text-sm hover:bg-gray-100"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={!form.titre || !form.categorie}
              className="px-5 py-2 rounded-2xl bg-violet-500 text-white font-bold text-sm disabled:opacity-40"
            >
              {editing ? "Modifier" : "Ajouter"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
