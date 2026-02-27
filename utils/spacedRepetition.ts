export interface SRState {
  repetitions: number
  interval: number // days
  eFactor: number
}

// SM-2 algorithm
export function scheduleNext(oldState: SRState | null, quality: number): SRState {
  // quality: 0-5 (5 best)
  if (quality < 0) quality = 0
  if (quality > 5) quality = 5

  if (!oldState) {
    // first time
    return { repetitions: 0, interval: 1, eFactor: 2.5 }
  }

  let { repetitions, interval, eFactor } = oldState

  if (quality < 3) {
    repetitions = 0
    interval = 1
  } else {
    repetitions += 1
    if (repetitions === 1) interval = 1
    else if (repetitions === 2) interval = 6
    else interval = Math.round(interval * eFactor)
  }

  // update eFactor
  eFactor = eFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (eFactor < 1.3) eFactor = 1.3

  return { repetitions, interval, eFactor }
}

export function nextReviewDateFromDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}
