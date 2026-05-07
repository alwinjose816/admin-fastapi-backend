import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://yewmxtzbygmcaicpmxfz.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlld214dHpieWdtY2FpY3BteGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NzM5MzgsImV4cCI6MjA5MDU0OTkzOH0.3KzP09-g4ThJg9JuZZ2jbVrCLhCtIDuWkc13lvqAgzg"

export const supabase = createClient(supabaseUrl, supabaseKey)