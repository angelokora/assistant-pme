import { useEffect, useMemo, useRef, useState } from "react";
import { DEVICE_SCREEN, DeviceFrame } from "@elea/ds";
import { useDemo } from "./demo";
import {
  DEVICE_SAFE,
  registerDemoIframe,
  subscribeDemoReady,
  type DemoSyncState,
} from "./bridge";
import styles from "./DeviceStage.module.css";

const PANEL_RESERVE = 360;
const MIN_SCALE = 0.6;

/** Hôte : fond + cadre d'appareil + iframe du prototype (`?frame=1`). */
export function DeviceStage() {
  const device = useDemo((s) => s.device);
  const orientation = useDemo((s) => s.orientation);
  const homeVariant = useDemo((s) => s.homeVariant);
  const menuVariant = useDemo((s) => s.menuVariant);
  const findVariant = useDemo((s) => s.findVariant);
  const animations = useDemo((s) => s.animations);
  const mailInterrupted = useDemo((s) => s.mailInterrupted);

  const kind = device === "tablet" ? "tablet" : "phone";
  const base = DEVICE_SCREEN[kind];
  const landscape = orientation === "landscape";
  const screenW = landscape ? base.height : base.width;
  const screenH = landscape ? base.width : base.height;
  const safe = DEVICE_SAFE[kind];
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [viewport, setViewport] = useState(() => ({
    w: typeof window !== "undefined" ? window.innerWidth : 1280,
    h: typeof window !== "undefined" ? window.innerHeight : 800,
  }));

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const getState = (): DemoSyncState => ({
      homeVariant,
      menuVariant,
      findVariant,
      animations,
      mailInterrupted,
      showVariantPill: false,
      safeTop: safe.top,
      safeBottom: safe.bottom,
    });
    return subscribeDemoReady(getState);
  }, [homeVariant, menuVariant, findVariant, animations, mailInterrupted, safe.top, safe.bottom]);

  useEffect(() => {
    return () => registerDemoIframe(null);
  }, []);

  const scale = useMemo(() => {
    const availW = Math.max(280, viewport.w - PANEL_RESERVE);
    const availH = Math.max(320, viewport.h - 48);
    const frameW = screenW + (kind === "tablet" ? 40 : 28);
    const frameH = screenH + (kind === "tablet" ? 40 : 28);
    return Math.min(1, availW / frameW, availH / frameH);
  }, [viewport, screenW, screenH, kind]);

  const src = `/?frame=1&safeTop=${safe.top}&safeBottom=${safe.bottom}`;

  return (
    <div className={styles.stage}>
      {scale < MIN_SCALE ? (
        <p className={styles.warn} role="status">
          Fenêtre trop petite pour afficher l'appareil à au moins 60 %. Agrandissez la fenêtre.
        </p>
      ) : (
        <>
          <DeviceFrame kind={kind} orientation={orientation} scale={scale}>
            <iframe
              ref={iframeRef}
              title="Prototype Éléa"
              src={src}
              className={styles.frame}
              onLoad={() => registerDemoIframe(iframeRef.current?.contentWindow ?? null)}
            />
          </DeviceFrame>
          {scale < 0.999 && (
            <p className={styles.scale} aria-live="polite">
              Échelle {Math.round(scale * 100)} %
            </p>
          )}
        </>
      )}
    </div>
  );
}
