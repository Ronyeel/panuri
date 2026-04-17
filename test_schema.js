import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env.local', 'utf-8')
const anonKeyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)
const urlMatch = envFile.match(/VITE_SUPABASE_URL=(.*)/)

const supabase = createClient(urlMatch[1], anonKeyMatch[1])

async function run() {
  const { data, error } = await supabase.from('quiz_responses').select('*').limit(1)
  console.log(Object.keys(data[0] || {}))
}
run()
