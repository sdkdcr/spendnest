// Fixed palette categories are assigned from once, at creation time (see
// docs/REQUIREMENTS.md 4.2.1). Colors are stored on the Category row itself
// rather than derived at render time, so this array only needs to supply the
// next unused slot — it is never re-walked positionally after assignment.
export const CATEGORY_COLOR_PALETTE = [
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

export const FALLBACK_CATEGORY_COLOR = '#1F77B4'
