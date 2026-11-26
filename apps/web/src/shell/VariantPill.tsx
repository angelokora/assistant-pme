import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useMediaQuery } from "../composer/useMediaQuery";
import { isFrameMode } from "../demo/bridge";
import { useDemo, type FindVariant, type HomeVariant, type MenuVariant } from "../demo/demo";
import styles from "./VariantPill.module.css";

/**
 * Pastille discrète (≥ 1024 px) pour changer de variante sans le panneau démo.
 * Masquable via `showVariantPill` dans le store démo. Absente dans l'iframe appareil.
 */
export function VariantPill() {
  const desktop = useMediaQuery("(min-width: 1024px)");
  const show = useDemo((s) => s.showVariantPill);
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const homeVariant = useDemo((s) => s.homeVariant);
  const setHomeVariant = useDemo((s) => s.setHomeVariant);
  const menuVariant = useDemo((s) => s.menuVariant);
  const setMenuVariant = useDemo((s) => s.setMenuVariant);
  const findVariant = useDemo((s) => s.findVariant);
  const setFindVariant = useDemo((s) => s.setFindVariant);

  if (isFrameMode() || !desktop || !show) return null;

  const onHome = location.pathname === "/";
  const onSearch = location.pathname.startsWith("/recherche");
  if (!onHome && !onSearch) return null;

  const paramV = params.get("v");
  const currentHome: HomeVariant =
    paramV === "a" || paramV === "b" || paramV === "c" ? paramV : homeVariant;

  return (
    <div className={styles.pill} role="group" aria-label="Variantes">
      {onHome && (
        <Segment
          label="Accueil"
          options={[
            { id: "a", title: "A" },
            { id: "b", title: "B" },
            { id: "c", title: "C" },
          ]}
          value={currentHome}
          onChange={(v) => {
            setHomeVariant(v as HomeVariant);
            navigate(`/?v=${v}`);
          }}
        />
      )}
      {onHome && (
        <Segment
          label="Menu"
          options={[
            { id: "a", title: "A" },
            { id: "b", title: "B" },
          ]}
          value={menuVariant}
          onChange={(v) => setMenuVariant(v as MenuVariant)}
        />
      )}
      {onSearch && (
        <Segment
          label="Retrouver"
          options={[
            { id: "a", title: "A" },
            { id: "b", title: "B" },
          ]}
          value={(params.get("find") === "a" || params.get("find") === "b" ? params.get("find") : findVariant) as FindVariant}
          onChange={(v) => {
            setFindVariant(v as FindVariant);
            navigate(`/recherche?find=${v}`);
          }}
        />
      )}
    </div>
  );
}

function Segment({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: string; title: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className={styles.segment}>
      <span className={styles.label}>{label}</span>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={[styles.opt, value === o.id && styles.optActive].filter(Boolean).join(" ")}
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
        >
          {o.title}
        </button>
      ))}
    </div>
  );
}
