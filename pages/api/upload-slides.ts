import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import pdf from 'pdf-parse'
import { OpenAI } from 'openai'
import { calculateDaysLeft } from '../../utils/dateCalculator'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const form = new formidable.IncomingForm()

  form.parse(req, async (err, fields, files) => {
    try {
      if (err) throw err

      const className = (fields.className as string) || 'Class'
      const examDate = (fields.examDate as string) || new Date().toISOString()

      const file = files.file as formidable.File
      if (!file) return res.status(400).json({ error: 'No file uploaded' })

      const data = fs.readFileSync(file.filepath)
      const parsed = await pdf(data)
      const text = parsed.text || ''

      // call OpenAI to extract topics and create a plan
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

      const daysLeft = calculateDaysLeft(examDate)

      const prompt = `You are an academic assistant. Given the following slide text, extract the key topics as a short list and then produce a structured ${daysLeft}-day study plan for the class ${className}.

Slides text:\n${text.slice(0, 4000)}\n\nRespond JSON: { "topics": [..], "plan": "..." }`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      })

      const content = completion.choices?.[0]?.message?.content ?? ''

      // try to parse JSON from the response
      let parsedResponse: any = { topics: [], plan: content }
      try {
        const jsonStart = content.indexOf('{')
        if (jsonStart >= 0) parsedResponse = JSON.parse(content.slice(jsonStart))
      } catch (e) {
        // fall back
      }

      res.status(200).json({ extractedTextLength: text.length, ...parsedResponse })
    } catch (error) {
      console.error('upload-slides error', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  })
}
