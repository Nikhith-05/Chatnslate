import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { targetLanguage, translatedText } = await request.json()
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current message
    const { data: message, error: fetchError } = await supabase
      .from("messages")
      .select("translated_texts")
      .eq("id", id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    // Update translated texts
    const updatedTranslations = {
      ...message.translated_texts,
      [targetLanguage]: translatedText,
    }

    const { error: updateError } = await supabase
      .from("messages")
      .update({ translated_texts: updatedTranslations })
      .eq("id", id)

    if (updateError) {
      return NextResponse.json({ error: "Failed to save translation" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Translation save error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
