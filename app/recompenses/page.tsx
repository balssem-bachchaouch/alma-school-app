"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  BOUTIQUE_ITEMS, getOwnedItems, buyItem,
  getActiveTitle, setActiveTitle,
  getActiveDeco, setActiveDeco,
  getActiveTheme, setActiveTheme,
  type BoutiqueItem,
} from "@/lib/boutique";
import { getGameStats, saveGameStats } from "@/lib/storage";

const CATEGORY_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  titre:  { label: "Titres",        emoji: "🏷️", color: "#7c3aed" },
  deco:   { label: "Décorations",   emoji: "🎨", color: "#ec4899" },
  theme:  { label: "Thèmes",        emoji: "🎭", color: "#0ea5e9" },
  bonus:  { label: "Bonus",         emoji: "⚡", color: "#f59e0b" },
};

const HOW_TO_EARN = [
  { emoji: "📚", text: "Terminer un devoir", coins: "+10 🪙" },
  { emoji: "🔥", text: "Série de 5 jours",   coins: "+bonus 🪙" },
  { emoji: "🎯", text: "Tous les devoirs du jour", coins: "+badge 🏅" },
];

export default function RecompensesPage() {
  const [coins, setCoins] = useState(0);
  const [owned, setOwned] = useState<string[]>([]);
  const [activeTitle, setActiveTitleState] = useState<string | null>(null);
  const [activeDeco, setActiveDecoState] = useState<string | null>(null);
  const [activeTheme, setActiveThemeState] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("tout");
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const stats = getGameStats();
    setCoins(stats.coins);
    setOwned(getOwnedItems());
    setActiveTitleState(getActiveTitle());
    setActiveDecoState(getActiveDeco());
    setActiveThemeState(getActiveTheme());
    setLoaded(true);
  }, []);

  const handleBuy = (item: BoutiqueItem) => {
    if (owned.includes(item.id)) {
      // Toggle active
      if (item.category === "titre") {
        const next = activeTitle === item.preview ? null : (item.preview ?? null);
        setActiveTitle(next);
        setActiveTitleState(next);
        setToast(next ? `${item.emoji} "${item.name}" activé !` : "Titre retiré");
      } else if (item.category === "deco") {
        const next = activeDeco === item.preview ? null : (item.preview ?? null);
        setActiveDeco(next);
        setActiveDecoState(next);
        setToast(next ? `${item.emoji} "${item.name}" activé !` : "Décoration retirée");
      } else if (item.category === "theme") {
        const next = activeTheme === item.preview ? null : (item.preview ?? null);
        setActiveTheme(next);
        setActiveThemeState(next);
        setToast(next ? `${item.emoji} Thème "${item.name}" activé !` : "Thème retiré");
      }
      setTimeout(() => setToast(null), 2000);
      return;
    }

    if (coins < item.cost) {
      setToast(`Il te manque ${item.cost - coins} 🪙 pour acheter ça !`);
      setTimeout(() => setToast(null), 2500);
      return;
    }

    const stats = getGameStats();
    const newCoins = stats.coins - item.cost;
    saveGameStats({ ...stats, coins: newCoins });
    setCoins(newCoins);
    buyItem(item.id);
    setOwned(prev => [...prev, item.id]);

    // Auto-activate after purchase
    if (item.category === "titre" && item.preview) {
      setActiveTitle(item.preview);
      setActiveTitleState(item.preview);
    } else if (item.category === "deco" && item.preview) {
      setActiveDeco(item.preview);
      setActiveDecoState(item.preview);
    } else if (item.category === "theme" && item.preview) {
      setActiveTheme(item.preview);
      setActiveThemeState(item.preview);
    }

    setToast(`🎉 Tu as acheté "${item.name}" !`);
    setTimeout(() => setToast(null), 2500);
  };

  const filteredItems = activeTab === "tout"
    ? BOUTIQUE_ITEMS
    : BOUTIQUE_ITEMS.filter(i => i.category === activeTab);

  if (!loaded) return null;

  const ownedCount = owned.length;
  const totalItems = BOUTIQUE_ITEMS.length;

  return (
    <div className="px-4 pt-6 pb-28 max-w-md mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/"
          className="text-sm font-semibold px-3 py-1.5 rounded-xl active:scale-90 transition-transform"
          style={{ color: "#a78bfa", background: "rgba(139,92,246,0.15)" }}
        >
          ← Accueil
        </Link>
        <h1 className="text-2xl font-extrabold" style={{ color: "#3b0764" }}>🛍️ Boutique</h1>
      </div>

      {/* Coin balance — HERO */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="rounded-3xl p-5 mb-5 relative overflow-hidden text-center"
        style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", boxShadow: "0 8px 32px rgba(245,158,11,0.35)" }}
      >
        {/* Floating coins bg */}
        {["🪙","💰","🪙","✨","🪙"].map((e, i) => (
          <motion.span
            key={i}
            className="absolute text-xl opacity-20 select-none pointer-events-none"
            style={{ left: `${10 + i * 20}%`, top: "10%" }}
            animate={{ y: [0, -12, 0], rotate: [-5, 5, -5] }}
            transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
          >
            {e}
          </motion.span>
        ))}
        <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1">Ta tirelire</p>
        <motion.p
          key={coins}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400 }}
          className="text-5xl font-extrabold text-white mb-1"
        >
          🪙 {coins}
        </motion.p>
        <p className="text-sm text-white/80 font-semibold">pièces disponibles</p>
        <div className="flex justify-center gap-4 mt-3">
          <div className="bg-white/20 rounded-2xl px-3 py-1.5 text-center">
            <p className="text-xs text-white/70">Objets possédés</p>
            <p className="text-lg font-extrabold text-white">{ownedCount}/{totalItems}</p>
          </div>
          <div className="bg-white/20 rounded-2xl px-3 py-1.5 text-center">
            <p className="text-xs text-white/70">Prochain objet</p>
            <p className="text-lg font-extrabold text-white">
              {BOUTIQUE_ITEMS.filter(i => !owned.includes(i.id)).sort((a,b) => a.cost - b.cost)[0]?.cost ?? "—"}🪙
            </p>
          </div>
        </div>
      </motion.div>

      {/* Comment gagner des pièces */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-3xl p-4 mb-5"
        style={{ background: "linear-gradient(135deg, #f5f3ff, #ede9fe)", border: "1px solid rgba(124,58,237,0.15)" }}
      >
        <p className="text-sm font-extrabold mb-3" style={{ color: "#7c3aed" }}>💡 Comment gagner des 🪙 ?</p>
        <div className="flex flex-col gap-2">
          {HOW_TO_EARN.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.07 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{item.emoji}</span>
                <span className="text-sm font-semibold" style={{ color: "#3b0764" }}>{item.text}</span>
              </div>
              <span className="text-sm font-extrabold" style={{ color: "#d97706" }}>{item.coins}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { key: "tout", label: "Tout", emoji: "🛍️" },
          ...Object.entries(CATEGORY_LABELS).map(([k, v]) => ({ key: k, label: v.label, emoji: v.emoji })),
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
            style={activeTab === tab.key
              ? { background: "#7c3aed", color: "#fff" }
              : { background: "rgba(124,58,237,0.08)", color: "#6d28d9" }}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* Catalogue */}
      <div className="grid grid-cols-2 gap-3">
        {filteredItems.map((item, i) => {
          const isOwned = owned.includes(item.id);
          const canAfford = coins >= item.cost;
          const isActive =
            (item.category === "titre" && activeTitle === item.preview) ||
            (item.category === "deco" && activeDeco === item.preview) ||
            (item.category === "theme" && activeTheme === item.preview);
          const catCfg = CATEGORY_LABELS[item.category];

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20, scale: 0.93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 22, delay: i * 0.05 }}
              className="rounded-3xl p-4 flex flex-col gap-2 relative"
              style={{
                background: isOwned
                  ? isActive ? "linear-gradient(135deg, #f5f3ff, #ede9fe)" : "#f9f7ff"
                  : canAfford ? "#ffffff" : "#fafafa",
                border: isActive
                  ? "2px solid #7c3aed"
                  : isOwned ? "1px solid rgba(124,58,237,0.3)"
                  : "1px solid rgba(139,92,246,0.15)",
                boxShadow: isActive
                  ? "0 4px 20px rgba(124,58,237,0.2)"
                  : "0 2px 12px rgba(124,58,237,0.06)",
                opacity: !isOwned && !canAfford ? 0.65 : 1,
              }}
            >
              {/* Badge owned/active */}
              {isActive && (
                <div className="absolute top-2 right-2 text-xs font-extrabold px-2 py-0.5 rounded-full text-white"
                  style={{ background: "#7c3aed", fontSize: 10 }}>
                  ACTIF
                </div>
              )}
              {isOwned && !isActive && (
                <div className="absolute top-2 right-2 text-xs font-extrabold px-2 py-0.5 rounded-full"
                  style={{ background: "#d1fae5", color: "#10b981", fontSize: 10 }}>
                  ✓
                </div>
              )}

              <span className="text-3xl">{item.emoji}</span>
              <div>
                <p className="font-extrabold text-sm leading-tight" style={{ color: "#3b0764" }}>{item.name}</p>
                <p className="text-xs mt-0.5 leading-snug" style={{ color: "#6d28d9" }}>{item.description}</p>
              </div>

              {/* Category chip */}
              <div className="text-xs font-semibold px-2 py-0.5 rounded-full w-fit"
                style={{ background: `${catCfg.color}18`, color: catCfg.color }}>
                {catCfg.emoji} {catCfg.label}
              </div>

              {/* Buy / Activate button */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => handleBuy(item)}
                className="mt-auto w-full py-2 rounded-2xl text-xs font-extrabold transition-all"
                style={
                  isActive
                    ? { background: "rgba(124,58,237,0.15)", color: "#7c3aed" }
                    : isOwned
                    ? { background: "linear-gradient(135deg, #7c3aed, #ec4899)", color: "#fff" }
                    : canAfford
                    ? { background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff" }
                    : { background: "rgba(0,0,0,0.06)", color: "#9ca3af" }
                }
              >
                {isActive ? "🔵 Désactiver"
                  : isOwned ? "▶ Activer"
                  : canAfford ? `Acheter · ${item.cost} 🪙`
                  : `${item.cost} 🪙 manquantes`}
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-bold text-white whitespace-nowrap shadow-xl"
            style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
