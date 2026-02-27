"use client";

import React, { useState } from 'react'

export default function ExamPage() {
  const [topic, setTopic] = useState('')
  const [format, setFormat] = useState<'multiple-choice' | 'short-answer'>('multiple-choice')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [questionCount, setQuestionCount] = useState(5)
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const resp = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, format, difficulty, questionCount }),
      })

      const data = await resp.json()
      if (!resp.ok) {
        setError(data.error || 'Failed to generate quiz')
      } else {
        setResult(data.quiz)
      }
    } catch (err) {
      setError('Network error')
    }
    setLoading(false)
  }

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Quiz Generator</h1>
      <form onSubmit={handleGenerate} className="space-y-4 max-w-md">
        <div>
          <label className="block font-semibold">Topic</label>
          <input
            className="border p-1 w-full"
            value={topic}
            onChange={e => setTopic(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-semibold">Question count</label>
          <input
            type="number"
            min={1}
            max={50}
            className="border p-1 w-20"
            value={questionCount}
            onChange={e => setQuestionCount(Number(e.target.value))}
          />
        </div>

        <div>
          <span className="block font-semibold">Format</span>
          <label className="mr-4">
            <input
              type="radio"
              name="format"
              value="multiple-choice"
              checked={format === 'multiple-choice'}
              onChange={() => setFormat('multiple-choice')}
            />{' '}
            Multiple Choice
          </label>
          <label>
            <input
              type="radio"
              name="format"
              value="short-answer"
              checked={format === 'short-answer'}
              onChange={() => setFormat('short-answer')}
            />{' '}
            Short Answer
          </label>
        </div>

        <div>
          <span className="block font-semibold">Difficulty</span>
          <select
            className="border p-1"
            value={difficulty}
            onChange={e => setDifficulty(e.target.value as any)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Quiz'}
        </button>
      </form>

      {error && <p className="mt-4 text-red-500">{error}</p>}
      {result && (
        <pre className="mt-4 whitespace-pre-wrap bg-gray-100 p-4">
          {result}
        </pre>
      )}
    </main>
  )
}
