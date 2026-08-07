"use client";

import { useEffect, useState } from "react";
import { Plus, Clock, CheckCircle2, Circle, Pencil, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import type { Devoir, Badge } from "@/lib/types";
import { getGameStats, saveGameStats, getBadges, saveBadges } from "@/lib/storage";
import { getMatiereConfig, MATIERES, DUREES } from "@/lib/constants";
import { updateStreak } from "@/lib/streak";
import { checkAndUnlockBadges } from "@/lib/badges";

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const afterTomorrow = new Date(today);
  afterTomorrow.setDate(afterTomorrow.getDate() + 2);

  if (date.getTime() === today.getTime()) return "Aujourd'hui";
  if (date.getTime() === tomorrow.getTime()) return "Demain";
  if (date.getTime() === afterTomorrow.getTime()) return "Après-demain";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

const DATE_ORDER = ["Aujourd'hui", "Demain", "Après-demain"];
const EMPTY_FORM = { matiere: "", titre: "", dueDate: "", duree: "30 min" };

const CARD = {
  background: "#ffffff",
  border: "1px solid rgba(139,92,246,0.2)",
  boxShadow: "0 2px 12px rgba(124,58,237,0.1)",
};

export default function DevoirsPage() {
  const [devoirs, setDevoirs] = useState<Devoir[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Devoir | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [coinToast, setCoinToast] = useState<string | null>(null);
  const [badgeToast, setBadgeToast] = useState<Badge | null>(null);

  const loadDevoirs = async () => {
    try {
      const res = await fetch("/api/devoirs");
      if (!res.ok) throw new Error("Erreur de chargement");
      const data: Devoir[] = await res.json();
      setDevoirs(data);
      setError(null);
    } catch {
      setError("Impossible de charger les devoirs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDevoirs(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, dueDate: new Date().toISOString().split("T")[0] });
    setOpen(true);
  };

  const openEdit = (d: Devoir) => {
    setEditing(d);
    setForm({ matiere: d.matiere, titre: d.titre, dueDate: d.dueDate, duree: d.duree });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.matiere || !form.titre || !form.dueDate) return;

    if (editing) {
      const res = await fetch(`/api/devoirs/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const updated: Devoir = await res.json();
        setDevoirs((prev) => prev.map((d) => (d.id === editing.id ? updated : d)));
      }
    } else {
      const res = await fetch("/api/devoirs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const created: Devoir = await res.json();
        setDevoirs((prev) => [...prev, created]);
      }
    }
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer ce devoir ?")) return;
    const res = await fetch(`/api/devoirs/${id}`, { method: "DELETE" });
    if (res.ok) setDevoirs((prev) => prev.filter((d) => d.id !== id));
  };

  const toggle = async (id: string) => {
    const devoir = devoirs.find((d) => d.id === id);
    if (!devoir) return;

    const nowCompleted = !devoir.completed;
    const updated = devoirs.map((d) => (d.id === id ? { ...d, completed: nowCompleted } : d));
    setDevoirs(updated);

    fetch(`/api/devoirs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: nowCompleted }),
    });

    if (nowCompleted) {
      const streakStats = updateStreak(getGameStats());
      const newStats = { ...streakStats, coins: streakStats.coins + 10, totalCompleted: streakStats.totalCompleted + 1 };
      saveGameStats(newStats);
      setCoinToast(id);
      setTimeout(() => setCoinToast(null), 1100);

      const cartableCompletions = parseInt(localStorage.getItem("alma_cartable_completions") ?? "0", 10);
      const currentBadges = getBadges();
      const { updatedBadges, newlyUnlocked } = checkAndUnlockBadges(newStats, updated, currentBadges, cartableCompletions);
      saveBadges(updatedBadges);
      if (newlyUnlocked.length > 0) {
        setBadgeToast(newlyUnlocked[0]);
        setTimeout(() => setBadgeToast(null), 3000);
      }
    } else {
      const stats = getGameStats();
      saveGameStats({ ...stats, coins: Math.max(0, stats.coins - 10) });
    }
  };

  const groups = devoirs.reduce<Record<string, Devoir[]>>((acc, d) => {
    const label = getDateLabel(d.dueDate);
    acc[label] = [...(acc[label] ?? []), d];
    return acc;
  }, { "Aujourd'hui": [], "Demain": [], "Après-demain": [] });

  const sortedGroups = Object.entries(groups).sort(([a], [b]) => {
    const ai = DATE_ORDER.indexOf(a);
    const bi = DATE_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <div className="px-4 pt-8 pb-24 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold" style={{ color: "#3b0764" }}>📚 Mes Devoirs</h1>
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
            onClick={loadDevoirs}
            className="text-sm px-4 py-2 rounded-2xl text-white font-semibold"
            style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
          >
            Réessayer
          </button>
        </div>
      )}

      {!loading && !error && devoirs.length === 0 && (
        <div
          className="rounded-2xl py-12 px-6 text-center mt-8"
          style={{
            background: "#ffffff",
            boxShadow: "0 2px 12px rgba(124,58,237,0.08)",
            border: "1px solid rgba(139,92,246,0.15)",
          }}
        >
          <p className="text-6xl mb-4">📚</p>
          <p className="font-bold text-lg mb-1" style={{ color: "#3b0764" }}>Pas encore de devoirs !</p>
          <p className="text-sm mb-6" style={{ color: "#6d28d9" }}>Ajoute ton premier devoir ici 🎉</p>
          <button
            onClick={openAdd}
            className="px-5 py-2.5 rounded-2xl text-white font-bold text-sm active:scale-95 transition-transform"
            style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
          >
            + Ajouter un devoir
          </button>
        </div>
      )}

      {!loading && !error && sortedGroups.map(([label, items]) => (
        <div key={label} className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#3b0764" }}>
            {label}
          </h2>
          {items.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: "#6d28d9" }}>
              🎉 Aucun devoir — tu es libre !
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((d) => {
                const cfg = getMatiereConfig(d.matiere);
                return (
                  <div
                    key={d.id}
                    className={`relative rounded-[20px] p-4 flex items-center gap-3 transition-opacity ${d.completed ? "opacity-50" : ""}`}
                    style={CARD}
                  >
                    <div className={`w-3 h-3 rounded-full ${cfg.dot} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full opacity-90 ${cfg.badge}`}>
                        {d.matiere}
                      </span>
                      <p className={`font-semibold mt-1.5 text-sm ${d.completed ? "line-through" : ""}`} style={{ color: "#3b0764" }}>
                        {d.titre}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock size={12} style={{ color: "#6d28d9" }} />
                        <span className="text-xs" style={{ color: "#6d28d9" }}>{d.duree}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 relative">
                      <button
                        onClick={() => openEdit(d)}
                        className="p-2.5 rounded-xl active:scale-90 transition-transform"
                        style={{ color: "#7c3aed" }}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="p-2.5 rounded-xl active:scale-90 transition-transform text-red-500"
                      >
                        <Trash2 size={15} />
                      </button>
                      <button onClick={() => toggle(d.id)} className="active:scale-90 transition-transform relative">
                        {d.completed
                          ? <CheckCircle2 size={28} className="text-green-500" />
                          : <Circle size={28} style={{ color: "rgba(124,58,237,0.3)" }} />}
                        <AnimatePresence>
                          {coinToast === d.id && (
                            <motion.span
                              key="toast"
                              initial={{ y: 0, opacity: 1 }}
                              animate={{ y: -40, opacity: 0 }}
                              exit={{}}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="absolute left-1/2 -translate-x-1/2 bottom-full text-sm font-bold pointer-events-none whitespace-nowrap"
                              style={{ color: "#f59e0b" }}
                            >
                              +10 🪙
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* ── BADGE TOAST ── */}
      <AnimatePresence>
        {badgeToast && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white whitespace-nowrap shadow-lg"
            style={{ background: "#3b0764", border: "1px solid rgba(139,92,246,0.4)" }}
          >
            🏅 Nouveau badge : {badgeToast.emoji} {badgeToast.name} !
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ color: "#3b0764" }}>
              {editing ? "Modifier le devoir" : "Ajouter un devoir"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Matière</Label>
              <Select
                value={form.matiere}
                onValueChange={(v) => setForm((f) => ({ ...f, matiere: v ?? f.matiere }))}
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Choisir une matière" />
                </SelectTrigger>
                <SelectContent>
                  {MATIERES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Titre</Label>
              <Input
                className="rounded-2xl"
                placeholder="Ex: Exercices page 45"
                value={form.titre}
                onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Date limite</Label>
              <Input
                type="date"
                className="rounded-2xl"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Durée estimée</Label>
              <Select
                value={form.duree}
                onValueChange={(v) => setForm((f) => ({ ...f, duree: v ?? f.duree }))}
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DUREES.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-2xl font-semibold text-sm"
              style={{ color: "#7c3aed" }}
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={!form.matiere || !form.titre || !form.dueDate}
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
