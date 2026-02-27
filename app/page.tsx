"use client";

import React, { useState } from 'react'

interface FormState {
  className: string
  examDate: string
  topics: string[]
}

export default function Page() {
  const [form, setForm] = useState<FormState>({
    className: '',
    examDate: '',
    topics: [''],
  })

  const [plan, setPlan] = useState<string>('')
  const [flashcards, setFlashcards] = useState<Record<string, string>>({})
  const [quizzes, setQuizzes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleTopicChange(index: number, value: string) {
    const newTopics = [...form.topics]
    newTopics[index] = value
    setForm({ ...form, topics: newTopics })
  }

  function addTopic() {
    setForm({ ...form, topics: [...form.topics, ''] })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      // generate plan
      const planResp = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const planData = await planResp.json()
      if (planResp.ok) {
        setPlan(planData.plan)
      } else {
        throw new Error(planData.error || 'Failed to create plan')
      }

      // generate flashcards & quizzes per topic
      const fc: Record<string, string> = {}
      const qz: Record<string, string> = {}
      await Promise.all(
        form.topics.map(async (topic) => {
          if (!topic) return
          const [fcResp, qzResp] = await Promise.all([
            fetch('/api/generate-flashcards', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ topic }),
            }),
            fetch('/api/generate-quiz', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ topic }),
            }),
          ])
          const fcData = await fcResp.json()
          const qzData = await qzResp.json()
          if (fcResp.ok) fc[topic] = fcData.flashcards
          if (qzResp.ok) qz[topic] = qzData.quiz
        })
      )
      setFlashcards(fc)
      setQuizzes(qz)
    } catch (err: any) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-4">StudyForge AI</h1>

      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <label className="block font-semibold">Class name</label>
          <input
            type="text"
            value={form.className}
            onChange={(e) => setForm({ ...form, className: e.target.value })}
            className="border p-2 w-full"
            required
          />
        </div>

        <div>
          <label className="block font-semibold">Exam date</label>
          <input
            type="date"
            value={form.examDate}
            onChange={(e) => setForm({ ...form, examDate: e.target.value })}
            className="border p-2 w-full"
            required
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Topics</label>
          {form.topics.map((topic, idx) => (
            <div key={idx} className="flex mb-2">
              <input
                type="text"
                value={topic}
                onChange={(e) => handleTopicChange(idx, e.target.value)}
                className="border p-2 flex-1"
                required
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addTopic}
            className="text-blue-600 underline"
          >
            + Add topic
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? 'Generating...' : 'Submit'}
        </button>
      </form>

      {error && <p className="text-red-600">Error: {error}</p>}

      {plan && (
        <section className="mb-6">
          <h2 className="text-2xl font-bold">Study roadmap</h2>
          <pre className="whitespace-pre-wrap bg-gray-100 p-4">
            {plan}
          </pre>
        </section>
      )}

      {Object.keys(flashcards).length > 0 && (
        <section className="mb-6">
          <h2 className="text-2xl font-bold">Flashcards</h2>
          {Object.entries(flashcards).map(([topic, cards]) => (
            <div key={topic} className="mb-4">
              <h3 className="font-semibold">{topic}</h3>
              <pre className="whitespace-pre-wrap bg-gray-100 p-3">
                {cards}
              </pre>
            </div>
          ))}
        </section>
      )}

      {Object.keys(quizzes).length > 0 && (
        <section className="mb-6">
          <h2 className="text-2xl font-bold">Quiz</h2>
          {Object.entries(quizzes).map(([topic, quiz]) => (
            <div key={topic} className="mb-4">
              <h3 className="font-semibold">{topic}</h3>
              <pre className="whitespace-pre-wrap bg-gray-100 p-3">
                {quiz}
              </pre>
            </div>
          ))}
        </section>
      )}
    </main>
  )
}
