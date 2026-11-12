import ScoreWave from "./ScoreWave.jsx";

export default function ReportModal({ report, onClose }) {
  if (!report) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close report">
          ×
        </button>

        <span className="eyebrow">Match report</span>
        <h2>How this resume resonates</h2>

        <ScoreWave score={report.overallScore} />

        <section>
          <h3>Missing skills &amp; keywords</h3>
          {report.missingSkills?.length ? (
            <ul className="chip-list">
              {report.missingSkills.map((skill, i) => (
                <li key={i} className="chip">
                  {skill}
                </li>
              ))}
            </ul>
          ) : (
            <p className="cell-muted">Nothing significant missing — nice work.</p>
          )}
        </section>

        <section>
          <h3>Suggestions</h3>
          <ul className="suggestion-list">
            {report.suggestions?.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>

        {report.rewrites?.length > 0 && (
          <section>
            <h3>Rewritten bullet points</h3>
            {report.rewrites.map((r, i) => (
              <div className="rewrite-card" key={i}>
                <p className="before">
                  <span className="rewrite-label">Before · {r.initialScore}%</span>
                  {r.original}
                </p>
                <p className="after">
                  <span className="rewrite-label">After · {r.finalScore}%</span>
                  {r.finalRewrite}
                </p>
                <p className="meta">
                  {r.attempts} rewrite attempt{r.attempts !== 1 ? "s" : ""}
                </p>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
