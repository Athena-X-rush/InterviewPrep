import React, { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import api from '../services/api'

const roles = ['Software Engineer', 'Frontend Engineer', 'Backend Engineer', 'Data Analyst', 'Full Stack Engineer']
const difficulties = ['Easy (Junior)', 'Medium (Mid Level)', 'Hard (Senior Level)']
const questionOptions = ['5 Questions', '8 Questions', '10 Questions']
const timeOptions = ['1 minute', '2 minutes', '3 minutes']

const ResumeInterview = () => {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()

  const [form, setForm] = useState({
    role: 'Software Engineer',
    difficulty: 'Medium (Mid Level)',
    questions: '8 Questions',
    timePerQuestion: '2 minutes',
  })
  const [resumeText, setResumeText] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const userName = user?.name || 'Learner'
  const questionCount = Number(form.questions.split(' ')[0])
  const timePerQuestionSeconds = Number(form.timePerQuestion.split(' ')[0]) * 60

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const handleStart = async () => {
    if (!resumeText || resumeText.trim().length < 50) {
      setError('Please paste your resume content first (at least 50 characters).')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await api.post('/ai/generate-resume-questions', {
        resumeText,
        role: form.role,
        difficulty: form.difficulty,
        questionCount,
      })

      const questions = response.data.questions

      navigate('/interview/session', {
        state: {
          modeName: 'AI Resume Interview',
          modeLabel: 'RESUME',
          metaLabel: `${form.role.toUpperCase()} · ${form.difficulty.toUpperCase()}`,
          summaryTopic: form.role,
          summaryDifficulty: form.difficulty,
          userName: userName.trim() || 'Guest',
          timePerQuestionSeconds,
          questions,
        },
      })
    } catch (error) {
      console.error('Error:', error)
      setError('Failed to generate questions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="interview-shell">
      <main className="interview-page interview-page--wide">
        <Link to="/interview" className="back-link">← Back</Link>

        <div className="iresume-header">
          <span className="ihub-badge">Resume mode</span>
          <h1>🎙 AI Resume Interview</h1>
          <p>Upload your resume and face questions built around your actual experience, skills, and projects.</p>
        </div>

        <div className="iresume-layout">
          {/* Setup panel */}
          <section className="iresume-panel">
            <h2>Session setup</h2>

            <div className="iresume-user-row">
              <div className="iresume-user-avatar">{userName[0]?.toUpperCase()}</div>
              <div>
                <strong>{userName}</strong>
                <small>Active candidate</small>
              </div>
            </div>

            <label className="form-group">
              <span>Target role</span>
              <select value={form.role} onChange={(e) => set('role', e.target.value)}>
                {roles.map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>

            <label className="form-group">
              <span>Difficulty</span>
              <select value={form.difficulty} onChange={(e) => set('difficulty', e.target.value)}>
                {difficulties.map((d) => <option key={d}>{d}</option>)}
              </select>
            </label>

            <div className="ihub-row">
              <label className="form-group">
                <span>Questions</span>
                <select value={form.questions} onChange={(e) => set('questions', e.target.value)}>
                  {questionOptions.map((q) => <option key={q}>{q}</option>)}
                </select>
              </label>

              <label className="form-group">
                <span>Time / Q</span>
                <select value={form.timePerQuestion} onChange={(e) => set('timePerQuestion', e.target.value)}>
                  {timeOptions.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
            </div>

            <ul className="iresume-features">
              <li><span>🧠</span> AI reads your skills &amp; projects</li>
              <li><span>🎯</span> Questions tailored to your resume</li>
              <li><span>🎙</span> Speech-to-text transcription</li>
              <li><span>📊</span> Per-answer feedback &amp; scores</li>
            </ul>
          </section>

          {/* Upload panel */}
          <section className="iresume-panel">
            <h2>Paste your resume</h2>

            <textarea
              className="iresume-textarea"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume content here (skills, experience, projects, etc.)..."
              rows={15}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'monospace' }}
            />

            <div className="iresume-what">
              <p className="iresume-what__label">What happens next</p>
              <ol className="iresume-steps">
                <li>AI analyzes your resume content</li>
                <li>Questions are generated based on your role &amp; resume</li>
                <li>Interview starts — answer by typing or speaking</li>
              </ol>
            </div>
          </section>
        </div>

        {error ? <p className="inline-error inline-error--wide">{error}</p> : null}

        <button
          type="button"
          className="button button--primary full-width-cta"
          onClick={handleStart}
          disabled={loading}
        >
          {loading ? 'Generating questions...' : 'Start resume interview →'}
        </button>
      </main>
    </div>
  )
}

export default ResumeInterview