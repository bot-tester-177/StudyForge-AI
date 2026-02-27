import { NextResponse } from 'next/server'
import { OpenAI } from "openai"
import { calculateDaysLeft } from "../../../utils/dateCalculator"

export async function POST(req: Request) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
  try {
    const { className, examDate, topics } = await req.json()

    if (!className || !examDate || !topics || !Array.isArray(topics)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const daysLeft = calculateDaysLeft(examDate)

    const prompt = `
You are an elite academic strategist.

Class: ${className}
Days remaining: ${daysLeft}
Topics: ${topics.join(", ")}

Create:
1. A structured daily study roadmap
2. Study phases based on time left
3. Review checkpoints
4. Active recall strategy
5. Practice test schedule

Be extremely structured.
` 

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    })

    const plan = completion.choices?.[0]?.message?.content ?? ""
    return NextResponse.json({ plan })
  } catch (error) {
    console.error("generate-plan error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
