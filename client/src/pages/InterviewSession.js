import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import api from '../services/api'

const recognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition

const stopWords = new Set([
  'about', 'after', 'again', 'also', 'and', 'answer', 'based', 'been',
  'between', 'could', 'create', 'does', 'example', 'explain', 'from',
  'have', 'hierarchy', 'how', 'into', 'interview', 'object', 'oriented',
  'programming', 'provide', 'question', 'related', 'should', 'that',
  'their', 'there', 'these', 'this', 'used', 'with', 'would',
])

const getKeywords = (text) =>
  text.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !stopWords.has(w))

const scoreAnswer = (answer, prompt, topic) => {
  const trimmed = answer.trim()
  const keywords = [...new Set([...getKeywords(prompt).slice(0, 6), ...getKeywords(topic).slice(0, 4)])]
  const matched = keywords.filter((k) => trimmed.toLowerCase().includes(k))
  const missing = keywords.filter((k) => !trimmed.toLowerCase().includes(k))
  const words = trimmed.split(/\s+/).filter(Boolean).length

  const relevance = trimmed ? Math.min(10, 2 + matched.length * 2) : 0
  const depth = trimmed ? Math.min(10, Math.floor(words / 18)) : 0
  const communication = trimmed
    ? Math.min(10, 2 + (trimmed.includes('.') ? 2 : 0) + (words > 25 ? 3 : 1) + (trimmed.length > 140 ? 2 : 0))
    : 0
  const semantic = trimmed ? Math.min(10, Math.round((matched.length / Math.max(keywords.length, 1)) * 10)) : 0
  const topicCoverage = trimmed ? Math.round((matched.length / Math.max(keywords.length, 1)) * 100) : 0
  const overall = Math.round((relevance + depth + communication) / 3)

  return { overall, relevance, depth, communication, semantic, topicCoverage, matched, missing }
}

// Pick the best available TTS voice — prefer a natural-sounding English one
const pickVoice = () => {
  const voices = window.speechSynthesis.getVoices()
  const preferred = [
    'Google UK English Female',
    'Google US English',
    'Microsoft Aria Online (Natural)',
    'Microsoft Jenny Online (Natural)',
    'Samantha',
    'Karen',
    'Moira',
  ]
  for (const name of preferred) {
    const match = voices.find((v) => v.name === name)
    if (match) return match
  }
  return voices.find((v) => v.lang.startsWith('en')) || voices[0] || null
}

const speak = (text, muted) => {
  if (muted || !text) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.rate = 0.92
  utter.pitch = 1.0
  const voice = pickVoice()
  if (voice) utter.voice = voice
  // Small delay lets voices load on first call
  setTimeout(() => window.speechSynthesis.speak(utter), 120)
}

const ScorePill = ({ label, value }) => {
  const color = value >= 7 ? 'green' : value >= 4 ? 'amber' : 'red'
  return (
    <div className={`iscore-pill iscore-pill--${color}`}>
      <span>{label}</span>
      <strong>{value}/10</strong>
    </div>
  )
}

const clock = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

const InterviewSession = () => {
  const location = useLocation()
  const session = location.state
  const videoRef = useRef(null)
  const speechRef = useRef(null)
  const threadRef = useRef(null)

  const [idx, setIdx] = useState(0)
  const [draft, setDraft] = useState('')
  const [timeLeft, setTimeLeft] = useState(session?.timePerQuestionSeconds || 120)
  const [responses, setResponses] = useState([])
  const [status, setStatus] = useState('active')
  const [camReady, setCamReady] = useState(false)
  const [micSupported] = useState(Boolean(recognitionApi))
  const [recording, setRecording] = useState(false)
  const [muted, setMuted] = useState(false)
  const [hint, setHint] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [saved, setSaved] = useState(false)
  const [voicesReady, setVoicesReady] = useState(false)
  const [followUpQuestion, setFollowUpQuestion] = useState(null)
  const [loadingFollowUp, setLoadingFollowUp] = useState(false)
  const [isFollowUpMode, setIsFollowUpMode] = useState(false)

  const question = session?.questions?.[idx] || null
  const progress = session?.questions?.length ? ((idx + 1) / session.questions.length) * 100 : 0
  const pastResponse = (qid) => responses.find((r) => r.questionId === qid)

  // Load voices
  useEffect(() => {
    const load = () => setVoicesReady(true)
    if (window.speechSynthesis.getVoices().length) {
      setVoicesReady(true)
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', load)
      return () => window.speechSynthesis.removeEventListener('voiceschanged', load)
    }
  }, [])

  // Camera
  useEffect(() => {
    if (!session || status !== 'active' || !navigator.mediaDevices?.getUserMedia) return
    let stream
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((s) => {
        stream = s
        if (videoRef.current) videoRef.current.srcObject = s
        setCamReady(true)
      })
      .catch(() => setHint('Camera preview unavailable — you can still type your answers.'))
    return () => stream?.getTracks().forEach((t) => t.stop())
  }, [session, status])

  // Speech recognition setup
  useEffect(() => {
    if (!recognitionApi) return
    const rec = new recognitionApi()
    rec.lang = 'en-US'
    rec.continuous = true
    rec.interimResults = true
    rec.onresult = (e) => {
      const text = Array.from(e.results).map((r) => r[0]?.transcript || '').join(' ').trim()
      setDraft(text)
    }
    rec.onend = () => setRecording(false)
    rec.onerror = () => { setRecording(false); setHint('Voice not available in this browser.') }
    speechRef.current = rec
    return () => rec.stop()
  }, [])

  // Timer
  useEffect(() => {
    if (status !== 'active' || submitted) return
    if (timeLeft <= 0) { handleSubmit(); return }
    const t = window.setTimeout(() => setTimeLeft((v) => v - 1), 1000)
    return () => clearTimeout(t)
  }, [submitted, status, timeLeft])

  // Speak question
  useEffect(() => {
    if (!question || !voicesReady) return
    speak(question.prompt, muted)
    return () => window.speechSynthesis.cancel()
  }, [question, muted, voicesReady])

  // Auto-scroll thread
  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [idx, submitted, feedback, responses.length, status])

  const summaryMetrics = useMemo(() => {
    if (!responses.length) return { overall: 0, relevance: 0, depth: 0, communication: 0 }
    const totals = responses.reduce(
      (acc, r) => ({
        overall: acc.overall + r.metrics.overall,
        relevance: acc.relevance + r.metrics.relevance,
        depth: acc.depth + r.metrics.depth,
        communication: acc.communication + r.metrics.communication,
      }),
      { overall: 0, relevance: 0, depth: 0, communication: 0 }
    )
    const n = responses.length
    return {
      overall: Math.round(totals.overall / n),
      relevance: Math.round(totals.relevance / n),
      depth: Math.round(totals.depth / n),
      communication: Math.round(totals.communication / n),
    }
  }, [responses])

  // Save to backend
  useEffect(() => {
    if (status !== 'complete' || saved || !session?.questions?.length) return
    let mounted = true
    const score = Math.max(0, Math.min(100, summaryMetrics.overall * 10))
    api.post('/quiz/submit', {
      score,
      accuracy: score,
      activityType: 'interview',
      topic: session.summaryTopic || session.modeName,
      difficulty: session.summaryDifficulty || session.metaLabel,
      modeName: session.modeName,
      totalQuestions: session.questions.length,
      correctAnswers: responses.length,
    }).then(() => { if (mounted) setSaved(true) }).catch(() => {})
    return () => { mounted = false }
  }, [status, saved, session, responses.length, summaryMetrics.overall])

  if (!session?.questions?.length) return <Navigate to="/interview" replace />

  const startRecording = () => {
    if (!speechRef.current) { setHint('Speech-to-text not supported here.'); return }
    setHint('')
    speechRef.current.start()
    setRecording(true)
  }

  const stopRecording = () => {
    speechRef.current?.stop()
    setRecording(false)
  }

  const replayQuestion = () => speak(question?.prompt, false)

  const requestFollowUp = async () => {
    if (!question || !draft) return
    setLoadingFollowUp(true)
    try {
      const response = await api.post('/ai/follow-up', {
        question: question.prompt,
        answer: draft,
        topic: session.summaryTopic || session.modeName,
        difficulty: session.summaryDifficulty || 'medium'
      })
      setFollowUpQuestion(response.data.followUpQuestion)
      setIsFollowUpMode(true)
      speak(response.data.followUpQuestion, muted)
    } catch (error) {
      setHint('Failed to generate follow-up question.')
    } finally {
      setLoadingFollowUp(false)
    }
  }

  const handleSubmit = async () => {
    if (!question) return
    stopRecording()
    const metrics = scoreAnswer(draft, question.prompt, session.summaryTopic || session.metaLabel)
    const entry = { questionId: question.id, prompt: question.prompt, answer: draft, metrics }
    setResponses((prev) => {
      const i = prev.findIndex((r) => r.questionId === question.id)
      if (i >= 0) { const next = [...prev]; next[i] = entry; return next }
      return [...prev, entry]
    })
    setFeedback(entry)
    setSubmitted(true)
    setHint('')
    
    // Automatically request follow-up
    setLoadingFollowUp(true)
    try {
      const response = await api.post('/ai/follow-up', {
        question: question.prompt,
        answer: draft,
        topic: session.summaryTopic || session.modeName,
        difficulty: session.summaryDifficulty || 'medium'
      })
      setFollowUpQuestion(response.data.followUpQuestion)
      setIsFollowUpMode(true)
      setTimeout(() => speak(response.data.followUpQuestion, muted), 500)
    } catch (error) {
      setHint('Follow-up generation failed. You can move to the next question.')
    } finally {
      setLoadingFollowUp(false)
    }
  }

  const goNext = () => {
    setDraft('')
    setFeedback(null)
    setSubmitted(false)
    setHint('')
    setFollowUpQuestion(null)
    setIsFollowUpMode(false)
    if (idx + 1 >= session.questions.length) { setStatus('complete'); return }
    setIdx((v) => v + 1)
    setTimeLeft(session.timePerQuestionSeconds)
  }

  const timerWarning = timeLeft <= 30 && !submitted

  return (
    <div className="interview-shell interview-shell--chat">
      {/* ── Active session ── */}
      {status === 'active' && question && (
        <div className="interview-chat-app">
          <header className="interview-chat-header">
            <Link to="/interview" className="interview-chat-back">← Leave</Link>
            <div className="interview-chat-header__mid">
              <span className="interview-chat-model">{session.modeLabel || 'Interview'}</span>
              <span className="interview-chat-sub">{session.metaLabel || session.summaryTopic}</span>
            </div>
            <div className="interview-chat-header__right">
              <span className={'interview-chat-timer' + (timerWarning ? ' interview-chat-timer--warn' : '')}>
                {clock(timeLeft)}
              </span>
              <span className="interview-chat-qcount">{idx + 1} / {session.questions.length}</span>
            </div>
          </header>

          <div className="interview-chat-main">
            {/* Thread + composer */}
            <div className="interview-chat-thread-wrap">
              <div className="interview-chat-thread" ref={threadRef}>

                {/* Past Q&A */}
                {session.questions.slice(0, idx).map((q) => {
                  const past = pastResponse(q.id)
                  return (
                    <div key={q.id} className="interview-chat-block">
                      <div className="chat-row chat-row--assistant">
                        <div className="chat-avatar">AI</div>
                        <div className="chat-bubble chat-bubble--assistant">
                          <p className="chat-bubble__text">{q.prompt}</p>
                        </div>
                      </div>
                      {past && (
                        <div className="chat-row chat-row--user">
                          <div className="chat-bubble chat-bubble--user">
                            <p className="chat-bubble__text">{past.answer.trim() || '…'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Current question */}
                <div className="interview-chat-block">
                  <div className="chat-row chat-row--assistant">
                    <div className="chat-avatar">AI</div>
                    <div className="chat-bubble chat-bubble--assistant">
                      <p className="chat-bubble__text">{question.prompt}</p>
                      {question.guidance ? (
                        <p className="chat-bubble__hint">{question.guidance}</p>
                      ) : null}
                    </div>
                  </div>

                  {submitted && (
                    <>
                      <div className="chat-row chat-row--user">
                        <div className="chat-bubble chat-bubble--user">
                          <p className="chat-bubble__text">{draft.trim() || 'No text — voice only.'}</p>
                        </div>
                      </div>

                      {feedback && (
                        <div className="chat-feedback">
                          <div className="chat-feedback__score">
                            Score: {feedback.metrics.overall * 10}/100
                          </div>
                          <div className="chat-feedback__grid">
                            <ScorePill label="Relevance" value={feedback.metrics.relevance} />
                            <ScorePill label="Depth" value={feedback.metrics.depth} />
                            <ScorePill label="Communication" value={feedback.metrics.communication} />
                          </div>
                          <div className="chat-feedback__tags">
                            {feedback.metrics.matched.length > 0 && (
                              <span className="topic-badge topic-badge--success">
                                ✓ {feedback.metrics.matched.join(', ')}
                              </span>
                            )}
                            {feedback.metrics.missing.length > 0 && (
                              <span className="topic-badge topic-badge--warning">
                                Missing: {feedback.metrics.missing.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Composer */}
              {!submitted ? (
                <div className="interview-chat-composer">
                  {hint ? <p className="interview-chat-hint">{hint}</p> : null}

                  <div className="interview-chat-composer__tools">
                    <button type="button" className="interview-chat-chip" onClick={replayQuestion}>
                      🔊 Read question
                    </button>
                    <button type="button" className="interview-chat-chip" onClick={() => setMuted((v) => !v)}>
                      {muted ? '🔕 Sound off' : '🔔 Sound on'}
                    </button>
                    <button
                      type="button"
                      className={'interview-chat-chip' + (recording ? ' interview-chat-chip--recording' : '')}
                      onClick={recording ? stopRecording : startRecording}
                      disabled={!micSupported}
                    >
                      {recording ? '⏹ Stop mic' : '🎙 Use mic'}
                    </button>
                    {recording && <span className="irecording-dot" />}
                  </div>

                  <textarea
                    className="interview-chat-textarea"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type your answer or use the mic…"
                    rows={4}
                  />

                  <div className="interview-chat-composer__actions">
                    <button
                      type="button"
                      className="button button--secondary"
                      onClick={() => setStatus('complete')}
                    >
                      End early
                    </button>
                    <button type="button" className="button button--primary" onClick={handleSubmit}>
                      Send →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="interview-chat-composer interview-chat-composer--after">
                  {hint ? <p className="interview-chat-hint">{hint}</p> : null}
                  
                  {loadingFollowUp ? (
                    <div style={{ textAlign: 'center', padding: '12px', color: 'var(--textMedium)' }}>
                      🔄 Generating follow-up question...
                    </div>
                  ) : isFollowUpMode && followUpQuestion ? (
                    <>
                      <div className="chat-bubble chat-bubble--assistant" style={{ margin: '0 0 12px 0' }}>
                        <p className="chat-bubble__text">{followUpQuestion}</p>
                      </div>
                      <div className="interview-chat-composer__actions">
                        <button
                          type="button"
                          className="button button--secondary"
                          onClick={() => setIsFollowUpMode(false)}
                        >
                          Skip follow-up
                        </button>
                        <button
                          type="button"
                          className="button button--primary"
                          onClick={() => {
                            setDraft('')
                            setSubmitted(false)
                            setIsFollowUpMode(false)
                          }}
                        >
                          Answer follow-up
                        </button>
                      </div>
                    </>
                  ) : (
                    <button type="button" className="button button--primary interview-chat-next" onClick={goNext}>
                      {idx + 1 === session.questions.length ? '🏁 Finish' : 'Next question →'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="interview-chat-sidebar">
              <div className="interview-chat-progress">
                <div className="interview-chat-progress__label">
                  Question {idx + 1} of {session.questions.length}
                </div>
                <div className="interview-chat-progress__bar">
                  <span style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="interview-chat-video">
                <video ref={videoRef} autoPlay muted playsInline className="interview-chat-video__feed" />
                <span className="interview-chat-video__label">
                  {camReady ? '🟢 Camera' : '⚫ No camera'}
                </span>
              </div>

              <div className="isession-meta">
                <span>{session.summaryTopic || session.modeName}</span>
                <span>{session.summaryDifficulty || '—'}</span>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* ── Summary ── */}
      {status === 'complete' && (
        <main className="interview-session-page interview-summary-page">
          <Link to="/interview" className="back-link">← New session</Link>

          <section className="interview-summary-notion">
            <span className="ihub-badge">Session complete</span>
            <h1 className="interview-summary-notion__title">Session notes</h1>
            <p className="interview-summary-notion__meta">
              {session.summaryTopic || session.modeName}
              <span className="interview-summary-notion__dot">·</span>
              {session.summaryDifficulty || session.metaLabel}
            </p>

            <div className="isummary-score-card">
              <div className="isummary-score-card__main">
                <span className="isummary-score-card__num">{summaryMetrics.overall * 10}</span>
                <span className="isummary-score-card__label">/ 100</span>
              </div>
              <p className="isummary-score-card__note">
                Keyword-based estimate — not a human evaluation.
              </p>
            </div>

            <div className="interview-summary-grid interview-summary-grid--notion">
              {[
                ['Relevance', summaryMetrics.relevance],
                ['Depth', summaryMetrics.depth],
                ['Communication', summaryMetrics.communication],
                ['Overall', summaryMetrics.overall],
              ].map(([label, value]) => (
                <article key={label} className="summary-metric">
                  <span>{label}</span>
                  <strong>{value} / 10</strong>
                </article>
              ))}
            </div>

            <h2 className="interview-summary-notion__h2">Per question</h2>
            <div className="notion-stack">
              {responses.map((r, i) => (
                <article key={r.questionId} className="notion-block">
                  <div className="notion-block__title">Q{i + 1} · Score {r.metrics.overall * 10}/100</div>
                  <p className="notion-block__q">{r.prompt}</p>
                  <p className="notion-block__a">
                    <em>Your answer:</em> {r.answer.trim() || 'No answer recorded.'}
                  </p>
                  <div className="interview-detail-badges">
                    {r.metrics.matched.length > 0 && (
                      <span className="topic-badge topic-badge--success">✓ {r.metrics.matched.join(', ')}</span>
                    )}
                    {r.metrics.missing.length > 0 && (
                      <span className="topic-badge topic-badge--warning">Missing: {r.metrics.missing.join(', ')}</span>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <div className="interview-summary-actions">
              <Link to="/interview" className="button button--primary">New session</Link>
              <Link to="/dashboard" className="button button--secondary">Open dashboard</Link>
            </div>
          </section>
        </main>
      )}
    </div>
  )
}

export default InterviewSession