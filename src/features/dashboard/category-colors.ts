const highContrastPalette = [
  '#1F77B4',
  '#D62728',
  '#2CA02C',
  '#FF7F0E',
  '#9467BD',
  '#17BECF',
  '#BCBD22',
  '#8C564B',
  '#E377C2',
  '#7F7F7F',
  '#4E79A7',
  '#E15759',
]

const fallbackColor = '#1F77B4'

export function buildCategoryColorMap(
  categoryTypes: string[],
): Record<string, string> {
  const uniqueSortedTypes = Array.from(
    new Set(categoryTypes.map((type) => type.trim()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b))

  return uniqueSortedTypes.reduce<Record<string, string>>((acc, type, index) => {
    acc[type] = highContrastPalette[index % highContrastPalette.length]
    return acc
  }, {})
}

export function getCategoryColor(
  categoryType: string,
  colorByType?: Record<string, string>,
): string {
  if (colorByType && colorByType[categoryType]) {
    return colorByType[categoryType]
  }

  return fallbackColor
}
