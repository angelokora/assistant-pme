import type { CSSProperties } from "react";
import { Outlet, useLocation, useSearchParams } from "react-router-dom";
import { useMediaQuery } from "../composer/useMediaQuery";
import { EleaLogo } from "../demo/EleaLogo";
import { useDemo } from "../demo/demo";
import { BottomNav } from "./BottomNav";
import { DesktopNav } from "./DesktopNav";
import { DetailPanel } from "./DetailPanel";
import { RadialMenu } from "./RadialMenu";
import { SideRail } from "./SideRail";
import { VariantPill } from "./VariantPill";
import { destinationForPath } from "./destinations";
import styles from "./Shell.module.css";

/** Squelette responsive : barre basse / rail / trois colonnes. */
export function Shell() {
  const location = useLocation();
  const [params] = useSearchParams();
  const menuFromDemo = useDemo((s) => s.menuVariant);
  const homeFromDemo = useDemo((s) => s.homeVariant);
  const menuVariant = (params.get("menu") === "b" || params.get("menu") === "a" ? params.get("menu") : menuFromDemo) as
    | "a"
    | "b";
  const paramV = params.get("v");
  const homeVariant =
    paramV === "a" || paramV === "b" || paramV === "c" ? paramV : homeFromDemo;
  const mobile = useMediaQuery("(max-width: 639px)");
  const tablet = useMediaQuery("(min-width: 640px) and (max-width: 1023px)");
  const desktop = useMediaQuery("(min-width: 1024px)");
  const inNeed = location.pathname.startsWith("/besoin/");
  const onHome = location.pathname === "/";
  const active = destinationForPath(location.pathname);
  const hideComposer = onHome && homeVariant === "c";

  return (
    <div
      className={[
        styles.shell,
        mobile && styles.mobile,
        tablet && styles.tablet,
        desktop && styles.desktop,
        inNeed && styles.inNeed,
        mobile && !inNeed && menuVariant === "b" && styles.menuB,
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        mobile && !inNeed && menuVariant !== "b"
          ? ({
              ["--nav-offset" as string]:
                "calc(72px + max(env(safe-area-inset-bottom, 0px), var(--safe-bottom, 0px)))",
            } as CSSProperties)
          : undefined
      }
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

      {mobile &&
        !inNeed &&
        (menuVariant === "b" ? <RadialMenu active={active} /> : <BottomNav active={active} hideComposer={hideComposer} />)}

      <VariantPill />
    </div>
  );
}
