import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
const GROQ_MODEL = Deno.env.get('GROQ_MODEL') || 'llama3-8b-8192'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { action, ...payload } = await req.json()
    console.log(`Action requested: ${action}`);

    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not set in Supabase secrets.")

    let messages = []
    let temperature = 0.1
    let isJsonAction = false

    if (action === 'diagnose') {
      isJsonAction = true
      messages = [
        { role: 'system', content: 'You are an expert vehicle mechanic. Return ONLY valid JSON.' },
        { role: 'user', content: `Analyze this vehicle issue for a ${payload.brand} ${payload.model}: "${payload.issueDescription}". Provide JSON: { problemSummary, conditionAssessment, recommendedService, estimatedCostMin, estimatedCostMax, urgencyLevel }` }
      ]
    } else if (action === 'cost-estimate') {
      isJsonAction = true
      messages = [
        { role: 'system', content: 'You are an automotive cost estimator. Return ONLY valid JSON.' },
        { role: 'user', content: `Generate a detailed cost estimate for ${payload.serviceType} on a ${payload.brand} ${payload.model}. Issue: ${payload.issueDescription}. Provide JSON: { parts: [{name, minCost, maxCost}], laborMin, laborMax, totalMin, totalMax, estimatedDuration, aiNote }` }
      ]
    } else if (action === 'chat') {
      temperature = 0.7
      messages = [
        { role: 'system', content: 'You are ServicePoint Neural Assistant. Keep responses helpful and concise. Mention costs in ₹.' },
        ...(payload.history || []).map((m: any) => ({
          role: m.role === 'assistant' || m.role === 'model' ? 'assistant' : 'user',
          content: m.content || m.parts?.[0]?.text || ''
        })).filter((m: any) => m.content),
        { role: 'user', content: payload.message }
      ]
    } else if (action === 'monthly-report') {
      messages = [
        { role: 'system', content: 'Analyse service records and return a concise report.' },
        { role: 'user', content: `records: ${JSON.stringify(payload.records)}` }
      ]
    } else if (action === 'vehicle-insight') {
      messages = [
        { role: 'system', content: 'Provide one-line strategic maintenance advice (under 20 words).' },
        { role: 'user', content: `vehicles: ${JSON.stringify(payload.vehicles)}, history: ${JSON.stringify(payload.serviceHistory)}` }
      ]
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages,
        model: GROQ_MODEL,
        temperature,
        response_format: isJsonAction ? { type: "json_object" } : undefined
      })
    })

    if (!groqRes.ok) {
      const errorText = await groqRes.text()
      console.error("Groq Error:", errorText)
      return new Response(JSON.stringify({ error: `Groq API Error: ${errorText}` }), {
        status: groqRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const data = await groqRes.json()
    const content = data.choices[0]?.message?.content

    const responseData = isJsonAction ? JSON.parse(content) : 
                        action === 'chat' ? { response: content } :
                        action === 'vehicle-insight' ? { insight: content } : { report: content }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error("Function Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
