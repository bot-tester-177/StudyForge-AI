import { NextResponse } from 'next/server'
import { OpenAI } from "openai"

export async function POST(req: Request) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
  try {
    const { topic } = await req.json()
    if (!topic || typeof topic !== "string") {
      return NextResponse.json({ error: "Missing or invalid topic" }, { status: 400 })
    }

    const prompt = `
Generate high-quality exam flashcards for:
${topic}

Use Q/A format.
Focus on test-level understanding.
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    })

    const flashcards = completion.choices?.[0]?.message?.content ?? ""
    return NextResponse.json({ flashcards })
  } catch (error) {
    console.error("generate-flashcards error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
