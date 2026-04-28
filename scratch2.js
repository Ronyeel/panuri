import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({path: ".env.local"})

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

console.log("Listening...")
const channel = supabase.channel('test_channel')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_sets' }, (payload) => {
    console.log('RECEIVED quiz_sets EVENT!', payload)
  })
  .subscribe((status) => {
    console.log("Status:", status)
  })

// Wait 3 seconds, then insert, then delete
setTimeout(async () => {
  console.log("Inserting...")
  const { data, error } = await supabase.from('quiz_sets').insert([{ title: 'Test DB Realtime' }]).select()
  console.log("Insert result:", data, error)
  
  if (data && data.length > 0) {
    setTimeout(async () => {
      console.log("Deleting...")
      await supabase.from('quiz_sets').delete().eq('id', data[0].id)
      console.log("Delete done.")
      
      setTimeout(() => process.exit(0), 3000)
    }, 2000)
  } else {
    process.exit(1)
  }
}, 3000)

