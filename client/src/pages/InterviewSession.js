import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import api from '../services/api'

const speechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

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
  const words = trimmed.split(/\s+/).filter(Boolean).length

  const relevance = trimmed ? Math.min(10, 2 + matched.length * 2) : 0
  const depth = trimmed ? Math.min(10, Math.floor(words / 18)) : 0
  const communication = trimmed
    ? Math.min(10, 2 + (trimmed.includes('.') ? 2 : 0) + (words > 25 ? 3 : 1) + (trimmed.length > 140 ? 2 : 0))
    : 0
  const overall = Math.round((relevance + depth + communication) / 3)

  return { overall, relevance, depth, communication }
}

const getVoice = () => {
  const voices = window.speechSynthesis.getVoices()
  const femaleNames = [
    'Microsoft Jenny Online (Natural)',
    'Microsoft Aria Online (Natural)',
    'Google UK English Female',
    'Samantha', 'Karen', 'Moira', 'Tessa', 'Victoria', 'Google US English',
  ]
  for (const name of femaleNames) {
    const match = voices.find((v) => v.name === name)
    if (match) return match
  }
  const byLocale = voices.find((v) => v.lang === 'en-GB' && v.name.toLowerCase().includes('female'))
  if (byLocale) return byLocale
  return voices.find((v) => v.lang.startsWith('en')) || voices[0] || null
}

const speak = (text, soundOff) => {
  if (soundOff || !text) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.92
  utterance.pitch = 1.0
  const voice = getVoice()
  if (voice) utterance.voice = voice
  setTimeout(() => window.speechSynthesis.speak(utterance), 120)
}

const clock = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

const getResourceIcon = (type) => {
  if (type === 'video') return '🎬'
  if (type === 'article') return '📝'
  return '📄'
}

const getBetterAnswerPoints = (text) => {
  if (!text || typeof text !== 'string') return []

  const clean = text
    .replace(/\r/g, '\n')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!clean) return []

  return clean
    .replace(/\s+\d+\.\s+/g, '. ')
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
}

const InterviewSession = () => {
  const location = useLocation()
  const [session, setSession] = useState(location.state)

  const videoRef = useRef(null)
  const speechRef = useRef(null)
  const threadRef = useRef(null)

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answerDraft, setAnswerDraft] = useState('')
  const [timeLeft, setTimeLeft] = useState(session?.timePerQuestionSeconds || 120)
  const [responses, setResponses] = useState([])
  const [status, setStatus] = useState('active')
  const [camReady, setCamReady] = useState(false)
  const [micSupported] = useState(Boolean(speechRecognition))
  const [recording, setRecording] = useState(false)
  const [soundOff, setSoundOff] = useState(false)
  const [hint, setHint] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [saved, setSaved] = useState(false)
  const [voicesReady, setVoicesReady] = useState(false)
  const [loadingFollowUp, setLoadingFollowUp] = useState(false)
  const [studyPlan, setStudyPlan] = useState(null)
  const [loadingStudyPlan, setLoadingStudyPlan] = useState(false)
  const [openBetterAnswer, setOpenBetterAnswer] = useState({})

  const toggleBetterAnswer = (qid) => {
    setOpenBetterAnswer((prev) => ({ ...prev, [qid]: !prev[qid] }))
  }

  const question = session?.questions?.[currentQuestionIndex] || null
  const progress = session?.questions?.length ? ((currentQuestionIndex + 1) / session.questions.length) * 100 : 0
  const pastResponse = (qid) => responses.find((r) => r.questionId === qid)

  useEffect(() => {
    const load = () => setVoicesReady(true)
    if (window.speechSynthesis.getVoices().length) {
      setVoicesReady(true)
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', load)
      return () => window.speechSynthesis.removeEventListener('voiceschanged', load)
    }
  }, [])

  useEffect(() => {
    if (!session || status !== 'active' || !navigator.mediaDevices?.getUserMedia) {
      return
    }

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

  useEffect(() => {
    if (!speechRecognition) {
      return
    }

    const recognizer = new speechRecognition()
    recognizer.lang = 'en-US'
    recognizer.continuous = true
    recognizer.interimResults = true
    recognizer.onresult = (e) => {
      const text = Array.from(e.results).map((r) => r[0]?.transcript || '').join(' ').trim()
      setAnswerDraft(text)
    }
    recognizer.onend = () => setRecording(false)
    recognizer.onerror = () => {
      setRecording(false)
      setHint('Voice not available in this browser.')
    }
    speechRef.current = recognizer
    return () => recognizer.stop()
  }, [])

  useEffect(() => {
    if (status !== 'active' || submitted) {
      return
    }

    if (timeLeft <= 0) {
      handleSubmit()
      return
    }

    const t = window.setTimeout(() => setTimeLeft((v) => v - 1), 1000)
    return () => clearTimeout(t)
  }, [submitted, status, timeLeft])

  useEffect(() => {
    if (!question || !voicesReady || !camReady) {
      return
    }

    speak(question.prompt, soundOff)
    return () => window.speechSynthesis.cancel()
  }, [question, soundOff, voicesReady, camReady])

  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [currentQuestionIndex, submitted, feedback, responses.length, status])

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

  useEffect(() => {
    if (status !== 'complete' || saved || !session?.questions?.length) return
    let isMounted = true
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
    }).then(() => { if (isMounted) setSaved(true) }).catch(() => {})
    return () => { isMounted = false }
  }, [status, saved, session, responses.length, summaryMetrics.overall])

  useEffect(() => {
    if (status === 'complete' && responses.length > 0 && !studyPlan && !loadingStudyPlan) {
      fetchStudyPlan()
    }
  }, [status, responses.length])

  if (!session?.questions?.length) return <Navigate to="/interview" replace />

  const fetchStudyPlan = async () => {
    setLoadingStudyPlan(true)
    try {
      const sessionData = {
        topic: session.summaryTopic || session.metaLabel,
        responses: responses.map(r => ({
          question: r.prompt,
          answer: r.answer,
          score: r.metrics.overall
        }))
      }
      const res = await api.post('/ai/generate-study-plan', { sessionData })
      setStudyPlan(res.data)
    } catch (err) {
      console.error('Failed to generate study plan:', err)
    } finally {
      setLoadingStudyPlan(false)
    }
  }

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

  const handleSubmit = async () => {
    if (!question) return
    window.speechSynthesis.cancel()
    stopRecording()

    setLoadingFollowUp(true)
    setHint('Evaluating your answer...')

    try {
      const response = await api.post('/ai/evaluate-answer', {
        question: question.prompt,
        answer: answerDraft,
        topic: session.summaryTopic || session.modeName
      })

      const metrics = {
        overall: response.data.overall,
        feedback: response.data.feedback,
        strengths: response.data.strengths,
        improvements: response.data.improvements,
        betterAnswer: response.data.betterAnswer
      }

      const entry = { questionId: question.id, prompt: question.prompt, answer: answerDraft, metrics }

      setResponses((prev) => {
        const i = prev.findIndex((r) => r.questionId === question.id)
        if (i >= 0) { const next = [...prev]; next[i] = entry; return next }
        return [...prev, entry]
      })

      setFeedback(entry)
      setSubmitted(true)
      setHint('')

      if (currentQuestionIndex + 1 < session.questions.length) {
        try {
          const history = responses.map((r) => ({ question: r.prompt, answer: r.answer }))
          history.push({ question: question.prompt, answer: answerDraft })

          const followUpResponse = await api.post('/ai/follow-up', {
            history,
            topic: session.summaryTopic || session.modeName,
            difficulty: session.summaryDifficulty || 'medium'
          })

          const newFollowUp = followUpResponse.data.followUpQuestion

          if (newFollowUp) {
            setSession((prev) => {
              const newQuestions = [...prev.questions]
              newQuestions[currentQuestionIndex + 1] = {
                ...newQuestions[currentQuestionIndex + 1],
                prompt: newFollowUp
              }
              return { ...prev, questions: newQuestions }
            })
          }
        } catch (err) {
          console.error('Follow-up generation failed:', err)
        }
      }

    } catch (err) {
      console.error('Evaluation error:', err)
      setHint('Failed to evaluate answer. Using fallback scoring.')

      const metrics = scoreAnswer(answerDraft, question.prompt, session.summaryTopic || session.metaLabel)
      const entry = { questionId: question.id, prompt: question.prompt, answer: answerDraft, metrics }

      setResponses((prev) => {
        const i = prev.findIndex((r) => r.questionId === question.id)
        if (i >= 0) { const next = [...prev]; next[i] = entry; return next }
        return [...prev, entry]
      })

      setFeedback(entry)
      setSubmitted(true)
      setHint('')
    } finally {
      setLoadingFollowUp(false)
    }
  }

  const goNext = () => {
    window.speechSynthesis.cancel()
    setAnswerDraft('')
    setFeedback(null)
    setSubmitted(false)
    setHint('')
    if (currentQuestionIndex + 1 >= session.questions.length) { setStatus('complete'); return }
    setCurrentQuestionIndex((v) => v + 1)
    setTimeLeft(session.timePerQuestionSeconds)
  }

  const timerWarning = timeLeft <= 30 && !submitted

  return (
    <div className="interview-shell interview-shell--chat">
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
              <span className="interview-chat-qcount">{currentQuestionIndex + 1} / {session.questions.length}</span>
            </div>
          </header>

          <div className="isession-two-col">
            <div className="isession-left">
              <div className="isession-video-box">
                <video ref={videoRef} autoPlay muted playsInline className="isession-video-feed" />
                <span className="isession-cam-label">
                  {camReady ? '🟢 Camera' : '⚫ No camera'}
                </span>
                <span className={'isession-timer' + (timerWarning ? ' isession-timer--warn' : '')}>
                  ⏱ {clock(timeLeft)}
                </span>
              </div>

              <div className="isession-controls">
                <button type="button" className="interview-chat-chip" onClick={replayQuestion}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                  Replay
                </button>
                <button type="button" className="interview-chat-chip" onClick={() => setSoundOff((v) => !v)}>
                  {soundOff ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                      Muted
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                      Sound on
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className={'interview-chat-chip' + (recording ? ' interview-chat-chip--recording' : '')}
                  onClick={recording ? stopRecording : startRecording}
                  disabled={!micSupported}
                >
                  {recording ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                      Stop mic
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                      Mic
                    </>
                  )}
                </button>
                {recording && <span className="irecording-dot" />}
                {!submitted && (
                  <>
                    <button
                      type="button"
                      className="button button--destructive"
                      onClick={() => { window.speechSynthesis.cancel(); setStatus('complete') }}
                    >
                      End early
                    </button>
                    <button type="button" className="button button--primary" onClick={handleSubmit}>
                      Submit →
                    </button>
                  </>
                )}
              </div>

              {!submitted ? (
                <div className="isession-composer">
                  {hint ? <p className="interview-chat-hint">{hint}</p> : null}
                  <textarea
                    className="interview-chat-textarea"
                    value={answerDraft}
                    onChange={(e) => setAnswerDraft(e.target.value)}
                    placeholder="Type your answer or use the mic…"
                    rows={4}
                  />
                  <div className="interview-chat-wordcount">{answerDraft.trim().split(/\s+/).filter(w => w).length} words</div>
                </div>
              ) : (
                <div className="isession-composer">
                  {hint ? <p className="interview-chat-hint">{hint}</p> : null}
                  {loadingFollowUp ? (
                    <div style={{ textAlign: 'center', padding: '12px', color: 'var(--textMedium)' }}>
                      Evaluating your answer…
                    </div>
                  ) : (
                    <button type="button" className="button button--primary interview-chat-next" onClick={goNext}>
                      {currentQuestionIndex + 1 === session.questions.length ? '🏁 Finish' : 'Next question →'}
                    </button>
                  )}
                  {submitted && feedback && (
                    <div className="chat-feedback" style={{ marginTop: '12px' }}>
                      <div className="chat-feedback__score">Score: {feedback.metrics.overall * 10}/100</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <aside className="isession-right">
              <div className="isession-qlist-header">
                <span className="isession-qlist-title">Question list</span>
                <span className="interview-chat-qcount">{currentQuestionIndex + 1} / {session.questions.length}</span>
              </div>

              <div className="interview-chat-progress__bar" style={{ marginBottom: '14px' }}>
                <span style={{ width: `${progress}%` }} />
              </div>

              <div className="isession-qlist" ref={threadRef}>
                {session.questions.map((q, idx) => {
                  const past = pastResponse(q.id)
                  const isCurrent = idx === currentQuestionIndex
                  const isDone = idx < currentQuestionIndex || (isCurrent && submitted)
                  const isLocked = idx > currentQuestionIndex

                  return (
                    <div
                      key={q.id}
                      className={
                        'isession-qitem' +
                        (isCurrent ? ' isession-qitem--active' : '') +
                        (isDone ? ' isession-qitem--done' : '') +
                        (isLocked ? ' isession-qitem--locked' : '')
                      }
                    >
                      <div className="isession-qitem-num">
                        {isDone ? '✓' : idx + 1}
                      </div>
                      <div className="isession-qitem-body">
                        {isLocked ? (
                          <p className="isession-qitem-text isession-qitem-text--hidden">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '6px'}}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            Locked
                          </p>
                        ) : (
                          <p className="isession-qitem-text">{q.prompt}</p>
                        )}
                        {isDone && past && (
                          <p className="isession-qitem-score">Score: {past.metrics.overall * 10}/100</p>
                        )}
                        {isCurrent && !submitted && (
                          <span className="isession-qitem-badge">Answering now</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </aside>
          </div>
        </div>
      )}

      {status === 'complete' && (
        <main className="interview-session-page interview-summary-page">
          <Link to="/interview" className="back-link">← New session</Link>

          <section className="interview-summary-notion">
            <h1 className="interview-summary-notion__title">Session notes</h1>
            <p className="interview-summary-notion__meta">
              {(session.summaryTopic || session.modeName).charAt(0).toUpperCase() + (session.summaryTopic || session.modeName).slice(1)}
              <span className="interview-summary-notion__dot">·</span>
              {(session.summaryDifficulty || session.metaLabel).charAt(0).toUpperCase() + (session.summaryDifficulty || session.metaLabel).slice(1)}
            </p>

            <div className="isummary-score-card">
              <div className="isummary-score-card__main">
                <span className="isummary-score-card__num">{summaryMetrics.overall * 10}</span>
                <span className="isummary-score-card__label">/ 100</span>
              </div>
              <p className="isummary-score-card__note">AI-powered evaluation</p>
            </div>

            <h2 className="interview-summary-notion__h2">Per question</h2>
            <div className="notion-stack">
              {responses.map((r, questionNumber) => {
                const betterAnswerPoints = getBetterAnswerPoints(r.metrics.betterAnswer)

                return (
                  <article key={r.questionId} className="notion-block">
                    <div className="notion-block__title">
                      Q{questionNumber + 1}
                      <span className={`notion-block__score-badge ${r.metrics.overall >= 7 ? 'notion-block__score-badge--green' : r.metrics.overall >= 4 ? 'notion-block__score-badge--amber' : 'notion-block__score-badge--red'}`}>
                        {r.metrics.overall * 10}/100
                      </span>
                    </div>

                    <p className="notion-block__q">{r.prompt}</p>

                    <p className="notion-block__a">
                      <em>Your answer:</em> {r.answer.trim() || 'No answer recorded.'}
                    </p>

                    {r.metrics.feedback && (
                      <p className="notion-block__feedback">{r.metrics.feedback}</p>
                    )}

                    {r.metrics.strengths && r.metrics.strengths.length > 0 && (
                      <div className="notion-block__tags">
                        {r.metrics.strengths.map((s, i) => (
                          <span key={i} className="notion-tag notion-tag--green">✓ {s}</span>
                        ))}
                      </div>
                    )}

                    {r.metrics.improvements && r.metrics.improvements.length > 0 && (
                      <div className="notion-block__tags" style={{ marginTop: '6px' }}>
                        {r.metrics.improvements.map((imp, i) => (
                          <span key={i} className="notion-tag notion-tag--orange">↑ {imp}</span>
                        ))}
                      </div>
                    )}

                    {betterAnswerPoints.length > 0 && (
                      <div className="notion-block__better-wrap">
                        <button
                          type="button"
                          className="notion-block__toggle"
                          onClick={() => toggleBetterAnswer(r.questionId)}
                        >
                          {openBetterAnswer[r.questionId] ? '▴ Hide better answer' : '▾ Show better answer'}
                        </button>
                        {openBetterAnswer[r.questionId] && (
                          <div className="notion-block__better-text">
                            <ul className="notion-block__better-list">
                              {betterAnswerPoints.map((line, i) => (
                                <li key={i} className="notion-block__better-item">{line}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>

            {/* study plan section */}
            <div className="splan-wrap">
              <h2 className="interview-summary-notion__h2">Your study plan</h2>

              {loadingStudyPlan && (
                <div className="splan-loading">
                  <span className="splan-loading__dot" />
                  <span className="splan-loading__dot" />
                  <span className="splan-loading__dot" />
                  <p>Building your plan based on your answers…</p>
                </div>
              )}

              {!loadingStudyPlan && studyPlan && studyPlan.days && studyPlan.days.length === 0 && (
                <div className="splan-empty">
                  🎉 Great job — no major weak areas found. Keep practicing to stay sharp.
                </div>
              )}

              {!loadingStudyPlan && studyPlan && studyPlan.days && studyPlan.days.length > 0 && (
                <div className="splan-days">
                  {studyPlan.days.map((day) => (
                    <div key={day.day} className="splan-card">

                      <div className="splan-card__head">
                        <span className="splan-card__day">Day {day.day}</span>
                        <span className="splan-card__duration">{day.duration}</span>
                      </div>

                      <div className="splan-card__topic">{day.topic}</div>

                      {day.why && (
                        <p className="splan-card__why">⚠ {day.why}</p>
                      )}

                      {day.resources && day.resources.length > 0 && (
                        <div className="splan-card__section">
                          <div className="splan-card__label">Resources</div>
                          <div className="splan-card__links">
                            {day.resources.map((r, i) => (
                              <a
                                key={i}
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="splan-link"
                              >
                                <span className="splan-link__icon">{getResourceIcon(r.type)}</span>
                                <span className="splan-link__label">{r.label}</span>
                                <span className="splan-link__arrow">↗</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}
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
