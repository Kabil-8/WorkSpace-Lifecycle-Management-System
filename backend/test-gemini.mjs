// Test the best available models with actual prompts
const GEMINI_KEY = 'AQ.Ab8RN6LaZUiwL3FVX58pEaPOIEwqxRTajRIrMY03Zg8ZHXrcqg'

const BEST_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
]

const PROMPTS = [
  { label: 'Hello', text: 'Say hello briefly as EDEN AI.' },
  { label: 'Binary Search', text: 'Explain Binary Search in 2 sentences.' },
  { label: 'Java Code', text: 'Write a 5-line Java bubble sort.' },
]

console.log('🚀 Testing best Gemini models with real prompts\n' + '═'.repeat(55))

for (const model of BEST_MODELS) {
  process.stdout.write(`\n[${model}]\n`)
  for (const { label, text } of PROMPTS) {
    process.stdout.write(`  "${label}"... `)
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text }] }],
            generationConfig: { maxOutputTokens: 60, temperature: 0.7 }
          })
        }
      )
      const d = await r.json()
      if (r.ok) {
        const t = d?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        console.log(`✅ "${t?.slice(0,80)}${t?.length > 80 ? '...' : ''}"`)
      } else {
        console.log(`❌ ${r.status}: ${d?.error?.message?.slice(0,60)}`)
      }
    } catch(e) {
      console.log(`❌ ERR: ${e.message}`)
    }
  }
}
