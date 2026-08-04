#!/bin/bash

cd ~/Downloads/weekly-planner

echo "📚 Setting up PDF Reader with note-taking..."

# 1. Install react-pdf
echo "Installing react-pdf..."
npm install react-pdf pdfjs-dist

# 2. Create usePdfData hook
python3 << 'PYEND'
code = """import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function usePdfData() {
  const [currentPage, setCurrentPage] = useState(1)
  const [notes, setNotes] = useState('')
  const [pdfUrl, setPdfUrl] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchPdfData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('pdf_reader')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setCurrentPage(data.current_page || 1)
        setNotes(data.notes || '')
        setPdfUrl(data.pdf_url || '')
      }
    } catch (err) {
      console.log('First time setup')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPdfData()
  }, [fetchPdfData])

  const savePage = useCallback(async (page: number) => {
    setCurrentPage(page)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('pdf_reader')
      .upsert({ user_id: user.id, current_page: page, notes, pdf_url: pdfUrl }, { onConflict: 'user_id' })
  }, [notes, pdfUrl])

  const saveNotes = useCallback(async (newNotes: string) => {
    setNotes(newNotes)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('pdf_reader')
      .upsert({ user_id: user.id, current_page: currentPage, notes: newNotes, pdf_url: pdfUrl }, { onConflict: 'user_id' })
  }, [currentPage, pdfUrl])

  return { currentPage, notes, pdfUrl, loading, savePage, saveNotes, setPdfUrl }
}"""

with open('src/hooks/usePdfData.ts', 'w') as f:
    f.write(code)

print('✅ Hook created')
PYEND

# 3. Create PdfReader component
python3 << 'PYEND'
code = '''import { useState } from 'react'
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
}'''

with open('src/components/PdfReader.tsx', 'w') as f:
    f.write(code)

print('✅ Component created')
PYEND

echo ""
echo "✅ PDF Reader setup complete!"
echo ""
echo "NEXT STEPS:"
echo "1. Create Supabase table (see below)"
echo "2. Add button to App.tsx"
echo "3. npm run dev"
echo ""
echo "Run this SQL in Supabase:"
echo ""
cat << 'SQLEOF'
CREATE TABLE pdf_reader (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  pdf_url TEXT,
  current_page INT DEFAULT 1,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE pdf_reader ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own pdf data" ON pdf_reader FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own pdf data" ON pdf_reader FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pdf data" ON pdf_reader FOR INSERT WITH CHECK (auth.uid() = user_id);
SQLEOF

