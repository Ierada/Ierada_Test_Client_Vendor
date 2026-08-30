const RESTRICTED_PATTERNS = [
  /\bcure[sd]?\b/i,
  /\bguaranteed\s+weight\s+loss\b/i,
  /\b100%\s*safe\b/i,
  /\bno\s*side\s*effects\b/i,
  /\bfda\s*approved\b/i,
  /\bmiracle\b/i,
  /\bbest\s+in\s+the\s+world\b/i,
  /\bpermanent\s+results\b/i,
  /\bclinically\s+proven\b/i,
  /\bcancer\b/i,
  /\bcovid\b/i,
];

export function findRestrictedHits(text) {
  const s = String(text || "");
  const hits = [];
  for (const re of RESTRICTED_PATTERNS) {
    const m = s.match(re);
    if (m) hits.push(m[0]);
  }
  return [...new Set(hits)];
}

export function scrubRestrictedText(text) {
  let s = String(text || "");
  for (const re of RESTRICTED_PATTERNS) {
    s = s.replace(re, "[claim removed]");
  }
  return s;
}
