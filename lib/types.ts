export interface Profile {
  id: string
  display_name: string
  preferred_language: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  original_text: string
  original_language: string
  translated_texts: Record<string, string>
  created_at: string
}

export interface Contact {
  id: string
  user_id: string
  contact_user_id: string
  created_at: string
}

export interface ConversationParticipant {
  id: string
  conversation_id: string
  user_id: string
  joined_at: string
}

// Supported languages for translation
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
  zh: "Chinese",
  ar: "Arabic",
  hi: "Hindi",
  bn: "Bengali",
  te: "Telugu",
  ta: "Tamil",
  mr: "Marathi",
  gu: "Gujarati",
  kn: "Kannada",
  ml: "Malayalam",
  pa: "Punjabi",
} as const

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES
