import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params
  
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // First, verify the user is a participant in this conversation
    const { data: userParticipation, error: participationError } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .single()

    if (participationError || !userParticipation) {
      return NextResponse.json(
        { error: "You are not a participant in this conversation" },
        { status: 403 }
      )
    }

    // Get all participants in this conversation using a more robust query
    const { data: participants, error: participantsError } = await supabase
      .from("conversation_participants")
      .select(`
        user_id,
        profiles!inner (
          id,
          display_name,
          avatar_url,
          preferred_language
        )
      `)
      .eq("conversation_id", conversationId)

    console.log("Participants query result:", { participants, participantsError })

    if (participantsError) {
      console.error("Error fetching participants:", participantsError)
      return NextResponse.json(
        { error: "Failed to fetch participants" },
        { status: 500 }
      )
    }

    // Find the other participant (not the current user)
    const otherParticipant = participants?.find(p => p.user_id !== user.id)
    
    console.log("Other participant found:", otherParticipant)

    if (otherParticipant && otherParticipant.profiles) {
      console.log("Returning other participant profile")
      return NextResponse.json({
        participant: otherParticipant.profiles
      })
    }

    // Fallback: try the original method
    console.log("Fallback: trying original method")
    const { data: participantIds, error: fallbackError } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId)

    if (fallbackError) {
      console.error("Fallback query error:", fallbackError)
    } else {
      console.log("Fallback participant IDs:", participantIds)
      
      const otherParticipantId = participantIds?.find(p => p.user_id !== user.id)?.user_id
      
      if (otherParticipantId) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url, preferred_language")
          .eq("id", otherParticipantId)
          .single()

        if (profile) {
          return NextResponse.json({
            participant: profile
          })
        }
      }
    }

    // If no other participant found, return null
    console.log("No other participant found")
    return NextResponse.json({
      participant: null
    })

  } catch (error) {
    console.error("Error in get conversation participants endpoint:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
