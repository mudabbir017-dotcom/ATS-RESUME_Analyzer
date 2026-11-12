export default function PdfViewerModal({ fileUrl, fileName, onClose }) {
  if (!fileUrl) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal pdf-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pdf-modal-header">
          <span className="pdf-modal-name">{fileName}</span>
          <button className="modal-close" onClick={onClose} aria-label="Close preview">
            ×
          </button>
        </div>
        <iframe
          src={fileUrl}
          title={`Preview of ${fileName}`}
          className="pdf-frame"
        />
      </div>
    </div>
  );
}
