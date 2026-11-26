import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Button, blockItem, blockList } from "@elea/ds";
import { useMemory } from "../memory/store";
import { useTheme, type ThemeId } from "../theme/theme";
import { CompanySources } from "./CompanySources";
import styles from "./Profile.module.css";

/** Compte, entreprise, sources et préférences. */
export function Profile() {
  const navigate = useNavigate();
  const owner = useMemory((s) => s.owner);
  const company = useMemory((s) => s.company);
  const account = useMemory((s) => s.account);
  const patchOwner = useMemory((s) => s.patchOwner);
  const patchCompany = useMemory((s) => s.patchCompany);
  const reset = useMemory((s) => s.reset);
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);

  const [firstName, setFirstName] = useState(owner.firstName);
  const [lastName, setLastName] = useState(owner.lastName);
  const [name, setName] = useState(company.name);
  const [sector, setSector] = useState(company.sector);
  const [city, setCity] = useState(company.city);
  const [employees, setEmployees] = useState(company.employees?.toString() ?? "");

  const email =
    account.method === "google" || account.method === "email"
      ? "thomas@morel-ingenierie.fr"
      : account.created
        ? "thomas@morel-ingenierie.fr"
        : "Compte non créé";

  function saveIdentity() {
    patchOwner({ firstName: firstName.trim() || owner.firstName, lastName: lastName.trim() || owner.lastName });
  }

  function saveCompany() {
    const n = Number.parseInt(employees, 10);
    patchCompany({
      name: name.trim() || company.name,
      sector: sector.trim() || company.sector,
      city: city.trim() || company.city,
      employees: Number.isFinite(n) ? n : company.employees,
    });
  }

  function disconnect() {
    reset("first-visit");
    navigate("/");
  }

  return (
    <motion.main className={styles.page} variants={blockList} initial="hidden" animate="shown">
      <motion.header variants={blockItem} className={styles.header}>
        <p className="eyebrow">Compte</p>
        <h1 className={["voice", styles.title].join(" ")}>Profil</h1>
      </motion.header>

      <motion.section variants={blockItem} aria-labelledby="identity-title" className={styles.card}>
        <h2 id="identity-title" className={styles.sectionTitle}>
          Identité
        </h2>
        <label className={styles.field}>
          <span>Prénom</span>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} onBlur={saveIdentity} />
        </label>
        <label className={styles.field}>
          <span>Nom</span>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} onBlur={saveIdentity} />
        </label>
        <p className={styles.email}>
          <span className={styles.emailLabel}>E-mail du compte</span>
          {email}
        </p>
      </motion.section>

      <motion.section variants={blockItem} aria-labelledby="company-title" className={styles.card}>
        <h2 id="company-title" className={styles.sectionTitle}>
          Entreprise
        </h2>
        <label className={styles.field}>
          <span>Nom</span>
          <input value={name} onChange={(e) => setName(e.target.value)} onBlur={saveCompany} />
        </label>
        <label className={styles.field}>
          <span>Secteur</span>
          <input value={sector} onChange={(e) => setSector(e.target.value)} onBlur={saveCompany} />
        </label>
        <label className={styles.field}>
          <span>Ville</span>
          <input value={city} onChange={(e) => setCity(e.target.value)} onBlur={saveCompany} />
        </label>
        <label className={styles.field}>
          <span>Effectif</span>
          <input
            inputMode="numeric"
            value={employees}
            onChange={(e) => setEmployees(e.target.value)}
            onBlur={saveCompany}
          />
        </label>
      </motion.section>

      <motion.div variants={blockItem}>
        <CompanySources />
      </motion.div>

      <motion.section variants={blockItem} className={styles.prefs} aria-labelledby="prefs-title">
        <h2 id="prefs-title" className={styles.sectionTitle}>
          Préférences
        </h2>
        <fieldset className={styles.themeField}>
          <div className={styles.themeLegend} id="appearance-label">
            Apparence
          </div>
          <div className={styles.themeOptions} role="radiogroup" aria-labelledby="appearance-label">
            {(
              [
                { id: "vivant", label: "Vivant" },
                { id: "classic", label: "Classique" },
              ] as { id: ThemeId; label: string }[]
            ).map((opt) => (
              <label
                key={opt.id}
                className={[styles.themeOption, theme === opt.id && styles.themeOptionActive].filter(Boolean).join(" ")}
              >
                <input
                  type="radio"
                  name="appearance"
                  value={opt.id}
                  checked={theme === opt.id}
                  onChange={() => setTheme(opt.id)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>
      </motion.section>

      <motion.div variants={blockItem} className={styles.logout}>
        <Button variant="secondary" full onClick={disconnect}>
          Se déconnecter
        </Button>
        <p className={styles.logoutHint}>Simulation : remet le prototype au premier lancement.</p>
      </motion.div>
    </motion.main>
  );
}
