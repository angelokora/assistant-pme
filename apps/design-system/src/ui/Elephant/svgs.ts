/** Contenu SVG (sans metadata C2PA) issu de docs/brand/elephant/. */
export const VIEWBOX = "-6 -4 112 108";

export const DETAILED = `<!-- Éléa, version détaillée (thème Vivant). Groupes animables : head, ear-left, ear-right, eyes, pupils, trunk, dots. -->
  <g class="dots" fill="var(--elephant-ink, #011627)">
    <circle cx="38" cy="7" r="3"/><circle cx="50" cy="5" r="3"/><circle cx="62" cy="7" r="3"/>
  </g>
  <g class="head">
    <g class="ear-left">
      <path d="M33 30 C14 18 2 30 4 48 C6 64 20 70 31 60 Z" fill="var(--elephant-ear, #087e8b)" stroke="var(--elephant-ink, #011627)" stroke-width="3" stroke-linejoin="round"/>
      <path d="M28 36 C18 30 12 38 13 47 C14 55 21 58 27 53" fill="none" stroke="var(--elephant-ink, #011627)" stroke-width="2" stroke-linecap="round" opacity=".35"/>
    </g>
    <g class="ear-right">
      <path d="M67 30 C86 18 98 30 96 48 C94 64 80 70 69 60 Z" fill="var(--elephant-ear, #087e8b)" stroke="var(--elephant-ink, #011627)" stroke-width="3" stroke-linejoin="round"/>
      <path d="M72 36 C82 30 88 38 87 47 C86 55 79 58 73 53" fill="none" stroke="var(--elephant-ink, #011627)" stroke-width="2" stroke-linecap="round" opacity=".35"/>
    </g>
    <path d="M50 20 C68 20 74 34 72 48 C70 60 62 66 50 66 C38 66 30 60 28 48 C26 34 32 20 50 20 Z" fill="var(--elephant-skin, #a30b37)" stroke="var(--elephant-ink, #011627)" stroke-width="3"/>
    <g class="eyes">
      <ellipse cx="41" cy="40" rx="3.6" ry="4.2" fill="var(--elephant-ink, #011627)"/>
      <ellipse cx="59" cy="40" rx="3.6" ry="4.2" fill="var(--elephant-ink, #011627)"/>
    </g>
    <g class="pupils" fill="#fff"><circle cx="42.3" cy="38.6" r="1.2"/><circle cx="60.3" cy="38.6" r="1.2"/></g>
    <g class="trunk">
      <path d="M50 54 C50 70 46 80 55 88 C59 91 64 88 62 84" fill="none" stroke="var(--elephant-ink, #011627)" stroke-width="12" stroke-linecap="round"/>
      <path d="M50 54 C50 70 46 80 55 88 C59 91 64 88 62 84" fill="none" stroke="var(--elephant-skin, #a30b37)" stroke-width="6.5" stroke-linecap="round"/>
      <path d="M46 66 h4 M46 72 h4" stroke="var(--elephant-ink, #011627)" stroke-width="1.6" stroke-linecap="round" opacity=".5"/>
    </g>
  </g>`;

export const SIMPLE = `<!-- Éléa, version simplifiée (≤ 32 px, thème Vivant). Pas d'yeux ni de points ; états écoute et parole seulement. -->
  <g class="head">
    <g class="ear-left"><path d="M33 30 C14 18 2 30 4 48 C6 64 20 70 31 60 Z" fill="var(--elephant-ear, #087e8b)" stroke="var(--elephant-ink, #011627)" stroke-width="6" stroke-linejoin="round"/></g>
    <g class="ear-right"><path d="M67 30 C86 18 98 30 96 48 C94 64 80 70 69 60 Z" fill="var(--elephant-ear, #087e8b)" stroke="var(--elephant-ink, #011627)" stroke-width="6" stroke-linejoin="round"/></g>
    <path d="M50 20 C68 20 74 34 72 48 C70 60 62 66 50 66 C38 66 30 60 28 48 C26 34 32 20 50 20 Z" fill="var(--elephant-skin, #a30b37)" stroke="var(--elephant-ink, #011627)" stroke-width="6"/>
    <g class="trunk"><path d="M50 56 C50 72 48 82 58 88" fill="none" stroke="var(--elephant-ink, #011627)" stroke-width="12" stroke-linecap="round"/></g>
  </g>`;

export const CLASSIC = `<!-- Éléa, thème Classique : sans contour, Cherry et rose pâle. Mêmes groupes que la version détaillée. -->
  <g class="dots" fill="#a30b37"><circle cx="38" cy="7" r="3"/><circle cx="50" cy="5" r="3"/><circle cx="62" cy="7" r="3"/></g>
  <g class="head">
    <g class="ear-left"><path d="M33 30 C14 18 2 30 4 48 C6 64 20 70 31 60 Z" fill="#f1c2cd"/></g>
    <g class="ear-right"><path d="M67 30 C86 18 98 30 96 48 C94 64 80 70 69 60 Z" fill="#f1c2cd"/></g>
    <path d="M50 20 C68 20 74 34 72 48 C70 60 62 66 50 66 C38 66 30 60 28 48 C26 34 32 20 50 20 Z" fill="#a30b37"/>
    <g class="eyes"><ellipse cx="41" cy="40" rx="3.2" ry="3.8" fill="#fbf8f3"/><ellipse cx="59" cy="40" rx="3.2" ry="3.8" fill="#fbf8f3"/></g>
    <g class="trunk"><path d="M50 54 C50 70 46 80 55 88 C59 91 64 88 62 84" fill="none" stroke="#a30b37" stroke-width="8" stroke-linecap="round"/></g>
  </g>`;
