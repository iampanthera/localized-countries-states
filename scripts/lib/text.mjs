// Pure text helpers: normalization, edit distance, ISO display-name un-inversion.

export function normalize(str) {
  return String(str)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ""); // keep only latin alnum (CJK/Cyrillic drop out -> handled via en/latin langs)
}

export function levenshtein(a, b) {
  const m = a.length,
    n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => i);
  for (let j = 1; j <= n; j++) {
    let prev = dp[0];
    dp[0] = j;
    for (let i = 1; i <= m; i++) {
      const tmp = dp[i];
      dp[i] = Math.min(dp[i] + 1, dp[i - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[m];
}

export function ratio(a, b) {
  if (!a.length && !b.length) return 1;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

// Un-invert the ISO comma form for display: "Asturias, Principado de" -> "Principado de Asturias".
export function displayIsoName(name) {
  const m = /^(.+), (.+)$/.exec(name);
  return m ? `${m[2]} ${m[1]}` : name;
}
