import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { spring } from "../../motion/springs";
import styles from "./Toast.module.css";

type ToastAction = { label: string; onClick: () => void };

type ToastItem = {
  id: string;
  message: string;
  action?: ToastAction;
};

type ToastOptions = {
  action?: ToastAction;
  /** Durée d'affichage (défaut 3800 ms). */
  durationMs?: number;
};

type ToastApi = {
  show: (message: string, opts?: ToastOptions) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

/** Accès au toast (confirmation discrète). */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit être utilisé dans un ToastProvider");
  return ctx;
}

/** Hôte de toasts : fixe en bas, une confirmation à la fois en pratique. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, opts?: ToastOptions) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setItems((prev) => [...prev, { id, message, action: opts?.action }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, opts?.durationMs ?? 3800);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.host} aria-live="polite">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              className={styles.toast}
              role="status"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={spring.snappy}
            >
              <p>{t.message}</p>
              {t.action && (
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => {
                    t.action?.onClick();
                    setItems((prev) => prev.filter((x) => x.id !== t.id));
                  }}
                >
                  {t.action.label}
                </button>
              )}
              <button
                type="button"
                className={styles.close}
                aria-label="Fermer"
                onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
              >
                <X size={16} strokeWidth={1.75} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
