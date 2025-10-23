export const SUPPORTED_LANGUAGES = {
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

export async function translateText(
  text: string,
  targetLanguage: LanguageCode,
  sourceLanguage?: LanguageCode,
): Promise<string> {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        targetLanguage,
        sourceLanguage,
        action: 'translate'
      }),
    })

    // Even if response is not OK, try to read body and fallback to original text
    let data: any = null
    try {
      data = await response.json()
    } catch {
      // ignore JSON parse errors
    }
    if (!response.ok) {
      console.warn('Translation request non-OK, falling back to original text', data)
      return text
    }
    return (data?.translatedText as string) || text
  } catch (error) {
    console.error("Translation error:", error)
    return text // Return original text if translation fails
  }
}

export async function detectLanguage(text: string): Promise<LanguageCode> {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        action: 'detect'
      }),
    })

    let data: any = null
    try {
      data = await response.json()
    } catch {
      // ignore JSON parse errors
    }
    if (!response.ok) {
      console.warn('Language detection non-OK, defaulting to en', data)
      return "en"
    }
    return (data?.language as LanguageCode) || "en"
  } catch (error) {
    console.error("Language detection error:", error)
    return "en" // Default to English if detection fails
  }
}
