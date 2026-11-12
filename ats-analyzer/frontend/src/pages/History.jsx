import { useEffect, useState } from "react";
import api from "../api/axios";
import ReportModal from "../components/ReportModal.jsx";
import PdfViewerModal from "../components/PdfViewerModal.jsx";

export default function History() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState(null); // { url, name }
  const [pendingId, setPendingId] = useState(null); // row currently loading a pdf action

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get("/analysis/history");
        setItems(data);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load history");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function openReport(id) {
    const { data } = await api.get(`/analysis/${id}`);
    setSelected(data);
  }

  async function fetchPdfBlob(id) {
    const res = await api.get(`/analysis/${id}/pdf`, { responseType: "blob" });
    return window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
  }

  // Opens the stored resume PDF inline, in an in-app preview modal.
  async function handleView(id, filename, e) {
    e.stopPropagation();
    setPendingId(id);
    try {
      const url = await fetchPdfBlob(id);
      setPreview({ url, name: filename });
    } finally {
      setPendingId(null);
    }
  }

  // Downloads the originally uploaded PDF for a given analysis to disk.
  async function handleDownload(id, filename, e) {
    e.stopPropagation();
    setPendingId(id);
    try {
      const url = await fetchPdfBlob(id);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || "resume.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setPendingId(null);
    }
  }

  function closePreview() {
    if (preview?.url) window.URL.revokeObjectURL(preview.url);
    setPreview(null);
  }

  if (loading) return <p className="centered">Loading history…</p>;
  if (error) return <p className="centered error">{error}</p>;

  return (
    <div className="history-page">
      <h1>Past analyses</h1>
      <p className="subtitle">Every resume you've run against a role, scored and saved.</p>

      {items.length === 0 ? (
        <div className="empty-state">
          <p>Nothing here yet. Run your first analysis from the Analyze tab.</p>
        </div>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>Resume</th>
              <th>Score</th>
              <th>Missing skills</th>
              <th>Date</th>
              <th className="col-actions">Resume file</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id} onClick={() => openReport(item._id)}>
                <td className="cell-name">{item.resumeFileName}</td>
                <td>
                  <span className="score-pill">{item.overallScore}%</span>
                </td>
                <td className="cell-muted">
                  {item.missingSkills?.slice(0, 3).join(", ") || "None flagged"}
                </td>
                <td className="cell-muted">
                  {new Date(item.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="col-actions">
                  <div className="btn-group">
                    <button
                      className="btn btn-ghost btn-sm"
                      disabled={pendingId === item._id}
                      onClick={(e) => handleView(item._id, item.resumeFileName, e)}
                    >
                      View
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      disabled={pendingId === item._id}
                      onClick={(e) => handleDownload(item._id, item.resumeFileName, e)}
                    >
                      Download
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ReportModal report={selected} onClose={() => setSelected(null)} />
      <PdfViewerModal
        fileUrl={preview?.url}
        fileName={preview?.name}
        onClose={closePreview}
      />
    </div>
  );
}
