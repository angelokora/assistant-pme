import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Button, Orb, blockItem, blockList } from "@elea/ds";
import { useMemory } from "../memory/store";
import { SCENARIO_INDEX, SCENARIOS } from "../engine/scenarios";
import styles from "./Home.module.css";

/**
 * Accueil provisoire. L'accueil quotidien et ses trois variantes sont le ticket #8.
 * Ici : premier lancement (invitation à faire connaissance) ou accès aux besoins de démonstration.
 */
export function Home() {
  const navigate = useNavigate();
  const owner = useMemory((s) => s.owner);
  const account = useMemory((s) => s.account);

  return (
    <motion.main className={styles.page} variants={blockList} initial="hidden" animate="shown">
      <motion.div variants={blockItem} className={styles.orb}>
        <Orb size={96} state="idle" />
      </motion.div>
      <motion.p variants={blockItem} className="eyebrow">
        {account.created ? `Bonjour ${owner.firstName}` : "Votre conseillère"}
      </motion.p>
      <motion.h1 variants={blockItem} className={["voice", styles.title].join(" ")}>
        {account.created ? "Qu'est-ce qui vous occupe aujourd'hui ?" : "Bonjour, je suis Éléa."}
      </motion.h1>
      <motion.p variants={blockItem} className={styles.lede}>
        Je retiens tout ce qui compte pour votre entreprise, et je vous aide à décider. Faisons connaissance : cinq minutes suffisent.
      </motion.p>
      <motion.div variants={blockItem}>
        <Button size="lg" iconEnd={<ArrowRight size={18} />} onClick={() => navigate("/besoin/onboarding")}>
          Faisons connaissance
        </Button>
      </motion.div>
      <motion.nav variants={blockItem} className={styles.demo} aria-label="Besoins de démonstration">
        <span className={styles.demoLabel}>Démo</span>
        {SCENARIO_INDEX.filter((s) => s.id !== "onboarding").map((s) => (
          <button key={s.id} onClick={() => navigate(`/besoin/${s.id}`)}>
            {SCENARIOS[s.id]?.title}
          </button>
        ))}
      </motion.nav>
    </motion.main>
  );
}
