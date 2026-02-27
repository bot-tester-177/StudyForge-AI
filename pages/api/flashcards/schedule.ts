import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { scheduleNext, nextReviewDateFromDays, SRState } from '../../../utils/spacedRepetition'

const DATA_PATH = path.join(process.cwd(), 'data')
const FLASH_FILE = path.join(DATA_PATH, 'flashcards.json')

function readFlashcards() {
  try {
    const s = fs.readFileSync(FLASH_FILE, 'utf-8')
    return JSON.parse(s)
  } catch (e) {
    return []
  }
}

function writeFlashcards(cards: any[]) {
  if (!fs.existsSync(DATA_PATH)) fs.mkdirSync(DATA_PATH)
  fs.writeFileSync(FLASH_FILE, JSON.stringify(cards, null, 2))
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { cardId, quality } = req.body as { cardId: string; quality: number }
    if (!cardId || typeof quality !== 'number') return res.status(400).json({ error: 'Missing fields' })

    const cards = readFlashcards()
    const idx = cards.findIndex((c: any) => c.id === cardId)
    if (idx === -1) return res.status(404).json({ error: 'Card not found' })

    const card = cards[idx]
    const oldState: SRState | null = card.srState ?? null
    const newState = scheduleNext(oldState, quality)

    card.srState = newState
    card.nextReview = nextReviewDateFromDays(newState.interval)

    cards[idx] = card
    writeFlashcards(cards)

    res.status(200).json({ card })
  } catch (error) {
    console.error('flashcards/schedule error', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
