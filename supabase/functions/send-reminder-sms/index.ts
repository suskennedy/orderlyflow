// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')!

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function unwrap<T>(rel: T | T[] | null | undefined): T | undefined {
  if (rel == null) return undefined
  return Array.isArray(rel) ? rel[0] : rel
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Fetching overdue reminders...')

    // home_tasks -> homes is a valid FK embed. homes -> user_profiles is NOT (homes.user_id -> auth.users).
    // Load profiles in a second query by homes.user_id (= user_profiles.id).
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
          user_id
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

    const userIds = [
      ...new Set(
        tasks
          .map((t) => unwrap(t.homes)?.user_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ]

    let profileByUserId = new Map<string, { id: string; phone: string | null; notification_sms: boolean | null }>()

    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, phone, notification_sms')
        .in('id', userIds)

      if (profilesError) {
        console.error('Error fetching user_profiles:', profilesError)
        throw profilesError
      }

      profileByUserId = new Map((profiles || []).map((p) => [p.id, p]))
    }

    const today = new Date().toISOString().split('T')[0]

    const tasksToSend = tasks.filter((task) => {
      if (task.last_reminder_sent) {
        const lastSentDate = new Date(task.last_reminder_sent).toISOString().split('T')[0]
        if (lastSentDate === today) return false
      }

      const home = unwrap(task.homes)
      if (!home?.user_id) return false

      const userProfile = profileByUserId.get(home.user_id)
      return Boolean(userProfile?.notification_sms && userProfile?.phone)
    })

    console.log(`Found ${tasksToSend.length} reminders to process.`)

    const results = []

    for (const task of tasksToSend) {
      const home = unwrap(task.homes)
      const userProfile = home?.user_id ? profileByUserId.get(home.user_id) : undefined
      if (!home || !userProfile?.phone) continue

      const phone = userProfile.phone
      const dueDateStr = new Date(task.due_date).toLocaleDateString()
      const messageBody = `OrderlyFlow Reminder: "${task.title}" for ${home.name} is due on ${dueDateStr}.`

      try {
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
            Authorization: authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        })

        const textRes = await twilioRes.text()

        if (!twilioRes.ok) {
          console.error(`Twilio Error sending to ${phone}:`, textRes)
          results.push({ taskId: task.id, status: 'error', error: textRes })
        } else {
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

    return new Response(
      JSON.stringify({
        processed: tasksToSend.length,
        results,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (err: any) {
    console.error('Function error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
