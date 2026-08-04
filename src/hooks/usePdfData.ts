import { useState, useEffect, useCallback } from 'react'
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
}