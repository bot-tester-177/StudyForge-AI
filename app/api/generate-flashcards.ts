import type { NextApiRequest, NextApiResponse } from 'next'
import { OpenAI } from "openai"

interface FlashcardRequest {
  topic: string
}

interface FlashcardResponse {
  flashcards: string
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FlashcardResponse | { error: string }>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { topic } = req.body as FlashcardRequest
    if (!topic || typeof topic !== "string") {
      return res.status(400).json({ error: "Missing or invalid topic" })
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
    res.status(200).json({ flashcards })
  } catch (error) {
    console.error("generate-flashcards error", error)
    res.status(500).json({ error: "Internal server error" })
  }
}
