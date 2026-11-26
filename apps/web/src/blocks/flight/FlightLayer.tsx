import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { BookmarkCheck } from "lucide-react";
import { spring } from "@elea/ds";
import { useFlights } from "./flights";
import { useGauges } from "../../memory/store";
import styles from "./FlightLayer.module.css";

/**
 * Animation signature : une pastille « Noté » quitte l'étiquette et rejoint la carte de sa dimension,
 * puis la jauge se remplit (DESIGN.md, section 5).
 */
export function FlightLayer() {
  const flights = useFlights((s) => s.flights);
  const done = useFlights((s) => s.done);
  const land = useGauges((s) => s.land);

  return createPortal(
    <AnimatePresence>
      {flights.map((f) => {
        const fromX = f.from.left + 18;
        const fromY = f.from.top + f.from.height / 2 - 16;
        const toX = f.to.left + f.to.width / 2 - 16;
        const toY = f.to.top + f.to.height / 2 - 16;
        const midX = (fromX + toX) / 2 + 40;
        const midY = Math.min(fromY, toY) - 60;
        return (
          <motion.div
            key={f.id}
            className={styles.puck}
            initial={{ x: fromX, y: fromY, scale: 0.6, opacity: 0 }}
            animate={{ x: [fromX, midX, toX], y: [fromY, midY, toY], scale: [1, 1.15, 0.7], opacity: [1, 1, 0.9] }}
            exit={{ opacity: 0, scale: 0.3, transition: { duration: 0.2 } }}
            transition={{ ...spring.travel, duration: 0.9, type: "tween", ease: [0.5, 0, 0.2, 1], times: [0, 0.45, 1] }}
            onAnimationComplete={() => {
              if (f.targetKind === "dimension") land(f.targetId);
              done(f.id);
            }}
          >
            <BookmarkCheck size={16} strokeWidth={2.2} />
          </motion.div>
        );
      })}
    </AnimatePresence>,
    document.body,
  );
}
