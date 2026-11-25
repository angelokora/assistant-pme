import { Outlet, useLocation, useSearchParams } from "react-router-dom";
import { useMediaQuery } from "../composer/useMediaQuery";
import { EleaLogo } from "../demo/EleaLogo";
import { useDemo } from "../demo/demo";
import { BottomNav } from "./BottomNav";
import { DesktopNav } from "./DesktopNav";
import { DetailPanel } from "./DetailPanel";
import { RadialMenu } from "./RadialMenu";
import { SideRail } from "./SideRail";
import { destinationForPath } from "./destinations";
import styles from "./Shell.module.css";

/** Squelette responsive : barre basse / rail / trois colonnes. */
export function Shell() {
  const location = useLocation();
  const [params] = useSearchParams();
  const menuFromDemo = useDemo((s) => s.menuVariant);
  const menuVariant = (params.get("menu") === "b" || params.get("menu") === "a" ? params.get("menu") : menuFromDemo) as
    | "a"
    | "b";
  const mobile = useMediaQuery("(max-width: 639px)");
  const tablet = useMediaQuery("(min-width: 640px) and (max-width: 1023px)");
  const desktop = useMediaQuery("(min-width: 1024px)");
  const inNeed = location.pathname.startsWith("/besoin/");
  const active = destinationForPath(location.pathname);

  return (
    <div
      className={[
        styles.shell,
        mobile && styles.mobile,
        tablet && styles.tablet,
        desktop && styles.desktop,
        inNeed && styles.inNeed,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {tablet && <SideRail active={active} />}
      {desktop && <DesktopNav active={active} />}

      <div className={[styles.main, inNeed && mobile && styles.needSheet].filter(Boolean).join(" ")}>
        {mobile && !inNeed && (
          <header className={styles.mobileBrand}>
            <EleaLogo />
          </header>
        )}
        <Outlet />
      </div>

      {desktop && <DetailPanel />}
      {tablet && <DetailPanel />}

      {mobile && !inNeed && (menuVariant === "b" ? <RadialMenu active={active} /> : <BottomNav active={active} />)}
    </div>
  );
}
