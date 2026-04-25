import React, { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import api from '../services/api'

const roles = ['Software Engineer', 'Frontend Engineer', 'Backend Engineer', 'Data Analyst', 'Full Stack Engineer']
const difficulties = ['Easy (Junior)', 'Hard (Senior Level)']
const questionOptions = ['5 Questions', '8 Questions', '10 Questions']
const timeOptions = ['1 minute', '2 minutes', '3 minutes']
const personalities = ['Standard', 'Strict', 'Friendly', 'FAANG']
const companies = ['None', 'Google', 'Amazon', 'Meta', 'Startup']

const gapIcon = (type) => {
  if (type === 'missing') return '🔴'
  if (type === 'weak') return '🟡'
  return '💡'
}

const ResumeInterview = () => {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()

  const [form, setForm] = useState({
    role: 'Software Engineer',
    difficulty: 'Easy (Junior)',
    questions: '8 Questions',
    timePerQuestion: '2 minutes',
    personality: 'Standard',
    company: 'None',
  })
  const [resumeText, setResumeText] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [gaps, setGaps] = useState([])
  const [loadingGaps, setLoadingGaps] = useState(false)
  const [gapsAnalyzed, setGapsAnalyzed] = useState(false)

  const userName = user?.name || 'Learner'
  const questionCount = Number(form.questions.split(' ')[0])
  const timePerQuestionSeconds = Number(form.timePerQuestion.split(' ')[0]) * 60

  const updateForm = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const analyzeResume = async () => {
    if (!resumeText || resumeText.trim().length < 50) {
      setError('Need at least 50 characters to analyze.')
      return
    }
    setError('')
    setLoadingGaps(true)
    setGapsAnalyzed(false)
    try {
      const res = await api.post('/ai/detect-resume-gaps', {
        resumeText,
        role: form.role,
      })
      setGaps(res.data.gaps || [])
      setGapsAnalyzed(true)
    } catch (err) {
      console.error('Gap detection failed:', err)
      setError('Failed to analyze resume. Try again.')
    } finally {
      setLoadingGaps(false)
    }
  }

  const handleStart = async () => {
    if (!resumeText || resumeText.trim().length < 50) {
      setError('Need at least 50 characters of resume text to start.')
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
        personality: form.personality.toLowerCase(),
        company: form.company.toLowerCase(),
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
          <h1>🎙 AI Resume Interview</h1>
        </div>

        <div className="iresume-layout">
          <section className="iresume-panel">
            <h2>Settings</h2>

            <div className="iresume-user-row">
              <div className="iresume-user-avatar">{userName[0]?.toUpperCase()}</div>
              <div>
                <strong>{userName}</strong>
                <small>Signed in</small>
              </div>
            </div>

            <label className="form-group">
              <span>Role</span>
              <select value={form.role} onChange={(e) => updateForm('role', e.target.value)}>
                {roles.map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>

            <label className="form-group">
              <span>Difficulty</span>
              <div className="difficulty-cards">
                {difficulties.map((d) => (
                  <div
                    key={d}
                    className={`difficulty-card ${form.difficulty === d ? 'difficulty-card--active' : ''}`}
                    onClick={() => updateForm('difficulty', d)}
                  >
                    {d}
                  </div>
                ))}
              </div>
            </label>

            <label className="form-group">
              <span>Interviewer</span>
              <div className="style-cards">
                {personalities.map((p) => (
                  <div
                    key={p}
                    className={`style-card ${form.personality === p ? 'style-card--active' : ''}`}
                    onClick={() => updateForm('personality', p)}
                  >
                    {p}
                  </div>
                ))}
              </div>
            </label>

            <label className="form-group">
              <span>Company</span>
              <select value={form.company} onChange={(e) => updateForm('company', e.target.value)}>
                {companies.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>

            <div className="ihub-row">
              <label className="form-group">
                <span>Questions</span>
                <select value={form.questions} onChange={(e) => updateForm('questions', e.target.value)}>
                  {questionOptions.map((q) => <option key={q}>{q}</option>)}
                </select>
              </label>

              <label className="form-group">
                <span>Time / Q</span>
                <select value={form.timePerQuestion} onChange={(e) => updateForm('timePerQuestion', e.target.value)}>
                  {timeOptions.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
            </div>
          </section>

          <section className="iresume-panel">
            <h2>Your resume</h2>

            <textarea
              className="iresume-textarea"
              value={resumeText}
              onChange={(e) => {
                setResumeText(e.target.value)
                setGapsAnalyzed(false)
                setGaps([])
              }}
              placeholder="Paste your resume text here..."
              rows={15}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'monospace' }}
            />
            <div className="iresume-wordcount">{resumeText.trim().split(/\s+/).filter(w => w).length} words</div>

            <button
              type="button"
              className="button button--secondary full-width-cta"
              onClick={analyzeResume}
              disabled={loadingGaps || resumeText.trim().length < 50}
              style={{ marginTop: '10px' }}
            >
              {loadingGaps ? 'Analyzing...' : '🔍 Analyze resume'}
            </button>

            {gapsAnalyzed && gaps.length > 0 && (
              <div className="rgap-wrap">
                <div className="rgap-title">Resume gaps found</div>
                <div className="rgap-legend">
                  <span>🔴 Missing</span>
                  <span>🟡 Weak</span>
                  <span>💡 Suggestion</span>
                </div>
                <ul className="rgap-list">
                  {gaps.map((g, i) => (
                    <li key={i} className={`rgap-item rgap-item--${g.type}`}>
                      <span className="rgap-icon">{gapIcon(g.type)}</span>
                      <span className="rgap-text">{g.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {gapsAnalyzed && gaps.length === 0 && (
              <div className="rgap-wrap rgap-wrap--good">
                ✅ Resume looks solid for this role. No major gaps found.
              </div>
            )}

            {error ? <p className="inline-error" style={{ marginTop: '10px' }}>{error}</p> : null}

            <button
              type="button"
              className="button button--primary full-width-cta"
              onClick={handleStart}
              disabled={loading}
              style={{ marginTop: '12px' }}
            >
              {loading ? 'Getting questions ready...' : 'Start interview'}
            </button>
          </section>
        </div>
      </main>
    </div>
  )
}

export default ResumeInterview