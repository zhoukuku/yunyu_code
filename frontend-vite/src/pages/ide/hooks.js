// ============================================================================
// IDE Custom Hooks & Utilities
// ============================================================================

import { useCallback } from 'react';

/**
 * Returns a helper function that updates the currently selected sprite.
 * Encapsulates the repeated pattern:
 *   setSprites(prev => prev.map(s => s.id === selectedSprite ? { ...s, ...updates } : s))
 *
 * @param {Function} setSprites - state setter for sprites array
 * @param {string|null} selectedSprite - id of the currently selected sprite
 * @returns {Function} updater(updates) - call with partial sprite updates
 */
export function useUpdateSelectedSprite(setSprites, selectedSprite) {
  return useCallback(
    (updates) => {
      setSprites(prev =>
        prev.map(s =>
          s.id === selectedSprite ? { ...s, ...updates } : s
        )
      );
    },
    [setSprites, selectedSprite]
  );
}

/**
 * Generate a unique ID string (length 9).
 */
export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Normalize angle to [0, 360).
 */
export function normalizeAngle(angle) {
  let a = angle % 360;
  if (a < 0) a += 360;
  return a;
}
