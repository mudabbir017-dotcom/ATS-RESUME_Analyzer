// The brand's signature visual: two waveforms representing the resume and
// the job description. At a low match score they oscillate out of phase;
// as the score climbs toward 100 they lock into alignment, resonating as
// a single line. This stands in for a generic progress ring/circle.

function wavePath(width, height, amplitude, frequency, phase, yOffset, steps = 64) {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = t * width;
    const y = yOffset + amplitude * Math.sin(t * frequency * Math.PI * 2 + phase);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return `M${points.join(" L")}`;
}

function bandFor(score) {
  if (score >= 80) return { label: "Resonant", color: "var(--good)" };
  if (score >= 50) return { label: "Partial match", color: "var(--accent)" };
  return { label: "Out of phase", color: "var(--bad)" };
}

export default function ScoreWave({ score, width = 320, height = 120 }) {
  const clamped = Math.max(0, Math.min(100, score));
  const yOffset = height / 2;
  const amplitude = height * 0.16;
  const frequency = 2.5;
  // At score 0 the two waves are maximally out of phase; at 100 they align.
  const phaseShift = (1 - clamped / 100) * Math.PI * 0.85;

  const resumePath = wavePath(width, height, amplitude, frequency, 0, yOffset);
  const jobPath = wavePath(width, height, amplitude, frequency, phaseShift, yOffset);
  const band = bandFor(clamped);

  return (
    <div className="score-wave">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
        <line x1="0" y1={yOffset} x2={width} y2={yOffset} stroke="var(--border)" strokeWidth="1" />
        <path d={jobPath} fill="none" stroke={band.color} strokeWidth="2.5" opacity="0.85" />
        <path d={resumePath} fill="none" stroke="var(--accent-strong)" strokeWidth="2.5" opacity="0.85" />
      </svg>
      <div className="score-wave-readout">
        <span className="score-wave-number">{Math.round(clamped)}</span>
        <span className="score-wave-suffix">%</span>
      </div>
      <div className="score-wave-band" style={{ color: band.color }}>
        {band.label}
      </div>
    </div>
  );
}
