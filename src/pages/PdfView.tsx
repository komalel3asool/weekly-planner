import { AppData } from '../types'
import { supabase } from '../lib/supabase'
import './PdfView.css'
import React, { useState, useRef } from 'react'

interface Props {
  data: AppData
  update: (fn: (d: AppData) => AppData) => void
}

export default function PdfView({ data, update }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const pdf = data.pdfReader

  const handleFileUpload = async (file: File) => {
    if (!file.type.includes('pdf') && !file.type.includes('image')) {
      setError('Only PDF and image files supported')
      return
    }

    setUploading(true)
    setError('')
    
    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop()
      const fileName = `pdf-${Date.now()}.${fileExt}`
      const filePath = `pdf-documents/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('pdf-documents')
        .upload(filePath, file, { upsert: false })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('pdf-documents')
        .getPublicUrl(filePath)

      // Update PDF reader
      update(d => ({
        ...d,
        pdfReader: {
          url: publicUrl,
          currentPage: 1,
          notes: ''
        }
      }))
      console.log('✅ PDF uploaded')
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload PDF')
    } finally {
      setUploading(false)
    }
  }

  const clearPdf = () => {
    if (confirm('Clear this PDF?')) {
      update(d => ({
        ...d,
        pdfReader: { url: '', currentPage: 1, notes: '' }
      }))
    }
  }

  return (
    <div className="pdf-view">
      {!pdf.url ? (
        <div className="pdf-empty">
          <div className="empty-card">
            <h2>📚 PDF Reader</h2>
            <p>Upload a PDF or image to start reading</p>
            <button 
              className="button large"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? '⏳ Uploading...' : '+ Upload PDF'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              style={{ display: 'none' }}
            />
            {error && <p className="error">{error}</p>}
          </div>
        </div>
      ) : (
        <div className="pdf-container">
          <div className="pdf-viewer">
            <div className="pdf-header">
              <h3>Reading</h3>
              <button 
                className="button small secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                📁 Replace
              </button>
              <button 
                className="icon-btn delete"
                onClick={clearPdf}
              >
                ✕
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                style={{ display: 'none' }}
              />
            </div>
            <div className="pdf-embed">
              {pdf.url.endsWith('.pdf') ? (
                <iframe 
                  src={`${pdf.url}#page=${pdf.currentPage}`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="PDF Document"
                />
              ) : (
                <img 
                  src={pdf.url} 
                  alt="Document" 
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              )}
            </div>
          </div>

          <div className="notes-panel">
            <div className="notes-header">
              <h3>Notes</h3>
              <span className="page-tracker">Page {pdf.currentPage}</span>
            </div>
            <textarea
              className="notes-textarea"
              value={pdf.notes}
              onChange={(e) => update(d => ({
                ...d,
                pdfReader: { ...d.pdfReader, notes: e.target.value }
              }))}
              placeholder="Take notes while reading..."
            />
          </div>
        </div>
      )}
    </div>
  )
}
