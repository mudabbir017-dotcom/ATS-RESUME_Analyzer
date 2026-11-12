import { useState } from "react";
import api from "../api/axios";
import ReportModal from "../components/ReportModal.jsx";

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Attach your resume as a PDF to continue.");
      return;
    }
    if (jobDescription.trim().length < 20) {
      setError("Paste a fuller job description — a sentence or two isn't enough to compare against.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobDescription", jobDescription);

    setLoading(true);
    try {
      const { data } = await api.post("/analysis/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setReport(data);
    } catch (err) {
      setError(err.response?.data?.message || "The analysis didn't complete. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dashboard">
      <section className="hero">
        <span className="eyebrow">Semantic resume matching</span>
        <h1>
          Does your resume <em>resonate</em> with the role?
        </h1>
        <p className="hero-copy">
          Most keyword scanners just count matching words. Resonance reads for meaning —
          it compares what your resume actually says against what the role actually
          needs, flags the gap, and rewrites the weak spots until they land.
        </p>
      </section>

      <form className="analyze-form card" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="resume-upload">Resume</label>
          <input
            id="resume-upload"
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <span className="field-hint">PDF only, up to 5MB.</span>
        </div>

        <div className="field">
          <label htmlFor="job-description">Job description</label>
          <textarea
            id="job-description"
            rows={8}
            placeholder="Paste the full job description here…"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>

        {error && <p className="error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Reading for resonance… (~15–30s)" : "Run the analysis"}
        </button>
      </form>

      <ReportModal report={report} onClose={() => setReport(null)} />
    </div>
  );
}
