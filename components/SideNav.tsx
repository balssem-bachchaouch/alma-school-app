"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Calendar, GraduationCap, ListTodo, Moon, Sun, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";

const tabs = [
  { href: "/", icon: Home, label: "Accueil" },
  { href: "/devoirs", icon: BookOpen, label: "Devoirs" },
  { href: "/planning", icon: Calendar, label: "Planning" },
  { href: "/taches", icon: ListTodo, label: "Tâches" },
  { href: "/cours", icon: GraduationCap, label: "Cours" },
  { href: "/recompenses", icon: ShoppingBag, label: "Boutique 🪙" },
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

export default function SideNav() {
  const pathname = usePathname();
  const tachesEnRetard = useTachesEnRetard();
  const { theme, toggle } = useTheme();

  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <nav
      className="hidden md:flex flex-col w-60 min-h-screen flex-shrink-0 alma-nav"
      style={{
        background: "var(--sidebar, #ffffff)",
        borderRight: "1px solid var(--sidebar-border, rgba(139,92,246,0.15))",
        boxShadow: "2px 0 20px rgba(124,58,237,0.08)",
      }}
    >
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 relative">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              boxShadow: "0 0 20px rgba(124,58,237,0.4)",
            }}
          >
            📚
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-sm leading-tight" style={{ color: "#3b0764" }}>
              ALMA
            </p>
            <p className="text-xs" style={{ color: "#8b5cf6" }}>
              Mon École
            </p>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(124,58,237,0.1)", color: "#8b5cf6" }}>
            v1.0
          </span>
        </div>
        {/* shimmer separator */}
        <div
          className="absolute bottom-0 left-5 right-5 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(124,58,237,0.3), rgba(236,72,153,0.3), transparent)",
          }}
        />
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-0.5 px-3 py-4 flex-1">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          const badge = href === "/taches" && tachesEnRetard > 0 ? tachesEnRetard : 0;
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group"
              style={
                active
                  ? {
                      background:
                        "linear-gradient(90deg, rgba(124,58,237,0.12), rgba(124,58,237,0.04))",
                      color: "#7c3aed",
                    }
                  : { color: "var(--sidebar-foreground, #374151)" }
              }
            >
              {/* Left active bar */}
              <div
                className="w-1 rounded-full flex-shrink-0 transition-all"
                style={{
                  height: 20,
                  background: active
                    ? "linear-gradient(180deg, #7c3aed, #ec4899)"
                    : "transparent",
                }}
              />
              <div className="relative">
                <Icon size={19} strokeWidth={active ? 2.5 : 1.8} />
                {badge > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
                    style={{ background: "#dc2626", fontSize: 9 }}
                  >
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span className="font-semibold text-sm flex-1">{label}</span>
            </Link>
          );
        })}
      </div>

      {/* Dark mode toggle */}
      <div
        className="px-3 py-4 relative"
        style={{ borderTop: "1px solid var(--sidebar-border, rgba(139,92,246,0.1))" }}
      >
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
          style={{ color: "var(--sidebar-foreground, #374151)" }}
        >
          <div className="w-1 rounded-full flex-shrink-0" style={{ height: 20 }} />
          {theme === "dark" ? (
            <Sun size={19} strokeWidth={1.8} />
          ) : (
            <Moon size={19} strokeWidth={1.8} />
          )}
          <span className="font-semibold text-sm">
            {theme === "dark" ? "Mode clair" : "Mode sombre"}
          </span>
        </button>
      </div>
    </nav>
  );
}
