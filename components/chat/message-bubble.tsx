"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { translateText, SUPPORTED_LANGUAGES, type LanguageCode } from "@/lib/translation"
import { Languages, Loader2, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"

interface MessageBubbleProps {
  message: {
    id: string
  original_text: string
    sender_id: string
    created_at: string
    translated_texts?: Record<string, string>
  }
  isOwn: boolean
  senderName: string
  userLanguage: LanguageCode
  onDelete?: (messageId: string) => void
}

export function MessageBubble({ message, isOwn, senderName, userLanguage, onDelete }: MessageBubbleProps) {
  // Determine if there's a translation available for the user's language
  const hasTranslation = message.translated_texts?.[userLanguage] && 
                        message.translated_texts[userLanguage] !== message.original_text
  
  // For received messages, show translation by default if available and different from original
  // For own messages, show original by default
  const [showOriginal, setShowOriginal] = useState(isOwn || !hasTranslation)
  
  const [translatedText, setTranslatedText] = useState<string | null>(
    message.translated_texts?.[userLanguage] || null
  )
  const [isTranslating, setIsTranslating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Update translation state when message.translated_texts changes
  useEffect(() => {
    const newTranslation = message.translated_texts?.[userLanguage]
    if (newTranslation && newTranslation !== message.original_text) {
      console.log(`MessageBubble: New translation detected for ${message.id}:`, newTranslation)
      setTranslatedText(newTranslation)
      // For received messages, automatically show translation
      if (!isOwn) {
        setShowOriginal(false)
      }
    }
  }, [message.translated_texts, userLanguage, message.id, message.original_text, isOwn])

  const handleTranslate = async (targetLang: LanguageCode) => {
    if (message.translated_texts?.[targetLang]) {
      setTranslatedText(message.translated_texts[targetLang])
      setShowOriginal(false)
      return
    }

    setIsTranslating(true)
    try {
      const translated = await translateText(message.original_text, targetLang)
      setTranslatedText(translated)
      setShowOriginal(false)

      await fetch(`/api/messages/${message.id}/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetLanguage: targetLang,
          translatedText: translated,
        }),
      })
    } catch (error) {
      console.error("Translation failed:", error)
    } finally {
      setIsTranslating(false)
    }
  }

  const handleDelete = async () => {
    if (!isOwn || !onDelete) return

    const confirmDelete = window.confirm("Are you sure you want to delete this message?")
    if (!confirmDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/messages/${message.id}/delete`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete message")
      }

      // Call the onDelete callback to remove the message from UI
      onDelete(message.id)
      
      toast({
        title: "Message deleted",
        description: "Your message has been deleted successfully.",
      })
    } catch (error: any) {
      console.error("Delete failed:", error)
      toast({
        title: "Failed to delete",
        description: error.message || "We couldn't delete your message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const displayText = showOriginal ? message.original_text : translatedText || message.original_text
  const isTranslated = !showOriginal && translatedText && translatedText !== message.original_text
  
  // Always show the original/translation toggle button if there's a translation available
  const showToggleButton = translatedText && translatedText !== message.original_text

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isOwn ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        {!isOwn && <p className="text-xs font-medium mb-1 opacity-70">{senderName}</p>}

        <p className="text-sm">{displayText}</p>

        {isTranslated && <p className="text-xs mt-1 opacity-70">Translated to {SUPPORTED_LANGUAGES[userLanguage]}</p>}

        <div className="flex items-center justify-between mt-2">
          <p className="text-xs opacity-70">
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>

          <div className="flex items-center gap-1">
            {showToggleButton && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs opacity-70 hover:opacity-100"
                onClick={() => setShowOriginal(!showOriginal)}
              >
                {showOriginal ? "Show Translation" : "Show Original"}
              </Button>
            )}

            {isOwn && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-70 hover:opacity-100 hover:text-red-600"
                disabled={isDeleting}
                onClick={handleDelete}
                title="Delete message"
              >
                {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                  disabled={isTranslating}
                >
                  {isTranslating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                  <DropdownMenuItem
                    key={code}
                    onClick={() => handleTranslate(code as LanguageCode)}
                    className="text-sm"
                  >
                    {name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}
