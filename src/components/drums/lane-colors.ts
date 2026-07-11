// ── Lane accent colours (Trommer) ─────────────────────────────────────────────
// One concrete colour per lane (kick … ride) shared by the falling canvas and
// the screen pads so a marker and its pad always match. Concrete hexes (not CSS
// vars) because the canvas cannot resolve variables; drawn from the suite
// palette: amber/gold for the backbone, sea for the snare, warm earth for the
// toms, pale metals for the cymbals.

export const LANE_COLORS: string[] = [
  '#EBB84B', // kick — suite amber (the anchor)
  '#5FB3A1', // snare — sea
  '#C9BFAE', // closed hi-hat — pale bone
  '#E8DCC3', // open hi-hat — lighter, "opened up"
  '#C96A50', // low tom — terracotta
  '#D98E5A', // mid tom — lighter earth
  '#E2AE6B', // high tom — toward the gold
  '#F2D48A', // crash — bright gold
  '#B9C7A9', // ride — soft sage metal
]
