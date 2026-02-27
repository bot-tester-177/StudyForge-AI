import { NextResponse } from 'next/server'
import { OpenAI } from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const {
      topic,
      questionCount = 5,
      format = "multiple-choice",
      difficulty = "medium",
    } = await req.json()

    if (!topic || typeof topic !== "string") {
      return NextResponse.json({ error: "Missing or invalid topic" }, { status: 400 })
    }

    let prompt = `Generate a ${questionCount}-question quiz on the topic:
${topic}

`
    prompt += `Format: ${format.replace("-", " ")}
`
    prompt += `Difficulty: ${difficulty}
`
    prompt += `
`
    prompt += `Instructions: For multiple choice questions provide 4 options labelled A, B, C, D and mark the correct answer. `
    prompt += `For short answer questions, provide the question followed by a one-sentence answer. `
    prompt += `Make the questions ${difficulty === "hard" ? "challenging and conceptually deep" : difficulty === "easy" ? "straightforward" : "of moderate difficulty"}.
`
    prompt += `
Respond with plain text or JSON; I will display whatever you return.
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    })

    const quiz = completion.choices?.[0]?.message?.content ?? ""
    return NextResponse.json({ quiz })
  } catch (error) {
    console.error("generate-quiz error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
