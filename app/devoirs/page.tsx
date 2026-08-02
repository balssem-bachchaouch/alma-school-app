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
import { getDevoirs, saveDevoirs, getGameStats, saveGameStats, getBadges, saveBadges } from "@/lib/storage";
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
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Devoir | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [coinToast, setCoinToast] = useState<string | null>(null);
  const [badgeToast, setBadgeToast] = useState<Badge | null>(null);

  useEffect(() => {
    setDevoirs(getDevoirs());
    setLoaded(true);
  }, []);

  const persist = (updated: Devoir[]) => {
    setDevoirs(updated);
    saveDevoirs(updated);
  };

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

  const handleSubmit = () => {
    if (!form.matiere || !form.titre || !form.dueDate) return;
    if (editing) {
      persist(devoirs.map((d) => (d.id === editing.id ? { ...d, ...form } : d)));
    } else {
      persist([...devoirs, { id: crypto.randomUUID(), ...form, completed: false }]);
    }
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Supprimer ce devoir ?")) return;
    persist(devoirs.filter((d) => d.id !== id));
  };

  const toggle = (id: string) => {
    const devoir = devoirs.find((d) => d.id === id);
    if (!devoir) return;

    const nowCompleted = !devoir.completed;
    const updated = devoirs.map((d) => (d.id === id ? { ...d, completed: nowCompleted } : d));
    persist(updated);

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

  if (!loaded) return null;

  const groups = devoirs.reduce<Record<string, Devoir[]>>((acc, d) => {
    const label = getDateLabel(d.dueDate);
    acc[label] = [...(acc[label] ?? []), d];
    return acc;
  }, {});

  const sortedGroups = Object.entries(groups).sort(([a], [b]) => {
    const ai = DATE_ORDER.indexOf(a);
    const bi = DATE_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <div className="px-4 pt-8 pb-4 max-w-md mx-auto">
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

      {sortedGroups.length === 0 && (
        <p className="text-center mt-16 text-lg" style={{ color: "#7c3aed" }}>Aucun devoir 🎉</p>
      )}

      {sortedGroups.map(([label, items]) => (
        <div key={label} className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#3b0764" }}>
            {label}
          </h2>
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
                      className="p-1.5 rounded-xl active:scale-90 transition-transform"
                      style={{ color: "#7c3aed" }}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="p-1.5 rounded-xl active:scale-90 transition-transform text-red-500"
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
