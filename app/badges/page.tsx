"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Badge } from "@/lib/types";
import { getBadges } from "@/lib/storage";

export default function BadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loaded, setLoaded] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    setBadges(getBadges());
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="px-4 pt-8 pb-28 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <Link
          href="/"
          className="text-sm font-semibold px-3 py-1.5 rounded-xl active:scale-90 transition-transform"
          style={{ color: "#a78bfa", background: "rgba(139,92,246,0.15)" }}
        >
          ← Accueil
        </Link>
        <h1 className="text-2xl font-extrabold text-white">🏅 Mes Badges</h1>
      </div>
      <p className="text-sm mb-6" style={{ color: "#a78bfa" }}>
        {unlockedCount}/{badges.length} badges débloqués
      </p>

      <div className="grid grid-cols-2 gap-3">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className="rounded-3xl p-4 flex flex-col items-center text-center gap-2"
            style={{
              background: badge.unlocked
                ? "rgba(139,92,246,0.15)"
                : "rgba(255,255,255,0.05)",
              border: `1px solid ${badge.unlocked ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.08)"}`,
              filter: badge.unlocked ? "none" : "grayscale(0.7) opacity(0.55)",
            }}
          >
            <span className="text-4xl">{badge.unlocked ? badge.emoji : "🔒"}</span>
            <div>
              <p className="font-bold text-sm" style={{ color: badge.unlocked ? "white" : "#6b7280" }}>
                {badge.unlocked ? badge.name : "???"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: badge.unlocked ? "#a78bfa" : "#4b5563" }}>
                {badge.unlocked ? badge.description : "???"}
              </p>
              {badge.unlocked && badge.unlockedAt && (
                <p className="text-xs mt-1.5 font-semibold" style={{ color: "#f9a8d4" }}>
                  {new Date(badge.unlockedAt).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                  })}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
