import type { NextApiRequest, NextApiResponse } from 'next'
import { OpenAI } from "openai"

// request/response types for clarity
interface QuizRequest {
  topic: string
  questionCount?: number
  format?: "multiple-choice" | "short-answer"
  difficulty?: "easy" | "medium" | "hard"
}

interface QuizResponse {
  quiz: string
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<QuizResponse | { error: string }>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const {
      topic,
      questionCount = 5,
      format = "multiple-choice",
      difficulty = "medium",
    } = req.body as QuizRequest

    if (!topic || typeof topic !== "string") {
      return res.status(400).json({ error: "Missing or invalid topic" })
    }

    // Build prompt
    let prompt = `Generate a ${questionCount}-question quiz on the topic:
${topic}

`;
    prompt += `Format: ${format.replace("-", " ")}
`;
    prompt += `Difficulty: ${difficulty}
`;
    prompt += `
`;
    prompt += `Instructions: For multiple choice questions provide 4 options labelled A, B, C, D and mark the correct answer. `;
    prompt += `For short answer questions, provide the question followed by a one-sentence answer. `;
    prompt += `Make the questions ${difficulty === "hard" ? "challenging and conceptually deep" : difficulty === "easy" ? "straightforward" : "of moderate difficulty"}.
`;
    prompt += `
Respond with plain text or JSON; I will display whatever you return.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    })

    const quiz = completion.choices?.[0]?.message?.content ?? ""
    res.status(200).json({ quiz })
  } catch (error) {
    console.error("generate-quiz error", error)
    res.status(500).json({ error: "Internal server error" })
  }
}
