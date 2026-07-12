import { useEffect, useRef } from "react";
import { turnstileSiteKey } from "@/lib/api";

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void; "error-callback": () => void }) => string;
      remove: (widgetId: string) => void;
    };
  }
}

let turnstileLoader: Promise<void> | undefined;

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve();
  if (!turnstileLoader) {
    turnstileLoader = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Captcha failed to load"));
      document.head.appendChild(script);
    });
  }
  return turnstileLoader;
}

export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);

  onTokenRef.current = onToken;

  useEffect(() => {
    if (!turnstileSiteKey || !container.current) return;
    let widgetId: string | undefined;
    let disposed = false;

    loadTurnstile()
      .then(() => {
        if (disposed || !container.current || !window.turnstile) return;
        widgetId = window.turnstile.render(container.current, {
          sitekey: turnstileSiteKey,
          callback: (token) => onTokenRef.current(token),
          "error-callback": () => onTokenRef.current("")
        });
      })
      .catch(() => onTokenRef.current(""));

    return () => {
      disposed = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, []);

  if (!turnstileSiteKey) return null;
  return <div ref={container} />;
}
