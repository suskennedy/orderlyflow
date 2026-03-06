// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')!

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Fetching overdue reminders...')

    // Fetch tasks that:
    // 1. Are pending and active
    // 2. Have a due_date <= today
    // 3. Haven't had a reminder sent today
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('home_tasks')
      .select(`
        id,
        title,
        due_date,
        last_reminder_sent,
        homes (
          id,
          name,
          user_id,
          user_profiles!inner (
            id,
            phone,
            notification_sms
          )
        )
      `)
      .eq('status', 'pending')
      .eq('is_active', true)
      .lte('due_date', new Date().toISOString().split('T')[0])
      
    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
      throw tasksError
    }

    if (!tasks || tasks.length === 0) {
      return new Response(JSON.stringify({ message: 'No reminders to send.' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const tasksToSend = tasks.filter(task => {
      // Check if reminder was already sent today
      if (task.last_reminder_sent) {
        const lastSentDate = new Date(task.last_reminder_sent).toISOString().split('T')[0]
        const today = new Date().toISOString().split('T')[0]
        if (lastSentDate === today) return false
      }
      
      const home = Array.isArray(task.homes) ? task.homes[0] : task.homes;
      if (!home) return false;
      
      const userProfile = Array.isArray(home.user_profiles) ? home.user_profiles[0] : home.user_profiles;
      
      // Must have SMS enabled and a phone number
      if (userProfile && userProfile.notification_sms && userProfile.phone) {
        return true;
      }
      return false;
    })

    console.log(`Found ${tasksToSend.length} reminders to process.`)

    const results = []

    for (const task of tasksToSend) {
      const home = Array.isArray(task.homes) ? task.homes[0] : task.homes
      const userProfile = Array.isArray(home.user_profiles) ? home.user_profiles[0] : home.user_profiles
      
      const phone = userProfile.phone
      const dueDateStr = new Date(task.due_date).toLocaleDateString()
      const messageBody = `OrderlyFlow Reminder: "${task.title}" for ${home.name} is due on ${dueDateStr}.`

      try {
        // Prepare Twilio API request
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
        const formData = new URLSearchParams()
        formData.append('To', phone)
        formData.append('From', TWILIO_PHONE_NUMBER || '')
        formData.append('Body', messageBody)

        const authHeader = 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)

        console.log(`Sending SMS to ${phone} for task ${task.id}`)
        
        const twilioRes = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString()
        })

        const textRes = await twilioRes.text()
        
        if (!twilioRes.ok) {
          console.error(`Twilio Error sending to ${phone}:`, textRes)
          results.push({ taskId: task.id, status: 'error', error: textRes })
        } else {
          // Update last_reminder_sent timestamp
          const { error: updateError } = await supabaseAdmin
            .from('home_tasks')
            .update({ last_reminder_sent: new Date().toISOString() })
            .eq('id', task.id)
            
          if (updateError) {
            console.error(`Failed to update last_reminder_sent for task ${task.id}:`, updateError)
          }
          
          results.push({ taskId: task.id, status: 'success' })
        }
      } catch (e: any) {
        console.error(`Exception processing task ${task.id}:`, e)
        results.push({ taskId: task.id, status: 'exception', error: e.message })
      }
    }

    return new Response(JSON.stringify({ 
      processed: tasksToSend.length, 
      results
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
    
  } catch (err: any) {
    console.error('Function error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
