import { google } from "@ai-sdk/google"
import { generateText } from "ai"
import { NextRequest, NextResponse } from "next/server"

const SUPPORTED_LANGUAGES = {
  en: "English",
  es: "Spanish", 
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese (Simplified)",
  ar: "Arabic",
  hi: "Hindi",
  bn: "Bengali",
  te: "Telugu",
  mr: "Marathi",
  ta: "Tamil",
  gu: "Gujarati",
  kn: "Kannada",
  ml: "Malayalam",
  pa: "Punjabi",
} as const

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES

// Use only Gemini Flash model for translation
async function callGeminiFlash(prompt: string): Promise<string> {
  try {
    console.log('Using Gemini 2.5 Flash model for translation')
    
    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt,
    })
    
    console.log('Translation successful with Gemini 2.5 Flash')
    return text
  } catch (error: any) {
    console.error('Gemini Flash translation failed:', error.message)
    throw new Error(`Translation failed: ${error.message}`)
  }
}

export async function POST(request: NextRequest) {
  let requestBody: any = {}
  
  try {
    // Parse request body once at the beginning
    requestBody = await request.json()
    const { text, targetLanguage, sourceLanguage, action } = requestBody

    // Graceful fallback if Google API key is not configured
    const hasGoogleKey = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!hasGoogleKey) {
      if (action === "detect") {
        // Default to English when detection isn’t available
        return NextResponse.json({ language: "en" })
      }
      if (action === "translate") {
        // Pass-through translation when model isn’t available
        return NextResponse.json({ translatedText: (text ?? "").toString() })
      }
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    if (action === "detect") {
      // Language detection with API
      const languageList = Object.entries(SUPPORTED_LANGUAGES)
        .map(([code, name]) => `${code}: ${name}`)
        .join(", ")

      const detectedLang = await callGeminiFlash(
        `Detect the language of the following text and return only the language code from this list: ${languageList}. Only return the 2-letter code, nothing else:\n\n${text}`
      )

      const langCode = detectedLang.trim().toLowerCase() as LanguageCode
      const detectedLanguage = SUPPORTED_LANGUAGES[langCode] ? langCode : "en"
      
      return NextResponse.json({ language: detectedLanguage })
    }

    if (action === "translate") {
      // Translation with API
      const prompt = sourceLanguage
        ? `Translate the following text from ${SUPPORTED_LANGUAGES[sourceLanguage as LanguageCode]} to ${SUPPORTED_LANGUAGES[targetLanguage as LanguageCode]}. Only return the translated text, no explanations or additional content:\n\n${text}`
        : `Translate the following text to ${SUPPORTED_LANGUAGES[targetLanguage as LanguageCode]}. Only return the translated text, no explanations or additional content:\n\n${text}`

      const translatedText = await callGeminiFlash(prompt)

      return NextResponse.json({ translatedText: translatedText.trim() })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Translation API error:", error)
    
    // Check if all models failed
    if (error && typeof error === 'object' && 'message' in error && error.message === "All Gemini models failed") {
      console.log("All Gemini models failed, providing fallback response")
      
      if (requestBody.action === "detect") {
        // Default to English when all models fail
        return NextResponse.json({ language: "en" })
      }
      if (requestBody.action === "translate") {
        // Pass-through translation when all models fail
        return NextResponse.json({ translatedText: (requestBody.text ?? "").toString() })
      }
    }
    
    // Check if it's a quota/rate limit error
    if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 429) {
      console.log("API quota exceeded, providing fallback response")
      
      if (requestBody.action === "detect") {
        // Default to English when detection isn't available due to quota
        return NextResponse.json({ language: "en" })
      }
      if (requestBody.action === "translate") {
        // Pass-through translation when quota is exceeded
        return NextResponse.json({ translatedText: (requestBody.text ?? "").toString() })
      }
    }
    
    // Return a non-fatal response so the client can gracefully fallback
    return NextResponse.json({ translatedText: undefined, language: undefined, error: "Translation failed" }, { status: 200 })
  }
}
