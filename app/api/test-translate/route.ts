import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Test the translation API directly
    const testText = "Hello, how are you?"
    const response = await fetch(`${request.nextUrl.origin}/api/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: testText,
        targetLanguage: 'es',
        action: 'translate'
      }),
    })

    const result = await response.json()
    
    return NextResponse.json({
      success: true,
      originalText: testText,
      translationResponse: result,
      responseStatus: response.status,
      hasGoogleKey: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hasGoogleKey: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY
    })
  }
}
