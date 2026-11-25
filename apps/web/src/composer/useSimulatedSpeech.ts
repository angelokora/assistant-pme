import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Voix simulée : déroule une transcription mot à mot avec un rythme naturel et un niveau sonore crédible.
 * Remplaçable par la reconnaissance vocale du navigateur (spike #28).
 */
export function useSimulatedSpeech(text: string) {
  const words = text.split(/\s+/).filter(Boolean);
  const [visible, setVisible] = useState(0);
  const [level, setLevel] = useState(0);
  const [running, setRunning] = useState(false);
  const timer = useRef<number>();

  const stop = useCallback(() => {
    window.clearTimeout(timer.current);
    setRunning(false);
    setLevel(0);
  }, []);

  const start = useCallback(() => {
    window.clearTimeout(timer.current);
    setVisible(0);
    setRunning(true);
  }, []);

  useEffect(() => {
    if (!running) return;
    if (visible >= words.length) {
      setLevel(0.08);
      return;
    }
    const word = words[visible] ?? "";
    const pause = /[,.;:!?…]$/.test(word) ? 260 : 0;
    const delay = 70 + Math.min(word.length * 14, 110) + Math.random() * 60 + pause;
    timer.current = window.setTimeout(() => {
      setVisible((v) => v + 1);
      setLevel(pause ? 0.15 : 0.35 + Math.random() * 0.6);
    }, delay);
    return () => window.clearTimeout(timer.current);
  }, [running, visible, words]);

  return { words, visible, level, running, finished: running && visible >= words.length, start, stop };
}
