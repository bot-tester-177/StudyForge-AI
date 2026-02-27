import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { OpenAI } from 'openai'

const DATA_PATH = path.join(process.cwd(), 'data')
const PROG_FILE = path.join(DATA_PATH, 'progress.json')

function readProgress() {
  try {
    const s = fs.readFileSync(PROG_FILE, 'utf-8')
    return JSON.parse(s)
  } catch (e) {
    return {}
  }
}

function writeProgress(obj: any) {
  if (!fs.existsSync(DATA_PATH)) fs.mkdirSync(DATA_PATH)
  fs.writeFileSync(PROG_FILE, JSON.stringify(obj, null, 2))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId = 'default', results } = req.body as { userId?: string; results: { topic: string; score: number }[] }
    if (!results || !Array.isArray(results)) return res.status(400).json({ error: 'Missing results' })

    const db = readProgress()
    if (!db[userId]) db[userId] = { topics: {} }

    for (const r of results) {
      const t = r.topic
      const score = Number(r.score)
      if (!db[userId].topics[t]) db[userId].topics[t] = { total: 0, count: 0 }
      db[userId].topics[t].total += score
      db[userId].topics[t].count += 1
    }

    writeProgress(db)

    // compute weak topics (< 0.7 average)
    const weak: string[] = []
    for (const [topic, stats] of Object.entries(db[userId].topics)) {
      const avg = (stats as any).total / (stats as any).count
      if (avg < 0.7) weak.push(topic)
    }

    // Optionally ask OpenAI to adjust roadmap (concise suggestion)
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const prompt = `Student performed poorly on these topics: ${weak.join(', ')}. Suggest a concise 2-week focused plan (bulleted) to improve these topics.`
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    })

    const suggestion = completion.choices?.[0]?.message?.content ?? ''

    res.status(200).json({ weakTopics: weak, suggestion })
  } catch (error) {
    console.error('progress error', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
