import React, { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { checkCameraAndMic } from '../utils/mediaPermissions'
import { AuthContext } from '../context/AuthContext'
import api from '../services/api'

const ModeCard = ({ to, icon, title, desc }) => (
  <Link to={to} className="imode-card">
    <span className="imode-card__icon">{icon}</span>
    <span className="imode-card__text">
      <strong>{title}</strong>
      <small>{desc}</small>
    </span>
    <span className="imode-card__arrow">→</span>
  </Link>
)

const Interview = () => {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()

  const [form, setForm] = useState({
    topic: '',
    difficulty: 'Medium',
    questions: 6,
    timePerQuestion: 120,
  })
  const [devices, setDevices] = useState({ camera: false, microphone: false, message: '' })
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const [loading, setLoading] = useState(false)

  const updateForm = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const checkDevices = async () => {
    setChecking(true)
    const result = await checkCameraAndMic()
    setDevices(result)
    setChecking(false)
  }

  const handleStart = async () => {
    if (!form.topic.trim()) {
      setError('Enter a topic to continue.')
      return
    }
    if (!devices.camera || !devices.microphone) {
      setError('Allow camera and mic access first.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await api.post('/ai/generate-questions', {
        topic: form.topic.trim(),
        difficulty: form.difficulty,
        questionCount: form.questions,
      })

      const questions = response.data.questions

      navigate('/interview/session', {
        state: {
          modeName: 'Live Topic Interview',
          modeLabel: 'LIVE',
          metaLabel: `${form.topic.trim().toUpperCase()} · ${form.difficulty.toUpperCase()}`,
          summaryTopic: form.topic.trim(),
          summaryDifficulty: form.difficulty.toLowerCase(),
          userName: user?.name || 'Learner',
          timePerQuestionSeconds: Number(form.timePerQuestion),
          questions,
        },
      })
    } catch (error) {
      setError('Failed to generate questions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const devicesReady = devices.camera && devices.microphone

  return (
    <div className="interview-shell interview-shell--hub">
      <main className="interview-page interview-hub">
        <Link to="/" className="back-link">← Home</Link>

        <div className="ihub-layout">
          {/* Sidebar: other modes */}
          <aside className="ihub-sidebar">
            <p className="ihub-sidebar__label">Other modes</p>
            <ModeCard to="/interview/resume" icon="🎙" title="Resume interview" desc="Tailored to your uploaded resume" />
            <ModeCard to="/interview/document" icon="📄" title="Document interview" desc="From your own Q&A files" />
          </aside>

          {/* Main form card */}
          <section className="ihub-card">
            <div className="ihub-card__head">
              <span className="ihub-badge">New session</span>
              <h1>Interview practice</h1>
              <p>Choose a topic, answer one question at a time, and review the feedback after each response.</p>
            </div>

            <div className="ihub-form">
              <label className="form-group">
                <span>Topic</span>
                <input
                  type="text"
                  placeholder="e.g. OOP, system design, React hooks"
                  value={form.topic}
                  onChange={(e) => { updateForm('topic', e.target.value); setError('') }}
                />
              </label>

              <div className="ihub-row">
                <label className="form-group">
                  <span>Difficulty</span>
                  <select value={form.difficulty} onChange={(e) => updateForm('difficulty', e.target.value)}>
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </label>

                <label className="form-group">
                  <span>Questions</span>
                  <select value={String(form.questions)} onChange={(e) => updateForm('questions', Number(e.target.value))}>
                    <option value="4">4</option>
                    <option value="6">6</option>
                    <option value="8">8</option>
                    <option value="10">10</option>
                  </select>
                </label>

                <label className="form-group">
                  <span>Time / Q</span>
                  <select
                    value={String(form.timePerQuestion)}
                    onChange={(e) => updateForm('timePerQuestion', Number(e.target.value))}
                  >
                    <option value="60">1 min</option>
                    <option value="120">2 min</option>
                    <option value="180">3 min</option>
                  </select>
                </label>
              </div>

              {/* Device check strip */}
              <div className="idevice-row">
                <div className="idevice-indicators">
                  <span className={'idevice-dot' + (devices.camera ? ' idevice-dot--on' : '')} />
                  <span className="idevice-label">Cam {devices.camera ? 'ready' : 'off'}</span>
                  <span className={'idevice-dot' + (devices.microphone ? ' idevice-dot--on' : '')} />
                  <span className="idevice-label">Mic {devices.microphone ? 'ready' : 'off'}</span>
                </div>
                <button
                  type="button"
                  className={'idevice-btn' + (devicesReady ? ' idevice-btn--done' : '')}
                  onClick={checkDevices}
                  disabled={checking}
                >
                  {checking ? 'Checking…' : devicesReady ? '✓ Devices ready' : '🔐 Allow camera & mic'}
                </button>
              </div>

              {devices.message ? <p className="inline-message">{devices.message}</p> : null}
              {error ? <p className="inline-error">{error}</p> : null}

              <button
                type="button"
                className="button button--primary interview-submit"
                onClick={handleStart}
                disabled={loading}
              >
                {loading ? 'Preparing questions...' : 'Start interview →'}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default Interview
