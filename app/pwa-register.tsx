"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Smartphone, X } from "lucide-react";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

function subscribe(callback: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getPlatform() {
  if (isStandalone()) return "installed";
  if (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  return "other";
}

export default function PwaRegister() {
  const platform = useSyncExternalStore(subscribe, getPlatform, () => "loading");
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && window.isSecureContext) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!prompt) { setShowHelp((value) => !value); return; }
    setInstalling(true);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
    } catch {
      setShowHelp(true);
    } finally {
      setPrompt(null);
      setInstalling(false);
    }
  }

  if (platform === "loading" || platform === "installed" || installed || dismissed) return null;

  return (
    <aside className="pwa-install" aria-label="Instalar aplicativo Sabom">
      <div className="pwa-install-row">
        <span className="pwa-install-icon"><Smartphone size={23} aria-hidden="true" /></span>
        <div className="pwa-install-copy"><strong>Sabom no seu celular</strong><span>Acesse pelo ícone na tela inicial.</span></div>
        <button className="pwa-install-action" onClick={install} disabled={installing} aria-label="Instalar Sabom">
          <Download size={16} aria-hidden="true" />{installing ? "Aguarde…" : "Instalar"}
        </button>
        <button className="pwa-install-close" onClick={() => setDismissed(true)} aria-label="Dispensar convite de instalação"><X size={18} /></button>
      </div>
      {showHelp && <div className="pwa-install-help" role="status">
        {platform === "ios" ? <p>No Safari, toque em <strong>Compartilhar</strong>, depois em <strong>Adicionar à Tela de Início</strong> e confirme em <strong>Adicionar</strong>. Se aparecer, ative <strong>Abrir como App da Web</strong>.</p> : <p>No menu do navegador <strong>⋮</strong>, toque em <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>. Se a opção não aparecer, abra este site no Chrome.</p>}
      </div>}
    </aside>
  );
}
