import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://saopexcptpswgbdoslby.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhb3BleGNwdHBzd2diZG9zbGJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MjE0MjQsImV4cCI6MjEwMDk5NzQyNH0.jzMTGhMprNuIIGoA67qZbOBJ2kCwxD4l9L8bQ3PFa2Q'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
