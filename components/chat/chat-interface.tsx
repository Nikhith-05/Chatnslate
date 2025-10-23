"use client"
import { useState } from "react"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/lib/types"
import { ChatSidebar } from "./chat-sidebar"
import { ChatArea } from "./chat-area"
import { ContactsModal } from "./contacts-modal"

interface ChatInterfaceProps {
  user: User
  profile: Profile
}

export function ChatInterface({ user, profile }: ChatInterfaceProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [selectedContactInfo, setSelectedContactInfo] = useState<Profile | null>(null)
  const [showContacts, setShowContacts] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <ChatSidebar
          user={user}
          profile={profile}
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
          onShowContacts={() => setShowContacts(true)}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatArea
          user={user}
          profile={profile}
          conversationId={selectedConversationId}
          contactInfo={selectedContactInfo}
          onStartNewChat={() => setShowContacts(true)}
        />
      </div>

      {/* Contacts Modal */}
      {showContacts && (
        <ContactsModal
          user={user}
          profile={profile}
          onClose={() => setShowContacts(false)}
            onSelectContact={(conversationId, contactInfo) => {
              setSelectedConversationId(conversationId);
              setSelectedContactInfo(contactInfo || null);
              setShowContacts(false);
            }}
        />
      )}
    </div>
  )
}
