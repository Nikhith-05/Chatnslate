import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    const supabase = await createClient()

    // Get the current user to verify they're authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single()

    if (existingProfile) {
      return NextResponse.json({ message: "Profile already exists" })
    }

    // Get user info from auth.users (this requires service role but we'll try with available permissions)
    // Since we can't access auth.users directly, we'll create a basic profile
    const { error: createError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        display_name: "Unknown User",
        preferred_language: "en"
      })

    if (createError) {
      console.error("Error creating profile:", createError)
      return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
    }

    return NextResponse.json({ message: "Profile created successfully" })
  } catch (error) {
    console.error("Error in create-profile API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
