"use client"
import { useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MessageCircle, Plus, Search, Settings, LogOut, Users, MoreVertical, Trash2, MessageSquare, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

interface ChatSidebarProps {
  user: User
  profile: Profile
  selectedConversationId: string | null
  onSelectConversation: (id: string) => void
  onShowContacts: () => void
}

interface ConversationWithDetails {
  id: string
  created_at: string
  updated_at: string
  other_participant: {
    id: string
    display_name: string
    avatar_url?: string
  }
  last_message?: {
    original_text: string
    created_at: string
    sender_id: string
  }
}

export function ChatSidebar({
  user,
  profile,
  selectedConversationId,
  onSelectConversation,
  onShowContacts,
}: ChatSidebarProps) {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchConversations()
    setupConversationSubscription()

    return () => {
      supabase.removeAllChannels()
    }
  }, [])

  const setupConversationSubscription = () => {
    const channel = supabase
      .channel("conversation-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          console.log("[v0] New message in any conversation:", payload)
          // Refresh conversations to update last message
          fetchConversations()
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversation_participants",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("[v0] New conversation participation:", payload)
          // Refresh conversations when user joins new conversation
          fetchConversations()
        },
      )
      .subscribe((status) => {
        console.log("[v0] Conversation subscription status:", status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const fetchConversations = async () => {
    try {
      // Get conversations where user is a participant
      const { data: participantData, error: participantError } = await supabase
        .from("conversation_participants")
        .select(
          `
          conversation_id,
          conversations!inner (
            id,
            created_at,
            updated_at
          )
        `,
        )
        .eq("user_id", user.id)

      if (participantError) {
        console.error("Error fetching participant data:", participantError)
        return
      }

      if (!participantData || participantData.length === 0) {
        setConversations([])
        return
      }

      // For each conversation, get the other participant and last message
      const conversationsWithDetails = await Promise.all(
        participantData.map(async (item) => {
          try {
            const conversationId = item.conversation_id

            // Normalize conversation meta (can be array or object depending on join)
            const convMeta: any = (item as any).conversations
            const convObj = Array.isArray(convMeta) ? convMeta[0] : convMeta

          // Get other participant - first get the user_id, then get the profile
          const { data: otherParticipantData, error: participantError } = await supabase
            .from("conversation_participants")
            .select("user_id")
            .eq("conversation_id", conversationId)
            .neq("user_id", user.id)
            .limit(1)
            .single()

          if (participantError) {
            console.error("Error getting other participant:", participantError)
            // Continue with unknown participant instead of failing
            return {
              id: conversationId,
              created_at: convObj?.created_at || new Date(0).toISOString(),
              updated_at: convObj?.updated_at || convObj?.created_at || new Date(0).toISOString(),
              other_participant: {
                id: "unknown",
                display_name: "Unknown User",
                avatar_url: undefined,
              },
              last_message: undefined,
            }
          }

          if (!otherParticipantData) {
            console.warn("No other participant found for conversation:", conversationId)
            return {
              id: conversationId,
              created_at: convObj?.created_at || new Date(0).toISOString(),
              updated_at: convObj?.updated_at || convObj?.created_at || new Date(0).toISOString(),
              other_participant: {
                id: "unknown",
                display_name: "Unknown User",
                avatar_url: undefined,
              },
              last_message: undefined,
            }
          }

          // Now get the profile for the other participant
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("id, display_name, avatar_url")
            .eq("id", otherParticipantData.user_id)
            .single()

          if (profileError) {
            console.error(`Error fetching profile for user ${otherParticipantData.user_id}:`, profileError)
          }

          // Get last message
          const { data: lastMessage } = await supabase
            .from("messages")
            .select("original_text, created_at, sender_id")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

          // Handle profile data
          const otherParticipant = profileData && !profileError 
            ? {
                id: profileData.id,
                display_name: profileData.display_name || "Unknown User",
                avatar_url: profileData.avatar_url,
              }
            : {
                id: otherParticipantData.user_id,
                display_name: "Unknown User",
                avatar_url: undefined,
              }

          if (profileError) {
            console.error(`Error fetching profile for user ${otherParticipantData.user_id}:`, profileError)
          }

          return {
            id: conversationId,
            created_at: convObj?.created_at || lastMessage?.created_at || new Date(0).toISOString(),
            updated_at: convObj?.updated_at || convObj?.created_at || lastMessage?.created_at || new Date(0).toISOString(),
            other_participant: otherParticipant,
            last_message: lastMessage || undefined,
          }
        } catch (itemError) {
          console.error(`Error processing conversation ${item.conversation_id}:`, itemError)
          // Return a safe fallback conversation object
          return {
            id: item.conversation_id,
            created_at: new Date(0).toISOString(),
            updated_at: new Date(0).toISOString(),
            other_participant: {
              id: "unknown",
              display_name: "Unknown User",
              avatar_url: undefined,
            },
            last_message: undefined,
          }
        }
        }),
      )

      const sortedConversations = conversationsWithDetails
        .filter(conv => conv !== null) // Filter out any null conversations
        .sort((a, b) => {
          const aTime = a.last_message?.created_at || a.created_at
          const bTime = b.last_message?.created_at || b.created_at
          return new Date(bTime).getTime() - new Date(aTime).getTime()
        })

      setConversations(sortedConversations)
    } catch (error) {
      console.error("Error fetching conversations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const handleSettings = () => {
    router.push("/settings")
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.other_participant.display_name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const deleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent the conversation from being selected
    setDeleteConfirmId(conversationId)
  }

  const confirmDeleteConversation = async () => {
    if (!deleteConfirmId) return
    
    try {
      console.log("Deleting conversation:", deleteConfirmId)
      
      // First, delete all messages in the conversation
      const { error: messagesError } = await supabase
        .from("messages")
        .delete()
        .eq("conversation_id", deleteConfirmId)
      
      if (messagesError) {
        console.error("Error deleting messages:", messagesError)
        throw messagesError
      }
      
      // Then delete conversation participants
      const { error: participantsError } = await supabase
        .from("conversation_participants")
        .delete()
        .eq("conversation_id", deleteConfirmId)
      
      if (participantsError) {
        console.error("Error deleting participants:", participantsError)
        throw participantsError
      }
      
      // Finally delete the conversation itself
      const { error: conversationError } = await supabase
        .from("conversations")
        .delete()
        .eq("id", deleteConfirmId)
      
      if (conversationError) {
        console.error("Error deleting conversation:", conversationError)
        throw conversationError
      }
      
      console.log("Conversation deleted successfully")
      
      // Show success toast
      toast({
        title: "Chat deleted",
        description: "The conversation and all messages have been deleted.",
      })
      
      // Refresh the conversations list
      fetchConversations()
      
      // If the deleted conversation was selected, clear the selection
      if (selectedConversationId === deleteConfirmId) {
        onSelectConversation("")
      }
      
      setDeleteConfirmId(null)
      
    } catch (error) {
      console.error("Error deleting conversation:", error)
      
      // Show error toast
      toast({
        title: "Failed to delete",
        description: "Could not delete the conversation. Please try again.",
        variant: "destructive",
      })
      
      setDeleteConfirmId(null)
    }
  }

  const handleOpenChat = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent event bubbling
    onSelectConversation(conversationId)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: "short" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-xl">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Chatnslate</h1>
              <p className="text-sm text-gray-500">Welcome, {profile.display_name}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                    {profile.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleSettings}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button onClick={onShowContacts} className="flex-1 bg-blue-600 hover:bg-blue-700 h-9">
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
          <Button variant="outline" size="sm" onClick={onShowContacts} className="h-9 px-3 bg-transparent">
            <Users className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setIsLoading(true)
              fetchConversations()
            }} 
            className="h-9 px-3 bg-transparent"
            title="Refresh conversations"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading conversations...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs text-gray-400 mt-1">Start a new chat to begin</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`relative group hover:bg-gray-50 transition-colors ${
                  selectedConversationId === conversation.id ? "bg-blue-50 border-r-2 border-blue-600" : ""
                }`}
              >
                <button
                  onClick={() => onSelectConversation(conversation.id)}
                  className="w-full p-4 text-left flex items-center space-x-3"
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conversation.other_participant.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-gray-100 text-gray-600">
                        {conversation.other_participant.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0 pr-8">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">
                        {conversation.other_participant.display_name}
                        {conversation.other_participant.display_name === "Unknown User" && (
                          <span className="text-xs text-amber-600 ml-1" title="Profile not found - try refreshing">⚠️</span>
                        )}
                      </h3>
                      {conversation.last_message && (
                        <span className="text-xs text-gray-500">
                          {formatTime(conversation.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    {conversation.last_message && (
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {conversation.last_message.sender_id === user.id ? "You: " : ""}
                        {conversation.last_message.original_text}
                      </p>
                    )}
                  </div>
                </button>
                
                {/* Three-dot menu */}
                <div className="absolute top-4 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-gray-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={(e) => handleOpenChat(conversation.id, e)}
                        className="cursor-pointer"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Open Chat
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => deleteConversation(conversation.id, e)}
                        className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the conversation and all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteConversation} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

