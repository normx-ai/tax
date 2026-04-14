import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Animated, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme/ThemeContext";
import { errorBus } from "@/lib/errorBus";

// ─── Types ───────────────────────────────────────────────────

type ToastType = "success" | "error" | "info" | "warning";

interface ToastData {
  id: number;
  message: string;
  type: ToastType;
  opacity: Animated.Value;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

// ─── Icons & Colors ──────────────────────────────────────────

const TOAST_CONFIG: Record<ToastType, { icon: keyof typeof Ionicons.glyphMap; bg: string }> = {
  success: { icon: "checkmark-circle", bg: "#16a34a" },
  error: { icon: "close-circle", bg: "#dc2626" },
  warning: { icon: "warning", bg: "#d97706" },
  info: { icon: "information-circle", bg: "#2563eb" },
};

// ─── Provider ────────────────────────────────────────────────

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [confirmState, setConfirmState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const idRef = useRef(0);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++idRef.current;
    const opacity = new Animated.Value(0);

    setToasts((prev) => [...prev, { id, message, type, opacity }]);

    Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();

    setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      });
    }, 3500);
  }, []);

  // S'abonner au errorBus pour afficher automatiquement les erreurs
  // reseau/API remontees par l'intercepteur axios. Debounce simple via
  // set de messages deja emis dans la derniere seconde pour eviter les
  // toasts identiques en rafale.
  useEffect(() => {
    const recentMessages = new Set<string>();
    const unsubscribe = errorBus.subscribe((message, type) => {
      if (recentMessages.has(message)) return;
      recentMessages.add(message);
      setTimeout(() => recentMessages.delete(message), 1500);
      toast(message, type);
    });
    return unsubscribe;
  }, [toast]);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ ...options, resolve });
    });
  }, []);

  const handleConfirm = () => {
    confirmState?.resolve(true);
    setConfirmState(null);
  };

  const handleCancel = () => {
    confirmState?.resolve(false);
    setConfirmState(null);
  };

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      {/* ── Toasts ── */}
      <View style={styles.toastContainer} pointerEvents="box-none">
        {toasts.map((t) => {
          const cfg = TOAST_CONFIG[t.type];
          return (
            <Animated.View key={t.id} style={[styles.toast, { backgroundColor: cfg.bg, opacity: t.opacity }]}>
              <Ionicons name={cfg.icon} size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.toastText} numberOfLines={3}>{t.message}</Text>
            </Animated.View>
          );
        })}
      </View>

      {/* ── Confirm Modal ── */}
      {confirmState && (
        <View style={styles.overlay}>
          <View style={[styles.confirmBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.confirmTitle, { color: colors.text }]}>{confirmState.title}</Text>
            <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>{confirmState.message}</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                onPress={handleCancel}
                style={[styles.confirmBtn, { backgroundColor: colors.border }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.confirmBtnText, { color: colors.text }]}>
                  {confirmState.cancelLabel || "Annuler"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirm}
                style={[
                  styles.confirmBtn,
                  { backgroundColor: confirmState.destructive ? "#dc2626" : colors.primary },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[styles.confirmBtnText, { color: "#fff" }]}>
                  {confirmState.confirmLabel || "Confirmer"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ToastContext.Provider>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
    pointerEvents: "box-none",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    maxWidth: 420,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  toastText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9998,
  },
  confirmBox: {
    width: "90%",
    maxWidth: 400,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 20,
  },
  confirmButtons: {
    flexDirection: "row",
    gap: 10,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
