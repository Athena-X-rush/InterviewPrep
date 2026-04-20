import React, { useContext, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { buildResumeInterviewQuestions } from '../data/interviewBank'
import { AuthContext } from '../context/AuthContext'

const roles = ['Software Engineer', 'Frontend Engineer', 'Backend Engineer', 'Data Analyst', 'Full Stack Engineer']
const difficulties = ['Easy (Junior)', 'Medium (Mid Level)', 'Hard (Senior Level)']
const questionOptions = ['5 Questions', '8 Questions', '10 Questions']
const timeOptions = ['1 minute', '2 minutes', '3 minutes']

const ResumeInterview = () => {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const fileInput = useRef(null)

  const [form, setForm] = useState({
    role: 'Software Engineer',
    difficulty: 'Medium (Mid Level)',
    questions: '8 Questions',
    timePerQuestion: '2 minutes',
  })
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')

  const userName = user?.name || 'Learner'
  const questionCount = Number(form.questions.split(' ')[0])
  const timePerQuestionSeconds = Number(form.timePerQuestion.split(' ')[0]) * 60

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const pickFile = (picked) => {
    if (!picked) return
    if (picked.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB.')
      return
    }
    setFile(picked)
    setError('')
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    pickFile(e.dataTransfer.files?.[0])
  }

  const handleStart = () => {
    if (!file) {
      setError('Upload your resume first.')
      return
    }

    const questions = buildResumeInterviewQuestions({
      role: form.role,
      difficulty: form.difficulty,
      questionCount,
      fileName: file.name,
    })

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
            <h2>Upload resume</h2>

            <input
              ref={fileInput}
              type="file"
              accept=".pdf,.doc,.docx"
              className="visually-hidden"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />

            <div
              className={'iresume-drop' + (dragging ? ' iresume-drop--over' : '') + (file ? ' iresume-drop--filled' : '')}
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              {file ? (
                <>
                  <span className="iresume-drop__icon">📎</span>
                  <strong>{file.name}</strong>
                  <small>{(file.size / 1024).toFixed(0)} KB · Click to change</small>
                </>
              ) : (
                <>
                  <span className="iresume-drop__icon">☁</span>
                  <strong>Drop your resume here</strong>
                  <small>or click to browse · PDF, DOCX · max 10MB</small>
                </>
              )}
            </div>

            {file && (
              <div className="iresume-file-strip">
                <span className="iresume-file-strip__name">✓ {file.name}</span>
                <button
                  type="button"
                  className="iresume-file-strip__remove"
                  onClick={() => setFile(null)}
                >
                  Remove
                </button>
              </div>
            )}

            <div className="iresume-what">
              <p className="iresume-what__label">What happens next</p>
              <ol className="iresume-steps">
                <li>Your file is parsed locally in the browser</li>
                <li>Questions are generated based on your role &amp; resume</li>
                <li>Interview starts — answer by typing or speaking</li>
              </ol>
            </div>
          </section>
        </div>

        {error ? <p className="inline-error inline-error--wide">{error}</p> : null}

        <button type="button" className="button button--primary full-width-cta" onClick={handleStart}>
          Start resume interview →
        </button>
      </main>
    </div>
  )
}

export default ResumeInterview