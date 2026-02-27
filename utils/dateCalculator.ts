export function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function formatISO(date: Date) {
  return date.toISOString()
}

export function calculateDaysLeft(examDate: string) {
  const today = new Date()
  const exam = new Date(examDate)
  const diff = exam.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 3600 * 24))
}
