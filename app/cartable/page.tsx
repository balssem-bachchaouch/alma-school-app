"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import type { CartableItem, Badge } from "@/lib/types";
import {
  getCartableItems, saveCartableItems,
  getCartableSelection, saveCartableSelection,
  getCartableChecked, saveCartableChecked,
  getGameStats, getDevoirs, getBadges, saveBadges,
} from "@/lib/storage";
import { CATEGORIES_CARTABLE } from "@/lib/constants";
import { checkAndUnlockBadges } from "@/lib/badges";

const BURST_COLORS = [
  "#F87171", "#FB923C", "#FBBF24", "#34D399",
  "#60A5FA", "#A78BFA", "#F472B6", "#FCA5A5",
];

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function CartablePage() {
  const [items, setItems] = useState<CartableItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ label: "", categorie: "École" });
  const [burstKey, setBurstKey] = useState(0);
  const [badgeToast, setBadgeToast] = useState<Badge | null>(null);
  const wasAllDone = useRef(false);

  useEffect(() => {
    setItems(getCartableItems());

    const today = todayStr();

    const sel = getCartableSelection();
    setSelectedIds(sel.selectedIds);

    const chk = getCartableChecked();
    if (chk.date !== today) {
      saveCartableChecked({ date: today, checkedIds: [] });
      setCheckedIds([]);
    } else {
      setCheckedIds(chk.checkedIds);
    }

    setLoaded(true);
  }, []);

  const total = selectedIds.length;
  const done = checkedIds.filter((id) => selectedIds.includes(id)).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = total > 0 && done === total;

  const statusMessage =
    total === 0
      ? "Prépare ton cartable ce soir 🌙"
      : done === 0
      ? `C'est parti ! ${total} article${total > 1 ? "s" : ""} à mettre`
      : pct < 100
      ? `Continue ! ${total - done} restant${total - done > 1 ? "s" : ""}`
      : "Cartable prêt ! Bravo ! 🎉";

  useEffect(() => {
    if (allDone && !wasAllDone.current) {
      setBurstKey((k) => k + 1);
      const count = parseInt(localStorage.getItem("alma_cartable_completions") ?? "0", 10) + 1;
      localStorage.setItem("alma_cartable_completions", String(count));
      const currentBadges = getBadges();
      const { updatedBadges, newlyUnlocked } = checkAndUnlockBadges(
        getGameStats(), getDevoirs(), currentBadges, count
      );
      saveBadges(updatedBadges);
      if (newlyUnlocked.length > 0) {
        setBadgeToast(newlyUnlocked[0]);
        setTimeout(() => setBadgeToast(null), 3000);
      }
    }
    wasAllDone.current = allDone;
  }, [allDone]);

  const toggleChecked = (id: string) => {
    const next = checkedIds.includes(id)
      ? checkedIds.filter((x) => x !== id)
      : [...checkedIds, id];
    setCheckedIds(next);
    saveCartableChecked({ date: todayStr(), checkedIds: next });
  };

  const toggleSelected = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    setSelectedIds(next);
    saveCartableSelection({ date: todayStr(), selectedIds: next });
  };

  const handleAdd = () => {
    if (!form.label) return;
    const next = [...items, { id: crypto.randomUUID(), label: form.label, categorie: form.categorie }];
    setItems(next);
    saveCartableItems(next);
    setForm({ label: "", categorie: "École" });
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Supprimer cet élément ?")) return;
    const nextItems = items.filter((i) => i.id !== id);
    setItems(nextItems);
    saveCartableItems(nextItems);
    const nextSel = selectedIds.filter((x) => x !== id);
    setSelectedIds(nextSel);
    saveCartableSelection({ date: todayStr(), selectedIds: nextSel });
    const nextChk = checkedIds.filter((x) => x !== id);
    setCheckedIds(nextChk);
    saveCartableChecked({ date: todayStr(), checkedIds: nextChk });
  };

  if (!loaded) return null;

  const selectedItems = items.filter((item) => selectedIds.includes(item.id));

  return (
    <div className="px-4 pt-8 pb-4 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-extrabold" style={{ color: "#3b0764" }}>🎒 Mon Cartable</h1>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-sm active:scale-95 transition-transform"
          style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
        >
          <Plus size={16} />
          Ajouter
        </button>
      </div>
      <p className="text-sm mb-6 font-semibold" style={{ color: "#6d28d9" }}>{statusMessage}</p>

      {/* Progress */}
      {total > 0 && (
        <div
          className="rounded-3xl p-4 mb-6"
          style={{
            background: "#ffffff",
            border: "1px solid rgba(139,92,246,0.2)",
            boxShadow: "0 2px 12px rgba(124,58,237,0.1)",
          }}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold" style={{ color: "#3b0764" }}>
              {done}/{total} éléments prêts
            </span>
            <span className="text-sm font-bold" style={{ color: "#7c3aed" }}>{pct}%</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(124,58,237,0.3)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: "linear-gradient(90deg, #7c3aed, #ec4899)" }}
            />
          </div>
        </div>
      )}

      {/* Checklist — selected items only */}
      {total > 0 && (
        <div className="flex flex-col gap-3 mb-8">
          {selectedItems.map((item) => {
            const isChecked = checkedIds.includes(item.id);
            return (
              <div
                key={item.id}
                className="rounded-3xl p-4 flex items-center gap-4 transition-all"
                style={{
                  background: isChecked ? "rgba(134,239,172,0.1)" : "#ffffff",
                  border: `1px solid ${isChecked ? "rgba(134,239,172,0.3)" : "rgba(139,92,246,0.2)"}`,
                  boxShadow: "0 2px 8px rgba(124,58,237,0.08)",
                }}
              >
                <button
                  onClick={() => toggleChecked(item.id)}
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
                  style={
                    isChecked
                      ? { background: "linear-gradient(135deg, #7c3aed, #ec4899)", border: "none" }
                      : { border: "2px solid rgba(124,58,237,0.3)", background: "transparent" }
                  }
                >
                  {isChecked && (
                    <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                      <path d="M1.5 5L5 8.5L11.5 1" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span
                  className="font-semibold text-base flex-1"
                  style={{
                    color: isChecked ? "#16a34a" : "#3b0764",
                    textDecoration: isChecked ? "line-through" : "none",
                  }}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* 100% celebration */}
      {allDone && (
        <div
          className="mt-2 mb-8 text-center rounded-3xl py-8 px-4"
          style={{
            background: "rgba(124,58,237,0.08)",
            border: "1px solid rgba(236,72,153,0.3)",
          }}
        >
          <div className="relative h-20 flex items-center justify-center mb-2">
            {BURST_COLORS.map((color, i) => {
              const angle = (i * 360) / 8;
              const rad = (angle * Math.PI) / 180;
              const dx = Math.round(Math.cos(rad) * 56);
              const dy = Math.round(Math.sin(rad) * 56);
              return (
                <motion.div
                  key={`${burstKey}-${i}`}
                  className="absolute w-4 h-4 rounded-full"
                  style={{ backgroundColor: color }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{ x: dx, y: dy, opacity: 0, scale: 0 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              );
            })}
            <span className="text-4xl relative z-10">🎉</span>
          </div>
          <p className="font-extrabold text-lg" style={{ color: "#ec4899" }}>
            Cartable prêt ! Bravo ALMA !
          </p>
        </div>
      )}

      {/* Master list — select which items to bring */}
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#9ca3af" }}>
          Tous les articles
        </p>
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <div
                key={item.id}
                className="rounded-3xl p-4 flex items-center gap-4 transition-all"
                style={{
                  background: isSelected ? "rgba(124,58,237,0.06)" : "#ffffff",
                  border: `1px solid ${isSelected ? "rgba(124,58,237,0.25)" : "rgba(139,92,246,0.1)"}`,
                  boxShadow: "0 1px 4px rgba(124,58,237,0.06)",
                }}
              >
                <button
                  onClick={() => toggleSelected(item.id)}
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
                  style={
                    isSelected
                      ? { background: "linear-gradient(135deg, #7c3aed, #ec4899)", border: "none" }
                      : { border: "2px solid rgba(124,58,237,0.2)", background: "transparent" }
                  }
                >
                  {isSelected && (
                    <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                      <path d="M1.5 5L5 8.5L11.5 1" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span
                  className="font-semibold text-base flex-1"
                  style={{ color: isSelected ? "#7c3aed" : "#6b7280" }}
                >
                  {item.label}
                </span>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2.5 rounded-xl active:scale-90 transition-transform text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badge toast */}
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

      {/* Add dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ color: "#3b0764" }}>Ajouter un élément</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Nom</Label>
              <Input
                className="rounded-2xl"
                placeholder="Ex: Livre de maths"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Catégorie</Label>
              <Select
                value={form.categorie}
                onValueChange={(v) => setForm((f) => ({ ...f, categorie: v ?? f.categorie }))}
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES_CARTABLE.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
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
              onClick={handleAdd}
              disabled={!form.label}
              className="px-5 py-2 rounded-2xl text-white font-bold text-sm disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
            >
              Ajouter
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
