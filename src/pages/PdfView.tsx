import { AppData } from '../types'
import './PdfView.css'

interface Props {
  data: AppData
  update: (fn: (d: AppData) => AppData) => void
}

export default function PdfView({ data, update }: Props) {
  const pdf = data.pdfReader
  const [showUpload, setShowUpload] = React.useState(!pdf.url)

  return (
    <div className="pdf-view">
      <div className="pdf-header">
        <h1>📚 PDF Reader</h1>
      </div>

      {showUpload ? (
        <div className="pdf-upload">
          <input
            className="input"
            type="text"
            placeholder="Paste PDF URL..."
            onChange={(e) => update(d => ({
              ...d,
              pdfReader: { ...d.pdfReader, url: e.target.value }
            }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.target as any).value) {
                setShowUpload(false)
              }
            }}
          />
          <p className="upload-hint">Enter a PDF URL (e.g., from your book or document)</p>
        </div>
      ) : (
        <div className="pdf-container">
          <div className="pdf-viewer">
            <div className="pdf-placeholder">
              <p>📄 PDF Viewer</p>
              <small>{pdf.url}</small>
              <p>Native PDF rendering coming soon</p>
              <button className="button secondary" onClick={() => setShowUpload(true)}>Change PDF</button>
            </div>
          </div>

          <div className="pdf-notes">
            <h2>Notes</h2>
            <textarea
              className="notes-textarea"
              placeholder="Take notes here..."
              value={pdf.notes}
              onChange={(e) => update(d => ({
                ...d,
                pdfReader: { ...d.pdfReader, notes: e.target.value }
              }))}
            />
          </div>
        </div>
      )}
    </div>
  )
}

import React from 'react'
