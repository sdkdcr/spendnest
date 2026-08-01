import { CATEGORY_COLOR_PALETTE } from '../../shared/domain/category-palette'
import type { Category } from '../../shared/domain/types'

// Picks the first palette color not already used by an existing category for
// the family. Once the palette is exhausted, colors are reused round-robin —
// still a one-time assignment at creation, never re-derived afterward.
export function pickNextCategoryColor(
  existingCategories: Category[],
  palette: string[] = CATEGORY_COLOR_PALETTE,
): string {
  const usedColors = new Set(existingCategories.map((category) => category.color))
  const unusedColor = palette.find((color) => !usedColors.has(color))

  if (unusedColor) {
    return unusedColor
  }

  return palette[existingCategories.length % palette.length]
}
