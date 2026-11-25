import type { ReactElement } from "react";
import styles from "./ProviderLogo.module.css";

export type ProviderId = "gmail" | "outlook" | "drive" | "google" | "apple";

type Props = {
  provider: ProviderId;
  size?: number;
  className?: string;
  /** Si false, le logo est décoratif (aria-hidden). Sinon, libellé vocal. */
  labelled?: boolean;
};

const LABEL: Record<ProviderId, string> = {
  gmail: "Gmail",
  outlook: "Outlook",
  drive: "Drive",
  google: "Google",
  apple: "Apple",
};

/**
 * Logos sobres et reconnaissables, sans reproduire les marques à l'identique.
 * Formes géométriques et couleurs proches, dessinées à la main.
 */
export function ProviderLogo({ provider, size = 28, className, labelled = true }: Props) {
  return (
    <span
      className={[styles.logo, styles[provider], className].filter(Boolean).join(" ")}
      style={{ width: size, height: size }}
      role={labelled ? "img" : undefined}
      aria-label={labelled ? LABEL[provider] : undefined}
      aria-hidden={labelled ? undefined : true}
    >
      <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
        {GLYPH[provider]}
      </svg>
    </span>
  );
}

const GLYPH: Record<ProviderId, ReactElement> = {
  gmail: (
    <>
      <rect x="4" y="7" width="24" height="18" rx="3" fill="currentColor" opacity="0.12" />
      <path
        d="M5 10.5 16 18l11-7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5 24.5V10.5M27 24.5V10.5" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.45" />
    </>
  ),
  outlook: (
    <>
      <rect x="12" y="7" width="16" height="18" rx="2.5" fill="currentColor" opacity="0.12" />
      <rect x="4" y="10" width="14" height="14" rx="2" fill="currentColor" />
      <circle cx="11" cy="17" r="3.2" fill="var(--color-surface)" />
      <path
        d="M14 12.5h11.5v11H14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity="0.55"
      />
    </>
  ),
  drive: (
    <>
      <path d="M16 5.5 27 24.5H5Z" fill="currentColor" opacity="0.14" />
      <path d="M16 5.5 21.5 15H10.5Z" fill="currentColor" opacity="0.55" />
      <path d="M10.5 15 5 24.5h11Z" fill="currentColor" />
      <path d="M21.5 15 27 24.5H16Z" fill="currentColor" opacity="0.35" />
    </>
  ),
  google: (
    <>
      <circle cx="16" cy="16" r="11" fill="currentColor" opacity="0.1" />
      <path
        d="M25.5 16.2c0-.7-.06-1.37-.18-2H16v3.8h5.35a4.57 4.57 0 0 1-1.98 3l3.2 2.48c1.87-1.73 2.93-4.28 2.93-7.28Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M16 26c2.7 0 4.96-.9 6.61-2.42l-3.2-2.48c-.9.6-2.04.96-3.41.96-2.62 0-4.84-1.77-5.63-4.15H7.07v2.56A10 10 0 0 0 16 26Z"
        fill="currentColor"
        opacity="0.65"
      />
      <path
        d="M10.37 17.91A6 6 0 0 1 10 16c0-.66.13-1.3.37-1.91V11.53H7.07A10 10 0 0 0 6 16c0 1.61.39 3.13 1.07 4.47l3.3-2.56Z"
        fill="currentColor"
        opacity="0.45"
      />
      <path
        d="M16 10c1.47 0 2.79.5 3.83 1.5l2.87-2.87C21.95 6.99 19.7 6 16 6a10 10 0 0 0-8.93 5.53l3.3 2.56C11.16 11.77 13.38 10 16 10Z"
        fill="currentColor"
      />
    </>
  ),
  apple: (
    <>
      <path
        d="M21.6 11.2c-1.2.1-2.65.85-3.5 1.85-.76.9-1.42 2.25-1.24 3.55 1.35.1 2.74-.7 3.55-1.7.82-1 1.4-2.35 1.19-3.7ZM23.4 16.4c-.03-2.3 1.88-3.4 1.96-3.45-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.84-.81-3.03-.79-1.56.02-3 .9-3.8 2.3-1.62 2.82-.41 7 1.16 9.3.77 1.12 1.68 2.38 2.88 2.33 1.16-.05 1.6-.74 3-.74s1.8.74 3.03.72c1.25-.02 2.04-1.14 2.8-2.27.88-1.29 1.24-2.54 1.26-2.6-.03-.01-2.41-.92-2.46-3.63Z"
        fill="currentColor"
      />
    </>
  ),
};
