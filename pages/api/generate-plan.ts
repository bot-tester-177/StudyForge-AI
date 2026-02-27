import type { NextApiRequest, NextApiResponse } from 'next'
import { OpenAI } from "openai"
import { calculateDaysLeft } from "../../utils/dateCalculator"

// request/response types for clarity
interface PlanRequest {
  className: string
  examDate: string
  topics: string[]
}

interface PlanResponse {
  plan: string
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PlanResponse | { error: string }>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { className, examDate, topics } = req.body as PlanRequest

    if (!className || !examDate || !topics || !Array.isArray(topics)) {
      return res.status(400).json({ error: "Missing required fields" })
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
    res.status(200).json({ plan })
  } catch (error) {
    console.error("generate-plan error", error)
    res.status(500).json({ error: "Internal server error" })
  }
}
