"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Calendar, ListTodo, MoreHorizontal, X, Timer, FlipHorizontal2, Target, Trophy, BarChart3, Calculator, Users, GraduationCap, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const mainTabs = [
  { href: "/", icon: Home, label: "Accueil" },
  { href: "/devoirs", icon: BookOpen, label: "Devoirs" },
  { href: "/taches", icon: ListTodo, label: "Tâches" },
  { href: "/planning", icon: Calendar, label: "Planning" },
];

const moreTabs = [
  { href: "/pomodoro", icon: Timer, label: "Pomodoro" },
  { href: "/flashcards", icon: FlipHorizontal2, label: "Flashcards" },
  { href: "/defis", icon: Target, label: "Défis" },
  { href: "/badges", icon: Trophy, label: "Badges" },
  { href: "/stats", icon: BarChart3, label: "Stats" },
  { href: "/moyenne", icon: Calculator, label: "Moyennes" },
  { href: "/recompenses", icon: ShoppingBag, label: "Boutique" },
  { href: "/cours", icon: GraduationCap, label: "Cours" },
  { href: "/parent", icon: Users, label: "Parents" },
];

function useTachesEnRetard() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    fetch("/api/taches")
      .then(r => r.ok ? r.json() : [])
      .then((data: { statut: string; dueDate?: string }[]) => {
        setCount(data.filter(t => t.statut !== "Terminé" && t.dueDate && t.dueDate < today).length);
      })
      .catch(() => {});
  }, []);
  return count;
}

export default function BottomNav() {
  const pathname = usePathname();
  const tachesEnRetard = useTachesEnRetard();
  const [showMore, setShowMore] = useState(false);

  if (pathname === "/login" || pathname === "/register") return null;

  const isMoreActive = moreTabs.some(t => t.href === pathname);

  return (
    <>
      {/* More drawer */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }}
              onClick={() => setShowMore(false)} />
            <motion.div
              initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed bottom-24 left-4 right-4 z-50 md:hidden rounded-3xl p-4"
              style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(24px)", border: "1px solid rgba(139,92,246,0.15)", boxShadow: "0 8px 32px rgba(124,58,237,0.2)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-extrabold" style={{ color: "#3b0764" }}>Plus d&apos;options</span>
                <button onClick={() => setShowMore(false)} className="p-1 rounded-xl" style={{ background: "rgba(139,92,246,0.1)", color: "#7c3aed" }}>
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {moreTabs.map(({ href, icon: Icon, label }) => {
                  const active = pathname === href;
                  return (
                    <Link key={href} href={href} onClick={() => setShowMore(false)}
                      className="flex flex-col items-center gap-1 p-3 rounded-2xl transition-all"
                      style={active ? { background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(236,72,153,0.1))" } : { background: "rgba(139,92,246,0.05)" }}>
                      <Icon size={20} style={{ color: active ? "#7c3aed" : "#6b7280" }} strokeWidth={active ? 2.5 : 1.8} />
                      <span className="text-xs font-semibold text-center leading-tight" style={{ color: active ? "#7c3aed" : "#6b7280" }}>{label}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main nav */}
      <nav className="fixed z-50 md:hidden" style={{ bottom: 16, left: "50%", transform: "translateX(-50%)", width: "calc(100% - 32px)", maxWidth: 420 }}>
        <div className="flex items-center justify-around px-3 py-2.5 rounded-[28px]"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            boxShadow: "0 8px 32px rgba(124,58,237,0.2), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
            border: "1px solid rgba(255,255,255,0.9)",
          }}>
          {mainTabs.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            const badge = href === "/taches" && tachesEnRetard > 0 ? tachesEnRetard : 0;
            return (
              <Link key={href} href={href} aria-label={label} className="flex flex-col items-center gap-1 px-3 py-1">
                <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl transition-all"
                  style={active ? { background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(236,72,153,0.1))" } : {}}>
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.8} style={{ color: active ? "#7c3aed" : "#9ca3af" }} />
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
                      style={{ background: "#dc2626", fontSize: 9 }}>
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </div>
                <span className="rounded-full" style={{ width: 4, height: 4, background: active ? "linear-gradient(135deg, #7c3aed, #ec4899)" : "transparent", transition: "background 0.2s" }} />
              </Link>
            );
          })}

          {/* More button */}
          <button aria-label="Plus" onClick={() => setShowMore(s => !s)} className="flex flex-col items-center gap-1 px-3 py-1">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl transition-all"
              style={isMoreActive || showMore ? { background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(236,72,153,0.1))" } : {}}>
              {showMore ? <X size={20} style={{ color: "#7c3aed" }} /> : <MoreHorizontal size={20} style={{ color: isMoreActive ? "#7c3aed" : "#9ca3af" }} strokeWidth={isMoreActive ? 2.5 : 1.8} />}
            </div>
            <span className="rounded-full" style={{ width: 4, height: 4, background: isMoreActive || showMore ? "linear-gradient(135deg, #7c3aed, #ec4899)" : "transparent", transition: "background 0.2s" }} />
          </button>
        </div>
      </nav>
    </>
  );
}
