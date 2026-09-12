import { GoogleGenerativeAI } from '@google/generative-ai'

const DEFAULT_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
]

function getResponseCode(error) {
  return error?.status ?? error?.statusCode ?? error?.response?.status ?? 500
}

export async function generateItineraryWithGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return { text: null, model: null, attempts: [], reason: 'missing_api_key' }
  }

  const client = new GoogleGenerativeAI(apiKey)
  const configuredModel = process.env.GEMINI_MODEL || DEFAULT_MODELS[0]
  const models = [configuredModel, ...DEFAULT_MODELS].filter((model, index, values) => values.indexOf(model) === index)
  const attempts = []

  for (const modelName of models) {
    console.info(`[Gemini] Iniciando llamada. Modelo: ${modelName}`)
    try {
      const model = client.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: 'application/json' },
      })
      const result = await model.generateContent(prompt)
      const text = result.response.text().trim()
      const responseCode = 200
      attempts.push({ model: modelName, responseCode, ok: true })
      console.info(`[Gemini] Respuesta recibida. Modelo: ${modelName}. Código: ${responseCode}`)
      return { text, model: modelName, responseCode, attempts }
    } catch (error) {
      const responseCode = getResponseCode(error)
      attempts.push({ model: modelName, responseCode, ok: false })
      console.warn(`[Gemini] Fallo. Modelo: ${modelName}. Código: ${responseCode}`)
      if (modelName !== models.at(-1)) {
        console.info(`[Gemini] Intentando modelo alternativo: ${models[models.indexOf(modelName) + 1]}`)
      }
    }
  }

  console.error(`[Gemini] Todos los modelos fallaron. Último código: ${attempts.at(-1)?.responseCode ?? 500}`)
  return { text: null, model: null, responseCode: attempts.at(-1)?.responseCode ?? 500, attempts, reason: 'all_models_failed' }
}