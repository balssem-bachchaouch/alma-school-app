"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
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
import type { CartableItem } from "@/lib/types";
import { getCartableItems, saveCartableItems } from "@/lib/storage";
import { CATEGORIES_CARTABLE } from "@/lib/constants";

const BURST_COLORS = [
  "#F87171", "#FB923C", "#FBBF24", "#34D399",
  "#60A5FA", "#A78BFA", "#F472B6", "#FCA5A5",
];

export default function CartablePage() {
  const [items, setItems] = useState<CartableItem[]>([]);
  const [checked, setChecked] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ label: "", categorie: "École" });
  const [burstKey, setBurstKey] = useState(0);

  useEffect(() => {
    const savedItems = getCartableItems();
    setItems(savedItems);

    const todayStr = new Date().toISOString().split("T")[0];
    const savedDate = localStorage.getItem("alma_cartable_date");
    if (savedDate !== todayStr) {
      setChecked([]);
      localStorage.setItem("alma_cartable_date", todayStr);
      localStorage.removeItem("alma_cartable_checked");
    } else {
      const raw = localStorage.getItem("alma_cartable_checked");
      setChecked(raw ? (JSON.parse(raw) as string[]) : []);
    }
    setLoaded(true);
  }, []);

  const total = items.length;
  const done = checked.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = total > 0 && done === total;

  useEffect(() => {
    if (allDone) setBurstKey((k) => k + 1);
  }, [allDone]);

  const persistChecked = (next: string[]) => {
    setChecked(next);
    localStorage.setItem("alma_cartable_checked", JSON.stringify(next));
  };

  const toggle = (id: string) =>
    persistChecked(
      checked.includes(id) ? checked.filter((x) => x !== id) : [...checked, id]
    );

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
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    saveCartableItems(next);
    persistChecked(checked.filter((x) => x !== id));
  };

  if (!loaded) return null;

  return (
    <div className="px-4 pt-8 pb-4 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-extrabold text-gray-800">🎒 Mon Cartable</h1>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 bg-violet-500 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-sm active:scale-95 transition-transform"
        >
          <Plus size={16} />
          Ajouter
        </button>
      </div>
      <p className="text-gray-400 text-sm mb-6">Prépare ton cartable pour demain</p>

      {/* Progress */}
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
            <div
              key={item.id}
              className={`rounded-3xl p-4 flex items-center gap-4 shadow-sm transition-all ${isChecked ? "bg-green-50" : "bg-white"}`}
            >
              <button
                onClick={() => toggle(item.id)}
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all active:scale-90 ${isChecked ? "bg-green-400 border-green-400" : "border-gray-300"}`}
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
              </button>
              <span className={`font-semibold text-base flex-1 ${isChecked ? "line-through text-gray-400" : "text-gray-700"}`}>
                {item.label}
              </span>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-1.5 rounded-xl hover:bg-black/5 active:scale-90 transition-transform"
              >
                <Trash2 size={16} className="text-red-400" />
              </button>
            </div>
          );
        })}
      </div>

      {/* 100% animation */}
      {allDone && (
        <div className="mt-8 text-center bg-green-50 rounded-3xl py-8 px-4">
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
          <p className="text-green-600 font-extrabold text-lg">
            Cartable prêt ! Bravo ALMA !
          </p>
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajouter un élément</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label>Nom</Label>
              <Input
                className="rounded-2xl"
                placeholder="Ex: Livre de maths"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Catégorie</Label>
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
              className="px-4 py-2 rounded-2xl text-gray-500 font-semibold text-sm hover:bg-gray-100"
            >
              Annuler
            </button>
            <button
              onClick={handleAdd}
              disabled={!form.label}
              className="px-5 py-2 rounded-2xl bg-violet-500 text-white font-bold text-sm disabled:opacity-40"
            >
              Ajouter
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
