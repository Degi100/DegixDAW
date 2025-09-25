import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xcdzugnjzrkngzmtzeip.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjZHp1Z25qenJrbmd6bXR6ZWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MzY4NjAsImV4cCI6MjA3NDMxMjg2MH0.5W99cq4lNO_5XqVWkGJ8_q4C6PzD0gSKnJjj37NU-rU'
export const supabase = createClient(supabaseUrl, supabaseKey)

