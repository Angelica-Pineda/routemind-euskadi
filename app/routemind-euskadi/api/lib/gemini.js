import { GoogleGenerativeAI } from '@google/generative-ai'

export async function generateItineraryWithGemini(promptPayload) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return null
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
  const client = new GoogleGenerativeAI(apiKey)
  const model = client.getGenerativeModel({ model: modelName })

  const prompt = [
    'Eres RouteMind Euskadi, un asistente que crea itinerarios turisticos personalizados.',
    'Debes responder solo con JSON valido, sin texto adicional ni bloques de codigo.',
    'La respuesta debe incluir: title, summary, days, packingTips, transportNotes, backupPlan, sources.',
    'Cada elemento de days debe ser un objeto con date, theme, morning, midday, afternoon, evening, notes.',
    'Usa estrictamente la informacion del siguiente contexto y respeta las preferencias del usuario.',
    JSON.stringify(promptPayload, null, 2),
  ].join('\n\n')

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()

  return text
}