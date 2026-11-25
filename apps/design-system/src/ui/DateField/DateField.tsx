import { useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate } from "../../format";
import { press, spring } from "../../motion/springs";
import { motion, AnimatePresence } from "motion/react";
import styles from "./DateField.module.css";

type Props = {
  value: string; // ISO date YYYY-MM-DD
  onChange: (iso: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
};

const WEEKDAYS = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];

function parseIso(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toIso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

/** Sélecteur de date léger, libellés en français, navigation clavier. */
export function DateField({ value, onChange, label, disabled, className }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => startOfMonth(parseIso(value)));
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setCursor(startOfMonth(parseIso(value)));
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = parseIso(value);
  const monthLabel = cursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const firstDow = (cursor.getDay() + 6) % 7; // lundi = 0
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));

  function moveDay(delta: number) {
    const next = new Date(selected);
    next.setDate(next.getDate() + delta);
    onChange(toIso(next));
    setCursor(startOfMonth(next));
  }

  return (
    <div ref={rootRef} className={[styles.wrap, className].filter(Boolean).join(" ")}>
      {label && (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      )}
      <motion.button
        id={id}
        type="button"
        className={styles.trigger}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        whileTap={disabled ? undefined : press}
        transition={spring.snappy}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {formatDate(value, "weekday")}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Choisir une date"
            className={styles.pop}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={spring.snappy}
          >
            <div className={styles.monthBar}>
              <button type="button" className={styles.nav} aria-label="Mois précédent" onClick={() => setCursor(addMonths(cursor, -1))}>
                <ChevronLeft size={18} />
              </button>
              <span className={styles.month}>{monthLabel}</span>
              <button type="button" className={styles.nav} aria-label="Mois suivant" onClick={() => setCursor(addMonths(cursor, 1))}>
                <ChevronRight size={18} />
              </button>
            </div>
            <div className={styles.weekdays} aria-hidden>
              {WEEKDAYS.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>
            <div
              className={styles.grid}
              role="grid"
              aria-label={monthLabel}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") {
                  e.preventDefault();
                  moveDay(-1);
                } else if (e.key === "ArrowRight") {
                  e.preventDefault();
                  moveDay(1);
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  moveDay(-7);
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  moveDay(7);
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  setOpen(false);
                }
              }}
            >
              {cells.map((d, i) =>
                d ? (
                  <button
                    key={toIso(d)}
                    type="button"
                    role="gridcell"
                    tabIndex={toIso(d) === value ? 0 : -1}
                    aria-selected={toIso(d) === value}
                    className={[styles.day, toIso(d) === value && styles.daySelected].filter(Boolean).join(" ")}
                    onClick={() => {
                      onChange(toIso(d));
                      setOpen(false);
                    }}
                  >
                    {d.getDate()}
                  </button>
                ) : (
                  <span key={`e-${i}`} className={styles.empty} />
                ),
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
