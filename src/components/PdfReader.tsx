import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { usePdfData } from '../hooks/usePdfData'

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

export function PdfReader({ onBack }: { onBack: () => void }) {
  const { currentPage, notes, pdfUrl, savePage, saveNotes, setPdfUrl } = usePdfData()
  const [numPages, setNumPages] = useState(0)

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f5f5f5' }}>
      {/* Back button */}
      <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 100 }}>
        <button onClick={onBack} style={{ padding: '0.5rem 1rem', background: '#78350f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>← Back</button>
      </div>

      {/* PDF Viewer - Left Side */}
      <div style={{ flex: 1, overflow: 'auto', padding: '2rem', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {!pdfUrl && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2 style={{ color: '#78350f', marginBottom: '1rem' }}>📚 Upload a PDF Book</h2>
            <input type="text" placeholder="Paste PDF URL..." value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} style={{ width: '100%', maxWidth: '400px', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '1rem' }} />
            <p style={{ fontSize: '0.875rem', color: '#666' }}>or upload to a cloud service (Google Drive, Dropbox) and paste the shareable link</p>
          </div>
        )}

        {pdfUrl && (
          <>
            <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess} style={{ marginBottom: '2rem' }}>
              <Page pageNumber={currentPage} width={400} />
            </Document>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
              <button onClick={() => savePage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1} style={{ padding: '0.5rem 1rem', background: currentPage <= 1 ? '#ccc' : '#78350f', color: 'white', border: 'none', borderRadius: '4px', cursor: currentPage <= 1 ? 'default' : 'pointer' }}>← Prev</button>
              <span style={{ fontSize: '0.875rem', color: '#666' }}>{currentPage} / {numPages}</span>
              <input type="number" min="1" max={numPages} value={currentPage} onChange={(e) => savePage(parseInt(e.target.value))} style={{ width: '60px', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }} />
              <button onClick={() => savePage(Math.min(numPages, currentPage + 1))} disabled={currentPage >= numPages} style={{ padding: '0.5rem 1rem', background: currentPage >= numPages ? '#ccc' : '#78350f', color: 'white', border: 'none', borderRadius: '4px', cursor: currentPage >= numPages ? 'default' : 'pointer' }}>Next →</button>
            </div>
          </>
        )}
      </div>

      {/* Notes Area - Right Side */}
      <div style={{ flex: 1, padding: '2rem', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', display: 'flex', flexDirection: 'column', borderLeft: '2px solid #e5e7eb' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#78350f', marginBottom: '1rem', marginTop: '3rem' }}>📝 Study Notes</h3>
        <textarea value={notes} onChange={(e) => saveNotes(e.target.value)} placeholder="Take notes while reading..." style={{ flex: 1, padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'sans-serif', fontSize: '0.95rem', resize: 'none' }} />
        <div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '0.5rem', textAlign: 'right' }}>Auto-saving...</div>
      </div>
    </div>
  )
}