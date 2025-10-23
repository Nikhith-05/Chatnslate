"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import type { User } from "@supabase/supabase-js"
import type { Profile, Message } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, Globe, Users } from "lucide-react"
import { MessageBubble } from "./message-bubble"
import { detectLanguage, translateText, SUPPORTED_LANGUAGES, type LanguageCode } from "@/lib/translation"
import { toast } from "@/hooks/use-toast"

interface ChatAreaProps {
  user: User
  profile: Profile
  conversationId: string | null
  contactInfo?: Profile | null
  onStartNewChat: () => void
}

interface MessageWithSender extends Message {
  sender: {
    id: string
    display_name: string
    avatar_url?: string
  }
}

export function ChatArea({ user, profile, conversationId, contactInfo, onStartNewChat }: ChatAreaProps) {
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [otherParticipant, setOtherParticipant] = useState<Profile | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (conversationId) {
      console.log("Conversation changed to:", conversationId)
      console.log("Contact info provided:", contactInfo)
      
      // Clean up any existing channel first
      if (channelRef.current) {
        console.log("Cleaning up existing channel")
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      
      // Reset or set other participant state
      if (contactInfo) {
        console.log("Using provided contact info:", contactInfo)
        setOtherParticipant(contactInfo)
      } else {
        console.log("No contact info provided, will fetch participant")
        setOtherParticipant(null)
      }
      
      fetchMessages()
      
      // Only fetch other participant if we don't have contact info
      if (!contactInfo) {
        fetchOtherParticipant()
      }
      
      setupRealtimeSubscription()
    }

    return () => {
      console.log("Component cleanup - removing channel")
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [conversationId, contactInfo])

  // Retry mechanism for fetching other participant (only if no contact info provided)
  useEffect(() => {
    if (conversationId && !otherParticipant && !contactInfo) {
      console.log("Setting up retry timer for fetchOtherParticipant...")
      const retryTimer = setTimeout(() => {
        console.log("Retrying fetchOtherParticipant after delay...")
        fetchOtherParticipant()
      }, 2000)
      
      return () => clearTimeout(retryTimer)
    }
  }, [conversationId, otherParticipant, contactInfo])

  // Additional retry for very new conversations (only if no contact info provided)
  useEffect(() => {
    if (conversationId && !contactInfo && otherParticipant?.id === "new-conversation") {
      console.log("Setting up additional retry for new conversation...")
      const retryTimer = setTimeout(() => {
        console.log("Additional retry for new conversation...")
        fetchOtherParticipant()
      }, 5000)
      
      return () => clearTimeout(retryTimer)
    }
  }, [conversationId, otherParticipant, contactInfo])

  useEffect(() => {
    console.log("ChatArea: Current user profile:", {
      userId: user.id,
      profileId: profile.id,
      displayName: profile.display_name,
      preferredLanguage: profile.preferred_language,
      fullProfile: profile
    })
  }, [user, profile])

  useEffect(() => {
    console.log("Other participant state changed:", otherParticipant)
  }, [otherParticipant])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const setupRealtimeSubscription = () => {
    if (!conversationId) return

    console.log("Setting up realtime subscription for conversation:", conversationId)

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          console.log("[Realtime] New message received:", payload)
          
          // Simple approach: just fetch the basic message and add profile manually
          const { data: newMessageData, error } = await supabase
            .from("messages")
            .select("*")
            .eq("id", payload.new.id)
            .single()

          if (error) {
            console.error("[Realtime] Error fetching new message:", error)
            return
          }

          if (newMessageData) {
            console.log("[Realtime] Processing new message:", newMessageData)
            
            // Get the sender's profile
            const { data: senderProfile } = await supabase
              .from("profiles")
              .select("id, display_name, avatar_url")
              .eq("id", newMessageData.sender_id)
              .single()

            // Auto-translate the message to the current user's preferred language if it's from someone else
            let translatedTexts = newMessageData.translated_texts || {}
            
            console.log(`[Realtime] Processing message for auto-translation:`, {
              senderId: newMessageData.sender_id,
              currentUserId: user?.id,
              isFromOtherUser: newMessageData.sender_id !== user?.id,
              userPrefLang: profile.preferred_language,
              userPrefLangType: typeof profile.preferred_language,
              originalLang: newMessageData.original_language,
              originalLangType: typeof newMessageData.original_language,
              existingTranslations: Object.keys(translatedTexts),
              messageText: newMessageData.original_text
            })
            
            // Always auto-translate messages from other users to current user's preferred language
            if (newMessageData.sender_id !== user?.id && profile.preferred_language) {
              const userPrefLang = profile.preferred_language as LanguageCode
              const originalLang = newMessageData.original_language as LanguageCode
              
              console.log(`[Realtime] Translation conditions:`, {
                originalLang,
                userPrefLang,
                differentLanguages: originalLang !== userPrefLang,
                alreadyTranslated: !!translatedTexts[userPrefLang],
                shouldTranslate: originalLang !== userPrefLang && !translatedTexts[userPrefLang]
              })
              
              // Auto-translate if we don't already have a translation for the user's preferred language
              if (!translatedTexts[userPrefLang]) {
                try {
                  console.log(`🔄 [Realtime] Auto-translating from ${originalLang} to ${userPrefLang}`)
                  const translation = await translateText(newMessageData.original_text, userPrefLang, originalLang)
                  console.log(`✅ [Realtime] Translation result:`, translation.length > 100 ? translation.substring(0, 100) + "..." : translation)
                  translatedTexts[userPrefLang] = translation
                  
                  // Save the translation to the database (non-blocking)
                  fetch(`/api/messages/${newMessageData.id}/translate`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      targetLanguage: userPrefLang,
                      translatedText: translation,
                    }),
                  }).then(() => {
                    console.log("✅ [Realtime] Auto-translation saved to database")
                  }).catch(err => {
                    console.error("Failed to save auto-translation:", err)
                  })
                } catch (translationError) {
                  console.error("❌ [Realtime] Auto-translation failed:", translationError)
                  // Add the message to UI anyway, user can manually translate later
                }
              } else {
                console.log(`⏭️ [Realtime] Already have translation for user's preferred language`)
              }
            }

            const messageWithSender = {
              ...newMessageData,
              translated_texts: translatedTexts,
              sender: {
                id: senderProfile?.id || newMessageData.sender_id,
                display_name: senderProfile?.display_name || "Unknown User",
                avatar_url: senderProfile?.avatar_url,
              },
            } as MessageWithSender

            console.log("[Realtime] Adding message to UI:", messageWithSender)

            setMessages((prev) => {
              const exists = prev.some((msg) => msg.id === messageWithSender.id)
              if (exists) {
                console.log("[Realtime] Message already exists, skipping")
                return prev
              }
              console.log("[Realtime] Adding new message to state")
              return [...prev, messageWithSender]
            })
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log("[Realtime] Message deleted:", payload)
          const deletedMessageId = payload.old?.id
          
          if (deletedMessageId) {
            setMessages((prev) => {
              const filtered = prev.filter((msg) => msg.id !== deletedMessageId)
              console.log(`[Realtime] Removed message ${deletedMessageId} from UI. Messages before: ${prev.length}, after: ${filtered.length}`)
              return filtered
            })
          } else {
            console.error("[Realtime] DELETE payload missing message ID:", payload)
          }
        }
      )
      .subscribe((status) => {
        console.log("[Realtime] Subscription status:", status)
        if (status === "SUBSCRIBED") {
          console.log("[Realtime] Successfully subscribed to conversation:", conversationId)
        } else if (status === "CHANNEL_ERROR") {
          console.error("[Realtime] Channel error for conversation:", conversationId)
        } else if (status === "TIMED_OUT") {
          console.error("[Realtime] Subscription timed out for conversation:", conversationId)
        }
      })

    // Store the channel in the ref to prevent infinite recursion
    channelRef.current = channel
    console.log("[Realtime] Channel stored in ref")
  }

  const fetchMessages = async () => {
    if (!conversationId) return

    try {
      console.log("=== Fetching messages for conversation ===")
      console.log("Conversation ID:", conversationId)
      console.log("Current user profile:", {
        id: profile.id,
        displayName: profile.display_name,
        preferredLanguage: profile.preferred_language
      })
      
      // Get all messages for this conversation
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      if (messagesError) {
        console.error("Error fetching messages:", messagesError)
        return
      }

      if (messagesData && messagesData.length > 0) {
        console.log("Fetched messages:", messagesData)
        
        // Get unique sender IDs
        const senderIds = [...new Set(messagesData.map(msg => msg.sender_id))]
        
        // Fetch all sender profiles
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", senderIds)

        console.log("Fetched profiles:", profiles)

        // Create a profile lookup map
        const profileMap = new Map()
        profiles?.forEach(profile => {
          profileMap.set(profile.id, profile)
        })

        // Combine messages with sender info and auto-translate messages from others
        const messagesWithSender = await Promise.all(messagesData.map(async (msg) => {
          const senderProfile = profileMap.get(msg.sender_id)
          let translatedTexts = msg.translated_texts || {}
          
          console.log(`Processing message ${msg.id}:`, {
            senderId: msg.sender_id,
            currentUserId: user?.id,
            isFromOtherUser: msg.sender_id !== user?.id,
            userPrefLang: profile.preferred_language,
            originalLang: msg.original_language,
            existingTranslations: Object.keys(translatedTexts),
            messageText: msg.original_text,
            profileObject: profile
          })
          
          // Auto-translate messages from other users to current user's preferred language
          if (msg.sender_id !== user?.id && profile.preferred_language) {
            const userPrefLang = profile.preferred_language as LanguageCode
            const originalLang = msg.original_language as LanguageCode
            
            console.log(`Checking translation conditions for message ${msg.id}:`, {
              originalLang,
              userPrefLang,
              differentLanguages: originalLang !== userPrefLang,
              alreadyTranslated: !!translatedTexts[userPrefLang],
              shouldTranslate: !translatedTexts[userPrefLang],
              messageText: msg.original_text.substring(0, 50) + "..."
            })
            
            // Auto-translate if we don't already have a translation for the user's preferred language
            if (!translatedTexts[userPrefLang]) {
              try {
                console.log(`🔄 Auto-translating message ${msg.id} from ${originalLang} to ${userPrefLang}`)
                const translation = await translateText(msg.original_text, userPrefLang, originalLang)
                console.log(`✅ Translation result for ${msg.id}:`, translation.length > 100 ? translation.substring(0, 100) + "..." : translation)
                translatedTexts[userPrefLang] = translation
                
                // Save the translation to the database (fire and forget)
                fetch(`/api/messages/${msg.id}/translate`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    targetLanguage: userPrefLang,
                    translatedText: translation,
                  }),
                }).catch(err => console.error("Failed to save auto-translation:", err))
                
              } catch (translationError) {
                console.error(`❌ Auto-translation failed for message ${msg.id}:`, translationError)
                // Continue without translation
              }
            } else {
              console.log(`⏭️ Already have translation for message ${msg.id} in user's preferred language`)
            }
          } else {
            console.log(`Skipping message ${msg.id} - from current user or no preferred language`)
          }
          
          return {
            ...msg,
            translated_texts: translatedTexts,
            sender: {
              id: senderProfile?.id || msg.sender_id,
              display_name: senderProfile?.display_name || "Unknown User",
              avatar_url: senderProfile?.avatar_url,
            },
          } as MessageWithSender
        }))

        console.log("Messages with sender info:", messagesWithSender)
        setMessages(messagesWithSender)
      } else {
        console.log("No messages found for conversation")
        setMessages([])
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const fetchOtherParticipant = async () => {
    if (!conversationId) return

    try {
      console.log("=== Fetching other participant ===")
      console.log("Conversation ID:", conversationId)
      console.log("Current user ID:", user.id)
      
      // Method 1: Use API endpoint to get participants (bypasses RLS issues)
      console.log("=== Method 1: Using API endpoint for participants ===")
      try {
        const response = await fetch(`/api/conversations/${conversationId}/participants`)
        console.log("API response status:", response.status, response.statusText)
        
        if (response.ok) {
          const data = await response.json()
          console.log("API response data:", data)
          
          if (data.participant) {
            console.log("✅ Setting other participant from API:", data.participant)
            setOtherParticipant(data.participant as Profile)
            return
          } else {
            console.log("❌ No other participant found via API")
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
          console.log("❌ API request failed:", response.status, response.statusText, errorData)
        }
      } catch (apiError) {
        console.error("❌ API request error:", apiError)
      }

      // Method 2: Look for messages from other users in this conversation (most reliable fallback)
      console.log("=== Method 2: Looking for other users via messages ===")
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("sender_id")
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id)
        .limit(1)

      console.log("Messages query result:", { messagesData, messagesError })

      if (messagesData && messagesData.length > 0) {
        const otherUserId = messagesData[0].sender_id
        console.log("Found other user from messages:", otherUserId)

        // Get profile for this user
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url, preferred_language")
          .eq("id", otherUserId)
          .single()

        console.log("Profile query result:", { profileData, profileError })

        if (profileData) {
          console.log("✅ Setting other participant from messages:", profileData)
          setOtherParticipant(profileData as Profile)
          return
        } else {
          console.log("❌ Profile not found for user:", otherUserId)
        }
      }

      // Method 3: Check conversation creator if different from current user
      console.log("=== Method 3: Check conversation creator ===")
      const { data: conversationData, error: conversationError } = await supabase
        .from("conversations")
        .select("created_by")
        .eq("id", conversationId)
        .single()

      console.log("Conversation data:", { conversationData, conversationError })

      if (conversationData && conversationData.created_by !== user.id) {
        // Get profile of conversation creator
        const { data: creatorProfile, error: creatorError } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url, preferred_language")
          .eq("id", conversationData.created_by)
          .single()

        console.log("Creator profile:", { creatorProfile, creatorError })

        if (creatorProfile) {
          console.log("✅ Setting other participant from conversation creator:", creatorProfile)
          setOtherParticipant(creatorProfile as Profile)
          return
        }
      }

      console.log("❌ Could not find other participant using any method")
      
      // For new conversations with no messages yet, show a placeholder
      setOtherParticipant({
        id: "new-conversation",
        display_name: "New Conversation",
        preferred_language: "en",
        avatar_url: "",
        created_at: "",
        updated_at: ""
      } as Profile)
      
    } catch (error) {
      console.error("Error fetching other participant:", error)
      
      // Set a placeholder to stop the loading state
      setOtherParticipant({
        id: "error",
        display_name: "Error Loading Contact", 
        preferred_language: "en",
        avatar_url: "",
        created_at: "",
        updated_at: ""
      } as Profile)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !conversationId) return

    setIsLoading(true)
    try {
      console.log("Starting message send process...")
      console.log("User ID:", user.id)
      console.log("Conversation ID:", conversationId)
      
      // Check if user is authenticated
      const { data: { user: authUser } } = await supabase.auth.getUser()
      console.log("Auth user:", authUser?.id)
      
      // Check if conversation exists and user is a participant
      const { data: participants } = await supabase
        .from("conversation_participants")
        .select("*")
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id)
      console.log("User participation:", participants)
      
      let detectedLanguage: string
      try {
        detectedLanguage = await detectLanguage(newMessage.trim())
        console.log("Language detected:", detectedLanguage)
      } catch (langError) {
        console.warn("Language detection failed, using default:", langError)
        detectedLanguage = "en" // fallback to English
      }

      console.log("Inserting message to database...")
      console.log("Insert payload:", {
        conversation_id: conversationId,
        sender_id: user.id,
        original_text: newMessage.trim(),
        original_language: detectedLanguage,
      })
      
      // First try a simple insert without .select() to isolate the issue
      const { data: insertResult, error: insertError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          original_text: newMessage.trim(),
          original_language: detectedLanguage,
        })

      console.log("Simple insert result:", insertResult)
      console.log("Simple insert error:", insertError)

      if (insertError) {
        console.error("Simple insert failed:", {
          error: insertError,
          message: insertError?.message,
          details: insertError?.details,
          hint: insertError?.hint,
          code: insertError?.code,
          stringified: JSON.stringify(insertError, null, 2)
        })
        throw insertError
      }

      // If simple insert worked, now get the message with profile
      console.log("Simple insert succeeded, fetching message with profile...")
      
      // First, let's just get the basic message without joins
      const { data: basicMessage, error: basicError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      console.log("Basic message fetch:", { basicMessage, basicError })

      let inserted = null
      if (basicMessage) {
        // Now try to get the profile separately
        const { data: userProfile, error: profileError } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .eq("id", user.id)
          .single()

        console.log("Profile fetch:", { userProfile, profileError })

        // Combine them manually
        inserted = {
          ...basicMessage,
          profiles: userProfile || {
            id: user.id,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
          }
        }
      }

      const error = basicError // Use the basic message error as the main error

      console.log("Final message object:", inserted)

      // Immediately show the message without waiting for realtime
      let row = inserted
      if (!row && basicMessage) {
        // Final fallback: create a basic message object from basic message
        console.log("Using final fallback message object")
        row = {
          ...basicMessage,
          profiles: {
            id: user.id,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
          }
        } as any
      }

      if (row) {
        console.log("Adding message to UI:", row)
        const messageWithSender = {
          ...row,
          sender: {
            id: (row as any).profiles?.id ?? user.id,
            display_name: (row as any).profiles?.display_name ?? profile.display_name,
            avatar_url: (row as any).profiles?.avatar_url ?? profile.avatar_url,
          },
        } as MessageWithSender
        setMessages((prev) => [...prev, messageWithSender])
      } else {
        console.warn("No message data available to display")
        // Even if we can't display it optimistically, the message was inserted
        // and should appear via realtime subscription
        toast({
          title: "Message sent",
          description: "Your message was sent successfully.",
        })
      }

      setNewMessage("")
      console.log("Message send completed successfully")
    } catch (error: any) {
      console.error("Error sending message:", error)
      toast({
        title: "Failed to send",
        description: error?.message || error?.details || "We couldn't send your message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const handleMessageDelete = (messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
  }

  if (!conversationId) {
    return (
      <div className="flex-1 flex flex-col h-full max-h-screen">
        <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-gray-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Select a conversation to start chatting</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="bg-blue-100 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <MessageCircle className="h-12 w-12 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to ChatNSlate</h2>
            <p className="text-gray-600 mb-6 max-w-md">
              Start a conversation with someone and experience real-time translation across 20 languages.
            </p>
            <Button onClick={onStartNewChat} className="bg-blue-600 hover:bg-blue-700">
              <Users className="h-4 w-4 mr-2" />
              Start New Chat
            </Button>
          </div>
        </div>
      </div>
    )
  }

  console.log("Rendering ChatArea with:", { conversationId, otherParticipant, userId: user.id })

  return (
    <div className="flex-1 flex flex-col h-full max-h-screen">
      {otherParticipant ? (
        <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={otherParticipant.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                  {otherParticipant.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900 text-lg">{otherParticipant.display_name}</h2>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <Globe className="h-3 w-3 text-blue-600" />
                    <span className="text-sm text-gray-600">
                      Speaks {SUPPORTED_LANGUAGES[otherParticipant.preferred_language as LanguageCode] || otherParticipant.preferred_language}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 font-medium">Online</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <Badge variant="secondary" className="text-xs mb-1">
                <Globe className="h-3 w-3 mr-1" />
                Auto-translate
              </Badge>
              <span className="text-xs text-gray-500">Real-time translation enabled</span>
            </div>
          </div>
        </div>
      ) : conversationId ? (
        <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center animate-pulse">
              <MessageCircle className="h-6 w-6 text-gray-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-lg">Loading contact...</h2>
              <p className="text-sm text-gray-600">Please wait</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((message) => {
          const isOwnMessage = message.sender_id === user.id
          return (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={isOwnMessage}
              senderName={message.sender.display_name}
              userLanguage={profile.preferred_language as LanguageCode}
              onDelete={handleMessageDelete}
            />
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0 sticky bottom-0">
        <form onSubmit={sendMessage} className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !newMessage.trim()} className="bg-blue-600 hover:bg-blue-700">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
