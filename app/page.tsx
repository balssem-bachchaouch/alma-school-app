"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, Circle, LogOut, Moon, Sun } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/components/ThemeProvider";
import type { Devoir, GameStats, Badge } from "@/lib/types";
import HelpButton from "@/components/HelpButton";

const ACCUEIL_GUIDE = [
  {
    emoji: "🏠",
    title: "Tableau de bord",
    items: [
      "L'accueil affiche tes devoirs du jour et de demain en priorité.",
      "Le compteur 🪙 montre tes pièces gagnées en complétant des devoirs.",
      "La série 🔥 indique ton nombre de jours consécutifs d'activité.",
    ],
  },
  {
    emoji: "📚",
    title: "Navigation",
    items: [
      "Utiliser la barre du bas (mobile) ou le menu de gauche (desktop) pour naviguer.",
      "Devoirs : gérer tes devoirs scolaires.",
      "Planning : voir ton emploi du temps hebdomadaire.",
      "Tâches : gérer tes tâches personnelles, scolaires et d'étude.",
      "Cours : suivre tes cours particuliers et paiements.",
    ],
  },
  {
    emoji: "👤",
    title: "Compte",
    items: [
      "Cliquer sur l'avatar 👧 en haut à droite pour accéder au menu.",
      "L'icône 📚 ouvre la gestion de tes matières personnalisées.",
    ],
  },
];
import {
  getGameStats,
  saveGameStats,
  getBadges,
  saveBadges,
} from "@/lib/storage";
import { getMatiereConfig } from "@/lib/constants";
import { updateStreak } from "@/lib/streak";
import { checkAndUnlockBadges } from "@/lib/badges";
import Mascotte, { getMascotteState, getMascotteMessage } from "@/components/Mascotte";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}
function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}
function getTodayFr() {
  const s = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function streakLabel(streak: number): string {
  if (streak === 0) return "Commence ta série !";
  if (streak === 1) return "1 jour de suite ! 🔥";
  return `${streak} jours de suite ! 🔥`;
}

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [devoirs, setDevoirs] = useState<Devoir[]>([]);
  const [devoirsLoading, setDevoirsLoading] = useState(true);
  const [stats, setStats] = useState<GameStats>({ coins: 0, totalCompleted: 0, lastActiveDate: "", streak: 0 });
  const [badges, setBadges] = useState<Badge[]>([]);
  const [celebrating, setCelebrating] = useState(false);
  const [badgeToast, setBadgeToast] = useState<Badge | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [prochaineSeance, setProchaineSeance] = useState<{ nom: string; date: string; heure: string } | null>(null);
  const initialized = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const rawStats = getGameStats();
    const updated = updateStreak(rawStats);
    saveGameStats(updated);
    setStats(updated);
    setBadges(getBadges());
    setLoaded(true);

    fetch("/api/devoirs")
      .then((r) => r.ok ? r.json() : [])
      .then((data: Devoir[]) => setDevoirs(data))
      .catch(() => {})
      .finally(() => setDevoirsLoading(false));

    fetch("/api/cours")
      .then(r => r.ok ? r.json() : [])
      .then((cours: { nom: string; jours: { day: number; startTime: string }[]; cycles: { seances: { datePrevu: string; done: boolean }[] }[] }[]) => {
        const todayISO = new Date().toISOString().split("T")[0];
        type Candidate = { nom: string; date: string; heure: string };
        const candidates: Candidate[] = [];
        for (const c of cours) {
          for (const cy of c.cycles) {
            for (const s of cy.seances) {
              if (!s.done && s.datePrevu >= todayISO) {
                const jour = c.jours.find(j => ((new Date(s.datePrevu + "T12:00:00").getDay() + 6) % 7) === j.day);
                candidates.push({ nom: c.nom, date: s.datePrevu, heure: jour?.startTime ?? "" });
              }
            }
          }
        }
        candidates.sort((a, b) => a.date.localeCompare(b.date));
        if (candidates[0]) setProchaineSeance(candidates[0]);
      })
      .catch(() => {});
  }, []);

  const today = todayStr();
  const tomorrow = tomorrowStr();

  const devoirsAujourdhui = devoirs.filter((d) => d.dueDate === today);
  const devoirsDemain = devoirs.filter((d) => d.dueDate === tomorrow);
  const devoirsEnRetard = devoirs.filter((d) => !d.completed && d.dueDate < today);
  const nextPending = devoirsAujourdhui.find((d) => !d.completed);

  const mascotteState = getMascotteState(stats, devoirs, celebrating);

  const toggle = async (id: string) => {
    const devoir = devoirs.find((d) => d.id === id);
    if (!devoir) return;
    const nowCompleted = !devoir.completed;
    const updatedDevoirs = devoirs.map((d) => (d.id === id ? { ...d, completed: nowCompleted } : d));
    setDevoirs(updatedDevoirs);

    fetch(`/api/devoirs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: nowCompleted }),
    });

    if (nowCompleted) {
      const streakStats = updateStreak(getGameStats());
      const newStats: GameStats = {
        ...streakStats,
        coins: streakStats.coins + 10,
        totalCompleted: streakStats.totalCompleted + 1,
      };
      saveGameStats(newStats);
      setStats(newStats);

      const cartableCompletions = parseInt(localStorage.getItem("alma_cartable_completions") ?? "0", 10);
      const currentBadges = getBadges();
      const { updatedBadges, newlyUnlocked } = checkAndUnlockBadges(
        newStats, updatedDevoirs, currentBadges, cartableCompletions
      );
      saveBadges(updatedBadges);
      setBadges(updatedBadges);
      if (newlyUnlocked.length > 0) {
        setCelebrating(true);
        setBadgeToast(newlyUnlocked[0]);
        setTimeout(() => { setCelebrating(false); setBadgeToast(null); }, 3000);
      }
    } else {
      const rawStats = getGameStats();
      const newStats: GameStats = { ...rawStats, coins: Math.max(0, rawStats.coins - 10) };
      saveGameStats(newStats);
      setStats(newStats);
    }
  };

  const { theme, toggle: toggleTheme } = useTheme();
  const unlockedBadges = badges.filter((b) => b.unlocked);
  const badgeSlots: (Badge | null)[] = [
    ...unlockedBadges.slice(0, 3),
    ...Array<null>(Math.max(0, 3 - unlockedBadges.length)).fill(null),
  ].slice(0, 3);

  if (!loaded) return null;

  return (
    <div className="px-4 pt-4 pb-24 max-w-md mx-auto">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between mb-3">
        <motion.div
          key={stats.coins}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
        >
          🪙 {stats.coins}
        </motion.div>
        <span className="text-xs font-bold tracking-widest" style={{ color: "#7c3aed" }}>
          ALMA
        </span>
        <div className="flex items-center gap-2">
          <Link href="/matieres" className="w-8 h-8 rounded-full flex items-center justify-center text-base active:scale-90 transition-transform" style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }} title="Matières">
            📚
          </Link>
          <Link href="/stats" className="w-8 h-8 rounded-full flex items-center justify-center text-base active:scale-90 transition-transform" style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }} title="Statistiques">
            📊
          </Link>
          <button
            onClick={toggleTheme}
            className="md:hidden w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }}
            title={theme === "dark" ? "Mode clair" : "Mode sombre"}
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <HelpButton pageTitle="Accueil" sections={ACCUEIL_GUIDE} />
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen((v) => !v)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-base active:scale-90 transition-transform"
              style={{ background: "linear-gradient(135deg, #ec4899, #8b5cf6)" }}
            >
              👧
            </button>
            {isMenuOpen && (
              <div
                className="absolute top-full right-0 mt-2 z-50 bg-white rounded-2xl p-2 min-w-[160px]"
                style={{ boxShadow: "0 8px 24px rgba(124,58,237,0.18)", border: "1px solid rgba(139,92,246,0.15)" }}
              >
                <button
                  onClick={() => { setIsMenuOpen(false); router.push("/perso"); }}
                  className="block w-full text-left px-4 py-2.5 rounded-xl hover:bg-violet-50 font-semibold text-sm transition-colors"
                  style={{ color: "#3b0764" }}
                >
                  ✨ Mon Espace
                </button>
                {session?.user?.role === "admin" && (
                  <button
                    onClick={() => { setIsMenuOpen(false); router.push("/admin"); }}
                    className="block w-full text-left px-4 py-2.5 rounded-xl hover:bg-violet-50 font-semibold text-sm transition-colors"
                    style={{ color: "#3b0764" }}
                  >
                    ⚙️ Admin
                  </button>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center justify-center w-8 h-8 rounded-full active:scale-90 transition-transform"
            style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }}
            title="Déconnexion"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {/* ── HERO CARD ── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.4 }}
        className="rounded-3xl mb-3 text-center overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #7c3aed, #a855f7, #ec4899)",
          padding: "16px",
        }}
      >
        <p className="text-xs font-bold uppercase tracking-widest mb-0.5 text-white/80">
          Bonjour ALMA 👋
        </p>
        {session?.user && (
          <p className="text-xs text-white/60 mb-1">
            {session.user.name ?? session.user.email}
          </p>
        )}
        <p className="text-lg font-extrabold text-white mb-3">{getTodayFr()}</p>

        <div className="mb-3 inline-block">
          <Mascotte state={mascotteState} />
        </div>

        <div
          className="rounded-2xl py-2 px-4 text-sm font-semibold text-white w-fit mx-auto mb-3"
          style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)" }}
        >
          {getMascotteMessage(mascotteState, devoirs)}
        </div>

        <div className="flex justify-center">
          <motion.div
            className="relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold text-white"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            {stats.streak > 0 && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ background: "rgba(255,255,255,0.15)" }}
                animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <span className="relative">{streakLabel(stats.streak)}</span>
          </motion.div>
        </div>
      </motion.div>

      {/* ── LEVEL BAR ── */}
      <div className="mb-4 px-1">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm font-bold" style={{ color: "#7c3aed" }}>Niveau 2</span>
          <span className="text-xs" style={{ color: "#6d28d9" }}>10 pts → niveau 3</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(124,58,237,0.15)" }}>
          <div
            className="h-full rounded-full"
            style={{ width: "72%", background: "linear-gradient(90deg, #7c3aed, #ec4899)" }}
          />
        </div>
      </div>

      {/* ── BENTO STATS ── */}
      <div className="mb-5">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-2.5" style={{ color: "#3b0764" }}>
          📊 Tableau de bord
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {/* Tile 1 — Devoirs aujourd'hui */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ duration: 0.35, delay: 0 }}
            className="rounded-2xl p-3.5 flex flex-col gap-1"
            style={{ background: "linear-gradient(135deg, #f5f3ff, #ede9fe)", border: "1px solid rgba(124,58,237,0.15)", boxShadow: "0 2px 12px rgba(124,58,237,0.08)" }}>
            <span className="text-3xl font-extrabold leading-none" style={{ color: "#7c3aed" }}>
              {devoirsLoading ? "…" : devoirsAujourdhui.length}
            </span>
            <span className="text-xs font-semibold" style={{ color: "#7c3aed" }}>Devoirs aujourd'hui</span>
            <div className="mt-0.5 h-1 rounded-full overflow-hidden" style={{ background: "rgba(124,58,237,0.15)" }}>
              <div className="h-full rounded-full" style={{
                width: devoirsAujourdhui.length > 0
                  ? `${Math.round(devoirsAujourdhui.filter(d => d.completed).length / devoirsAujourdhui.length * 100)}%`
                  : "100%",
                background: "linear-gradient(90deg,#7c3aed,#ec4899)"
              }} />
            </div>
          </motion.div>
          {/* Tile 2 — Pièces */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ duration: 0.35, delay: 0.05 }}
            className="rounded-2xl p-3.5 flex flex-col gap-1 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)", boxShadow: "0 4px 20px rgba(124,58,237,0.3)" }}>
            <span className="text-3xl font-extrabold leading-none text-white">🪙 {stats.coins}</span>
            <span className="text-xs font-semibold text-white/80">Pièces gagnées</span>
            <span className="text-xs text-white/60 mt-0.5">{stats.totalCompleted} devoir{stats.totalCompleted !== 1 ? "s" : ""} fait{stats.totalCompleted !== 1 ? "s" : ""}</span>
          </motion.div>
          {/* Tile 3 — En retard */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ duration: 0.35, delay: 0.08 }}
            className="rounded-2xl p-3.5 flex flex-col gap-1"
            style={devoirsEnRetard.length > 0
              ? { background: "#fff5f5", border: "1px solid rgba(220,38,38,0.2)", boxShadow: "0 2px 12px rgba(220,38,38,0.08)" }
              : { background: "#f0fdf4", border: "1px solid rgba(16,185,129,0.2)", boxShadow: "0 2px 12px rgba(16,185,129,0.08)" }}>
            <span className="text-3xl font-extrabold leading-none"
              style={{ color: devoirsEnRetard.length > 0 ? "#dc2626" : "#10b981" }}>
              {devoirsLoading ? "…" : devoirsEnRetard.length > 0 ? devoirsEnRetard.length : "✓"}
            </span>
            <span className="text-xs font-semibold"
              style={{ color: devoirsEnRetard.length > 0 ? "#dc2626" : "#10b981" }}>
              {devoirsEnRetard.length > 0 ? "En retard" : "À jour !"}
            </span>
          </motion.div>
          {/* Tile 4 — Série */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ duration: 0.35, delay: 0.1 }}
            className="rounded-2xl p-3.5 flex flex-col gap-1"
            style={{ background: stats.streak > 0 ? "#fffbeb" : "#f9f7ff", border: `1px solid ${stats.streak > 0 ? "rgba(245,158,11,0.25)" : "rgba(124,58,237,0.1)"}`, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <span className="text-3xl font-extrabold leading-none" style={{ color: stats.streak > 0 ? "#d97706" : "#a78bfa" }}>
              {stats.streak > 0 ? `${stats.streak}🔥` : "0"}
            </span>
            <span className="text-xs font-semibold" style={{ color: stats.streak > 0 ? "#d97706" : "#a78bfa" }}>
              {stats.streak > 0 ? "Jours de suite" : "Commence ta série"}
            </span>
          </motion.div>
        </div>
      </div>

      {/* ── PROCHAINE SÉANCE ── */}
      {prochaineSeance && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.4, delay: 0.07 }}
          className="mb-5 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: "#ede9fe", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          <span className="text-2xl">🎓</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold" style={{ color: "#5b21b6" }}>Prochaine séance</p>
            <p className="text-sm font-extrabold truncate" style={{ color: "#3b0764" }}>{prochaineSeance.nom}</p>
            <p className="text-xs" style={{ color: "#7c3aed" }}>
              {new Date(prochaineSeance.date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              {prochaineSeance.heure && ` · ${prochaineSeance.heure}`}
            </p>
          </div>
          <Link href="/cours" className="text-xs font-bold px-3 py-1.5 rounded-xl text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
            Voir →
          </Link>
        </motion.div>
      )}

      {/* ── EN RETARD ── */}
      {devoirsEnRetard.length > 0 && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.4, delay: 0.08 }}
          className="mb-5"
        >
          <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#dc2626" }}>
            ⚠️ En retard
          </h2>
          <div className="flex flex-col gap-2">
            {devoirsEnRetard.map((d) => {
              const cfg = getMatiereConfig(d.matiere);
              return (
                <div
                  key={d.id}
                  className="rounded-[20px] p-4 flex items-center gap-3"
                  style={{
                    background: "#fff5f5",
                    border: "1px solid rgba(220,38,38,0.25)",
                    boxShadow: "0 2px 12px rgba(220,38,38,0.08)",
                  }}
                >
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${cfg.dot}`} />
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full opacity-90 ${cfg.badge}`}>
                      {d.matiere}
                    </span>
                    <p className="font-semibold mt-1.5 text-sm" style={{ color: "#3b0764" }}>{d.titre}</p>
                    <p className="text-xs mt-0.5 font-semibold" style={{ color: "#dc2626" }}>
                      Prévu le {new Date(d.dueDate + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                    </p>
                  </div>
                  <button onClick={() => toggle(d.id)} className="flex-shrink-0 active:scale-90 transition-transform">
                    {d.completed
                      ? <CheckCircle2 size={28} className="text-green-500" />
                      : <Circle size={28} style={{ color: "rgba(220,38,38,0.4)" }} />}
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── AUJOURD'HUI ── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-5"
      >
        <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#3b0764" }}>
          📖 Aujourd&apos;hui
        </h2>
        {devoirsLoading ? (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
          </div>
        ) : devoirsAujourdhui.length === 0 ? (
          <p className="text-center py-3 text-sm" style={{ color: "#4c1d95" }}>Aucun devoir 🎉</p>
        ) : (
          <div className="flex flex-col gap-2">
            {devoirsAujourdhui.map((d) => {
              const cfg = getMatiereConfig(d.matiere);
              return (
                <div
                  key={d.id}
                  className={`rounded-[20px] p-4 flex items-center gap-3 transition-opacity ${d.completed ? "opacity-50" : ""}`}
                  style={{
                    background: "#ffffff",
                    border: "1px solid rgba(139,92,246,0.2)",
                    boxShadow: "0 2px 12px rgba(124,58,237,0.1)",
                  }}
                >
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${cfg.dot}`} />
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
                  <button onClick={() => toggle(d.id)} className="flex-shrink-0 active:scale-90 transition-transform">
                    {d.completed
                      ? <CheckCircle2 size={28} className="text-green-500" />
                      : <Circle size={28} style={{ color: "rgba(124,58,237,0.3)" }} />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── DEMAIN ── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mb-5"
      >
        <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#3b0764" }}>
          🌙 Demain
        </h2>
        {devoirsLoading ? (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
          </div>
        ) : devoirsDemain.length === 0 ? (
          <p className="text-center py-3 text-sm" style={{ color: "#4c1d95" }}>Aucun devoir pour demain</p>
        ) : (
          <div className="flex flex-col gap-2">
            {devoirsDemain.map((d) => {
              const cfg = getMatiereConfig(d.matiere);
              return (
                <div
                  key={d.id}
                  className="rounded-[20px] p-4 flex items-center gap-3"
                  style={{
                    background: "#ffffff",
                    border: "1px solid rgba(139,92,246,0.2)",
                    boxShadow: "0 2px 12px rgba(124,58,237,0.08)",
                  }}
                >
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${cfg.dot}`} />
                  <div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full opacity-90 ${cfg.badge}`}>
                      {d.matiere}
                    </span>
                    <p className="text-sm mt-1" style={{ color: "#6d28d9" }}>{d.titre}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── BADGES ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#3b0764" }}>
            🏅 Mes badges
          </h2>
          <Link href="/badges" className="text-xs font-semibold" style={{ color: "#7c3aed" }}>
            Voir tous →
          </Link>
        </div>
        <div className="flex gap-2 flex-wrap">
          {badgeSlots.map((badge, i) => (
            <motion.span
              key={i}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
              className="text-xs px-3 py-1.5 rounded-full font-semibold"
              style={
                !badge
                  ? { background: "rgba(0,0,0,0.06)", color: "#4b5563" }
                  : { background: "rgba(124,58,237,0.12)", color: "#3b0764" }
              }
            >
              {badge ? `${badge.emoji} ${badge.name}` : "🔒"}
            </motion.span>
          ))}
        </div>
      </div>

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
    </div>
  );
}
