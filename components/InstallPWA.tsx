"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "alma_pwa_dismissed";

export default function InstallPWA() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-50 rounded-3xl px-4 py-3 flex items-center gap-3 shadow-xl max-w-md mx-auto"
      style={{
        background: "#1a0a35",
        border: "1px solid rgba(139,92,246,0.5)",
      }}
    >
      <span className="text-xl flex-shrink-0">📲</span>
      <p className="flex-1 text-sm font-semibold text-white">
        Installer ALMA sur ton téléphone !
      </p>
      <button
        onClick={handleInstall}
        className="px-3 py-1.5 rounded-2xl text-white text-xs font-bold flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}
      >
        Installer
      </button>
      <button
        onClick={handleDismiss}
        className="text-sm flex-shrink-0"
        style={{ color: "#a78bfa" }}
        aria-label="Fermer"
      >
        ✕
      </button>
    </div>
  );
}
