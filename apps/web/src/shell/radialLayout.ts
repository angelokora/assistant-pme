/** Dimensions des cartes du menu radial (doivent coller au CSS). */
export const RADIAL_CARD = { width: 96, height: 56 } as const;

const ORB_GAP = 20;
const CARD_GAP = 8;
const SCREEN_MARGIN = 12;

export type FanLayout = {
  /** Centre de l'orbe (viewport). */
  origin: { x: number; y: number };
  /** Distance centre orbe → centre carte. */
  radius: number;
  /** +1 = éventail vers le haut, -1 vers le bas. */
  direction: 1 | -1;
  /** Décalage horizontal pour rester dans l'écran. */
  shiftX: number;
  /** Angles en radians depuis la verticale (sens trigo, 0 = haut). */
  angles: number[];
};

/**
 * Place n cartes autour d'une orbe sans chevauchement ni débordement d'écran.
 * Le rayon utilise la demi-diagonale de la carte pour qu'aucun coin ne coupe l'orbe.
 */
export function layoutRadialFan(
  orb: DOMRect,
  count: number,
  viewport: { width: number; height: number } = {
    width: typeof window !== "undefined" ? window.innerWidth : 390,
    height: typeof window !== "undefined" ? window.innerHeight : 844,
  },
  card = RADIAL_CARD,
): FanLayout {
  const orbR = Math.max(orb.width, orb.height) / 2;
  const origin = { x: orb.left + orb.width / 2, y: orb.top + orb.height / 2 };
  const cardHalfDiag = Math.hypot(card.width / 2, card.height / 2);

  let radius = orbR + ORB_GAP + cardHalfDiag;
  // Écart angulaire minimal pour ≥ CARD_GAP entre bords des cartes (corde sur la largeur).
  const chord = card.width + CARD_GAP;
  let step = 2 * Math.asin(Math.min(1, chord / (2 * radius)));
  // Si le pas force un éventail trop large, augmente le rayon.
  const maxSpan = Math.PI * 0.95;
  if (count > 1 && step * (count - 1) > maxSpan) {
    radius = chord / (2 * Math.sin(maxSpan / (2 * (count - 1))));
    radius = Math.max(radius, orbR + ORB_GAP + cardHalfDiag);
    step = 2 * Math.asin(Math.min(1, chord / (2 * radius)));
  }

  const angles = Array.from({ length: count }, (_, i) => (i - (count - 1) / 2) * step);

  const place = (dir: 1 | -1, shiftX: number) =>
    angles.map((a) => ({
      x: origin.x + Math.sin(a) * radius + shiftX,
      y: origin.y - dir * Math.cos(a) * radius,
    }));

  // Préfère l'ouverture vers le haut si ça tient.
  let direction: 1 | -1 = 1;
  let centers = place(direction, 0);
  const tops = centers.map((c) => c.y - card.height / 2);
  if (Math.min(...tops) < SCREEN_MARGIN) {
    direction = -1;
    centers = place(direction, 0);
  }

  let shiftX = 0;
  const lefts = centers.map((c) => c.x - card.width / 2);
  const rights = centers.map((c) => c.x + card.width / 2);
  const minL = Math.min(...lefts);
  const maxR = Math.max(...rights);
  if (minL < SCREEN_MARGIN) shiftX += SCREEN_MARGIN - minL;
  if (maxR + shiftX > viewport.width - SCREEN_MARGIN) {
    shiftX += viewport.width - SCREEN_MARGIN - (maxR + shiftX);
  }
  centers = place(direction, shiftX);
  const minL2 = Math.min(...centers.map((c) => c.x - card.width / 2));
  if (minL2 < SCREEN_MARGIN) shiftX += SCREEN_MARGIN - minL2;

  return { origin, radius, direction, shiftX, angles };
}

/** Offset animé (depuis le centre de l'orbe) pour une carte. */
export function fanOffset(layout: FanLayout, index: number): { x: number; y: number } {
  const a = layout.angles[index] ?? 0;
  return {
    x: Math.sin(a) * layout.radius + layout.shiftX,
    y: -layout.direction * Math.cos(a) * layout.radius,
  };
}
