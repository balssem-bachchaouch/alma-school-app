"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
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
  const [openPreparer, setOpenPreparer] = useState(false);
  const [openArticles, setOpenArticles] = useState(false);
  const [form, setForm] = useState({ label: "", emoji: "", categorie: "École" });
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
    const next: CartableItem[] = [
      ...items,
      { id: crypto.randomUUID(), label: form.label, emoji: form.emoji || undefined, categorie: form.categorie },
    ];
    setItems(next);
    saveCartableItems(next);
    setForm({ label: "", emoji: "", categorie: "École" });
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
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-extrabold" style={{ color: "#3b0764" }}>🎒 Mon Cartable</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setOpenPreparer(true)}
            className="px-3 py-2 rounded-2xl text-sm font-bold active:scale-95 transition-transform"
            style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }}
          >
            ✏️ Préparer
          </button>
          <button
            onClick={() => setOpenArticles(true)}
            className="px-3 py-2 rounded-2xl text-sm font-bold active:scale-95 transition-transform"
            style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }}
          >
            ⚙️ Articles
          </button>
        </div>
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
                  {item.emoji ? `${item.emoji} ` : ""}{item.label}
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

      {/* ── Préparer dialog ── */}
      <Dialog open={openPreparer} onOpenChange={setOpenPreparer}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ color: "#3b0764" }}>Préparer mon cartable</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2 max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: "#9ca3af" }}>
                Aucun article — ajoute-en via ⚙️ Articles.
              </p>
            )}
            {items.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelected(item.id)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer transition-all"
                  style={{
                    background: isSelected ? "rgba(124,58,237,0.08)" : "transparent",
                    border: `1px solid ${isSelected ? "rgba(124,58,237,0.2)" : "transparent"}`,
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                    style={
                      isSelected
                        ? { background: "linear-gradient(135deg, #7c3aed, #ec4899)" }
                        : { border: "2px solid rgba(124,58,237,0.25)", background: "transparent" }
                    }
                  >
                    {isSelected && (
                      <svg width="11" height="8" viewBox="0 0 13 10" fill="none">
                        <path d="M1.5 5L5 8.5L11.5 1" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="font-semibold text-sm flex-1" style={{ color: isSelected ? "#3b0764" : "#6b7280" }}>
                    {item.emoji ? `${item.emoji} ` : ""}{item.label}
                  </span>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <button
              onClick={() => setOpenPreparer(false)}
              className="w-full px-5 py-2.5 rounded-2xl text-white font-bold text-sm"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
            >
              Valider
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Gérer articles dialog ── */}
      <Dialog open={openArticles} onOpenChange={setOpenArticles}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ color: "#3b0764" }}>Gérer les articles</DialogTitle>
          </DialogHeader>

          {/* Existing items list */}
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto py-1">
            {items.length === 0 && (
              <p className="text-sm text-center py-3" style={{ color: "#9ca3af" }}>Aucun article pour l'instant.</p>
            )}
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-2 py-2 rounded-xl" style={{ borderBottom: "1px solid rgba(139,92,246,0.08)" }}>
                <span className="text-sm font-semibold flex-1" style={{ color: "#3b0764" }}>
                  {item.emoji ? `${item.emoji} ` : ""}{item.label}
                </span>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 rounded-lg active:scale-90 transition-transform text-red-500"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* Add form */}
          <div className="flex flex-col gap-3 pt-3" style={{ borderTop: "1px solid rgba(139,92,246,0.15)" }}>
            <div className="flex gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-xs" style={{ color: "#3b0764" }}>Emoji</Label>
                <Input
                  className="rounded-2xl w-20 text-center"
                  placeholder="📚"
                  value={form.emoji}
                  onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-xs" style={{ color: "#3b0764" }}>Nom</Label>
                <Input
                  className="rounded-2xl"
                  placeholder="Ex: Livre de maths"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs" style={{ color: "#3b0764" }}>Catégorie</Label>
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
            <button
              onClick={handleAdd}
              disabled={!form.label}
              className="w-full px-5 py-2.5 rounded-2xl text-white font-bold text-sm disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
            >
              + Ajouter
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
