// Splits raw resume text into individual "bullet-like" lines so we can
// score and rewrite them one at a time, instead of treating the whole
// resume as one blob.
//
// Contact-info headers (name, email, phone, social icons) often come out
// of PDF extraction as one long garbled line - we filter those out so
// they never get treated as a real bullet point.
function splitIntoBullets(resumeText) {
  return resumeText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 25 && line.length < 300)
    .map((line) => line.replace(/^[-•*\u2022]\s*/, "")) // strip leading bullet chars
    .filter(isLikelyBullet);
}

function isLikelyBullet(line) {
  // Skip lines with an email address or phone number - these are almost
  // always contact-info headers, not resume content.
  if (/@/.test(line)) return false;
  if (/\+?\d[\d\s-]{7,}\d/.test(line)) return false;

  // Skip lines that are mostly symbols/glyphs (garbled icon characters
  // from PDF extraction, e.g. social-media icon glyphs).
  const letters = (line.match(/[a-zA-Z]/g) || []).length;
  if (letters / line.length < 0.6) return false;

  // A real bullet point is usually a sentence-like phrase with several
  // words, not a name/title fragment.
  const wordCount = line.split(/\s+/).filter(Boolean).length;
  if (wordCount < 5) return false;

  return true;
}

module.exports = { splitIntoBullets };