import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

/**
 * Fires a full-screen confetti animation for ~3 seconds when triggered.
 *
 * @param shouldCelebrate - `true` when the last active debt was just paid off.
 */
export function useDebtFreeConfetti(shouldCelebrate: boolean) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (!shouldCelebrate || hasFired.current) return;
    hasFired.current = true;

    const duration = 3_000;
    const end = Date.now() + duration;

    function frame() {
      // Burst from left side
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ["#22c55e", "#16a34a", "#facc15", "#f59e0b", "#3b82f6"],
      });

      // Burst from right side
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ["#22c55e", "#16a34a", "#facc15", "#f59e0b", "#3b82f6"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }

    frame();
  }, [shouldCelebrate]);
}
