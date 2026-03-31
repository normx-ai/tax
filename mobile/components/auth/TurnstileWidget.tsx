import { useEffect, useRef, useState } from "react";
import { Platform, View, ActivityIndicator } from "react-native";

interface TurnstileAPI {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window { turnstile?: TurnstileAPI; }
}

const SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

const isWeb = Platform.OS === "web";

interface TurnstileWidgetProps {
  onToken: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export default function TurnstileWidget({ onToken, onError, onExpire }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const onErrorRef = useRef(onError);
  const onExpireRef = useRef(onExpire);
  const [rendered, setRendered] = useState(false);

  onTokenRef.current = onToken;
  onErrorRef.current = onError;
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!isWeb || !SITE_KEY) return;

    let cancelled = false;

    function doRender() {
      const turnstile = window.turnstile;
      if (!turnstile || !containerRef.current || cancelled) return;
      if (widgetIdRef.current !== null) return;

      widgetIdRef.current = turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        theme: "dark",
        size: "normal",
        callback: (token: string) => onTokenRef.current(token),
        "error-callback": () => onErrorRef.current?.(),
        "expired-callback": () => onExpireRef.current?.(),
      });
      setRendered(true);
    }

    // Charger le script si pas encore fait
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      document.head.appendChild(script);
    }

    // Quand le script est prêt, render
    if (window.turnstile) {
      doRender();
    } else {
      script.addEventListener("load", doRender);
      // Fallback polling
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          doRender();
        }
      }, 300);
      var cleanInterval = () => clearInterval(interval);
    }

    return () => {
      cancelled = true;
      cleanInterval?.();
      script?.removeEventListener("load", doRender);
      const turnstile = window.turnstile;
      if (turnstile && widgetIdRef.current !== null) {
        try { turnstile.remove(widgetIdRef.current); } catch {}
        widgetIdRef.current = null;
      }
    };
  }, []);

  if (!isWeb || !SITE_KEY) return null;

  return (
    <View style={{ alignItems: "center", marginBottom: 16, minHeight: 70 }}>
      <div
        ref={containerRef}
        style={{ minWidth: 300, minHeight: 65 }}
      />
      {!rendered && (
        <View style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          justifyContent: "center", alignItems: "center",
        }}>
          <ActivityIndicator size="small" color="#00815d" />
        </View>
      )}
    </View>
  );
}
