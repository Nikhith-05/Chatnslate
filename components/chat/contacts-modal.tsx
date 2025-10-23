"use client"
import { useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, UserPlus, Users, MessageCircle } from "lucide-react"
import { SUPPORTED_LANGUAGES } from "@/lib/types"

interface ContactsModalProps {
  user: User
  profile: Profile
  onClose: () => void
  onSelectContact: (conversationId: string, contactInfo?: Profile) => void
}

interface ContactWithProfile extends Profile {
  isContact: boolean
}

export function ContactsModal({ user, profile, onClose, onSelectContact }: ContactsModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [contacts, setContacts] = useState<ContactWithProfile[]>([])
  const [searchResults, setSearchResults] = useState<ContactWithProfile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("contacts")
  const supabase = createClient()

  useEffect(() => {
    fetchContacts()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() && activeTab === "search") {
      searchUsers()
    } else {
      setSearchResults([])
    }
  }, [searchQuery, activeTab])

  const fetchContacts = async () => {
    try {
      const { data } = await supabase
        .from("contacts")
        .select(
          `
          contact_user_id,
          profiles!contacts_contact_user_id_fkey (
            id,
            display_name,
            avatar_url,
            preferred_language,
            created_at,
            updated_at
          )
        `,
        )
        .eq("user_id", user.id)

      if (data) {
        const contactsWithProfile: ContactWithProfile[] = data
          .filter((contact) => contact.profiles) // Filter out null profiles
          .map((contact) => {
            const profile = Array.isArray(contact.profiles) ? contact.profiles[0] : contact.profiles
            return {
              id: profile.id,
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
              preferred_language: profile.preferred_language,
              created_at: profile.created_at,
              updated_at: profile.updated_at,
              isContact: true,
            }
          })
        setContacts(contactsWithProfile)
      }
    } catch (error) {
      console.error("Error fetching contacts:", error)
    }
  }

  const searchUsers = async () => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .ilike("display_name", `%${searchQuery}%`)
        .neq("id", user.id)
        .limit(20)

      if (data) {
        // Check which users are already contacts
        const { data: existingContacts } = await supabase
          .from("contacts")
          .select("contact_user_id")
          .eq("user_id", user.id)

        const contactIds = new Set(existingContacts?.map((c) => c.contact_user_id) || [])

        const usersWithContactStatus = data.map((userProfile) => ({
          ...userProfile,
          isContact: contactIds.has(userProfile.id),
        })) as ContactWithProfile[]

        setSearchResults(usersWithContactStatus)
      }
    } catch (error) {
      console.error("Error searching users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addContact = async (contactId: string) => {
    try {
      const { error } = await supabase.from("contacts").insert({
        user_id: user.id,
        contact_user_id: contactId,
      })

      if (error) throw error

      // Refresh contacts and search results
      fetchContacts()
      if (searchQuery.trim()) {
        searchUsers()
      }
    } catch (error) {
      console.error("Error adding contact:", error)
    }
  }

  const startConversation = async (contactId: string) => {
    try {
      console.log("[v0] Starting conversation with contact:", contactId)

      // Get the contact's profile first
      const { data: contactProfile, error: contactError } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, preferred_language")
        .eq("id", contactId)
        .single()

      if (contactError || !contactProfile) {
        console.error("Error fetching contact profile:", contactError)
        return
      }

      // First, get all conversations where the current user is a participant
      const { data: userConversations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id)

      if (userConversations && userConversations.length > 0) {
        // Then check if the contact is also in any of these conversations
        const conversationIds = userConversations.map((c) => c.conversation_id)

        const { data: sharedConversation } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", contactId)
          .in("conversation_id", conversationIds)
          .limit(1)
          .single()

        if (sharedConversation) {
          console.log("[v0] Found existing conversation:", sharedConversation.conversation_id)
          onSelectContact(sharedConversation.conversation_id, contactProfile as Profile)
          onClose()
          return
        }
      }

      console.log("[v0] Creating new conversation")
      // Create new conversation
      const { data: newConversation, error: conversationError } = await supabase
        .from("conversations")
        .insert({
          created_by: user.id,
        })
        .select()
        .single()

      if (conversationError) throw conversationError

      // Add participants
      const { error: participantsError } = await supabase.from("conversation_participants").insert([
        {
          conversation_id: newConversation.id,
          user_id: user.id,
        },
        {
          conversation_id: newConversation.id,
          user_id: contactId,
        },
      ])

      if (participantsError) throw participantsError

      console.log("[v0] Created new conversation:", newConversation.id)
      onSelectContact(newConversation.id, contactProfile as Profile)
      onClose()
    } catch (error) {
      console.error("Error starting conversation:", error)
    }
  }

  const filteredContacts = contacts.filter((contact) =>
    contact.display_name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Contacts</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contacts">My Contacts</TabsTrigger>
            <TabsTrigger value="search">Find People</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={activeTab === "contacts" ? "Search contacts..." : "Search people..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <TabsContent value="contacts" className="mt-4">
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No contacts yet</p>
                  <p className="text-xs text-gray-400 mt-1">Search for people to add them</p>
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contact.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback className="bg-gray-100 text-gray-600">
                          {contact.display_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{contact.display_name}</p>
                        <Badge variant="outline" className="text-xs">
                          {SUPPORTED_LANGUAGES[contact.preferred_language as keyof typeof SUPPORTED_LANGUAGES]}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => startConversation(contact.id)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="search" className="mt-4">
            <div className="max-h-96 overflow-y-auto space-y-2">
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Searching...</div>
              ) : searchResults.length === 0 && searchQuery.trim() ? (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No users found</p>
                  <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                </div>
              ) : (
                searchResults.map((userProfile) => (
                  <div key={userProfile.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={userProfile.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback className="bg-gray-100 text-gray-600">
                          {userProfile.display_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{userProfile.display_name}</p>
                        <Badge variant="outline" className="text-xs">
                          {SUPPORTED_LANGUAGES[userProfile.preferred_language as keyof typeof SUPPORTED_LANGUAGES]}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {!userProfile.isContact && (
                        <Button size="sm" variant="outline" onClick={() => addContact(userProfile.id)}>
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => startConversation(userProfile.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
