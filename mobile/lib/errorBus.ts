/**
 * Event bus minimal pour faire remonter les erreurs reseau/API
 * depuis l'intercepteur axios (hors React tree) jusqu'au
 * ToastProvider (dans React tree).
 *
 * Utilisation :
 *   // Hors React : emettre une erreur
 *   import { errorBus } from "@/lib/errorBus";
 *   errorBus.emit("Erreur reseau", "error");
 *
 *   // Dans un composant React (typiquement le ToastProvider) : s'abonner
 *   useEffect(() => errorBus.subscribe((msg, type) => toast(msg, type)), []);
 */

export type ErrorBusType = "error" | "warning" | "info";
export type ErrorBusHandler = (message: string, type: ErrorBusType) => void;

class ErrorBus {
  private handlers: Set<ErrorBusHandler> = new Set();

  emit(message: string, type: ErrorBusType = "error"): void {
    this.handlers.forEach((h) => {
      try {
        h(message, type);
      } catch {
        // Ne jamais laisser un handler bugue casser l'emission
      }
    });
  }

  /** Retourne une fonction d'unsubscribe pour usage dans useEffect. */
  subscribe(handler: ErrorBusHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }
}

export const errorBus = new ErrorBus();
