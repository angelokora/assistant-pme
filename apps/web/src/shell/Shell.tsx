import type { CSSProperties } from "react";
import { Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Avatar } from "@elea/ds";
import { useMediaQuery } from "../composer/useMediaQuery";
import { EleaLogo } from "../demo/EleaLogo";
import { useDemo } from "../demo/demo";
import { useMemory } from "../memory/store";
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
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const owner = useMemory((s) => s.owner);
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
  const onProfile = location.pathname.startsWith("/profil");
  const active = destinationForPath(location.pathname);
  const hideComposer = onHome && homeVariant === "c";
  const menuB = menuVariant === "b";
  const initials = `${owner.firstName.charAt(0)}${owner.lastName.charAt(0)}`.toUpperCase();

  return (
    <div
      className={[
        styles.shell,
        mobile && styles.mobile,
        tablet && styles.tablet,
        desktop && styles.desktop,
        inNeed && styles.inNeed,
        mobile && menuB && styles.menuB,
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        mobile && !inNeed && !menuB
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
            <Avatar
              initials={initials}
              label={`Profil de ${owner.firstName} ${owner.lastName}`}
              size="sm"
              active={onProfile}
              onClick={() => navigate("/profil")}
            />
          </header>
        )}
        <Outlet />
      </div>

      {(desktop || tablet || mobile) && <DetailPanel />}

      {mobile && !inNeed && !menuB && <BottomNav active={active} hideComposer={hideComposer} />}
      {mobile && menuB && <RadialMenu active={active} needsFallbackOrb={!onHome && !inNeed} />}

      <VariantPill />
    </div>
  );
}
