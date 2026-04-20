import React, { useContext, useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import QuestionCard from '../components/QuestionCard'
import ProgressBar from '../components/ProgressBar'
import Timer from '../components/Timer'
import useQuiz from '../hooks/useQuiz'
import { buildQuizQuestions } from '../data/questionBank'
import { AuthContext } from '../context/AuthContext'
import api from '../services/api'

const difficultyLevels = [
  { value: 'easy', label: 'Beginner', detail: 'Warm up', emoji: '🌱' },
  { value: 'medium', label: 'Intermediate', detail: 'Normal', emoji: '⭐' },
  { value: 'hard', label: 'Advanced', detail: 'Rough', emoji: '🔥' }
]

const questionCounts = [3, 5, 10, 15]

const loadSteps = ['Shuffle topics', 'Write questions', 'Double-check', 'Ready']

const SetupView = ({ form, setForm, onStart }) => (
  <main className="quiz-page quiz-page--duo">
    <section className="quiz-setup-card quiz-setup-card--duo">
      <h1 className="quiz-setup-card__title">Daily-style quiz</h1>

      <label className="form-group">
        <span>Your Name</span>
        <input type="text" value={form.userName} readOnly placeholder="Learner" />
      </label>

      <label className="form-group">
        <span>Topic</span>
        <input
          type="text"
          value={form.topic}
          onChange={(event) => setForm((current) => ({ ...current, topic: event.target.value }))}
          placeholder="e.g. Computer Science, Operating Systems, Data Structures, Algorithms"
        />
      </label>

      <div className="form-group">
        <span>Difficulty</span>
        <div className="segmented-grid segmented-grid--duo">
          {difficultyLevels.map((option) => (
            <button
              key={option.value}
              type="button"
              className={'select-card duo-pick' + (form.difficulty === option.value ? ' is-active' : '') + ' is-' + option.value}
              onClick={() => setForm((current) => ({ ...current, difficulty: option.value }))}
            >
              <strong>{option.emoji}</strong>
              <b>{option.label}</b>
              <small>{option.detail}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <span>How many questions</span>
        <div className="count-grid count-grid--duo">
          {questionCounts.map((count) => (
            <button
              key={count}
              type="button"
              className={'count-pill duo-count' + (form.questionCount === count ? ' is-active' : '')}
              onClick={() => setForm((current) => ({ ...current, questionCount: count }))}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      <button type="button" className="duo-start-btn" onClick={onStart}>
        Let's go
      </button>
    </section>
  </main>
)

const LoadingView = ({ activeStep }) => (
  <main className="quiz-loading-page quiz-loading-page--duo">
    <section className="quiz-loading-card quiz-loading-card--duo">
      <div className="spinner-ring spinner-ring--duo" />
      <h2>Hang tight</h2>

      <div className="loading-checklist loading-checklist--duo">
        {loadSteps.map((step, index) => {
          const completed = index < activeStep
          const current = index === activeStep

          return (
            <div
              key={step}
              className={'loading-step' + (completed ? ' is-complete' : '') + (current ? ' is-current' : '')}
            >
              <span className="loading-step__dot">{completed ? '✓' : ''}</span>
              <span>{step}</span>
            </div>
          )
        })}
      </div>
    </section>
  </main>
)

const ResultsView = ({ answers, score, onRestart, config }) => (
  <main className="quiz-results-page quiz-results-page--duo">
    <section className="quiz-results-card quiz-results-card--duo">
      <div className="duo-result-hero" aria-hidden="true">
        <span>{score === answers.length ? '🎉' : score >= answers.length / 2 ? '👍' : '📝'}</span>
      </div>
      <p className="quiz-results-card__label">Lesson done</p>
      <h1>
        {score} / {answers.length} correct
      </h1>
      <p className="quiz-results-card__sub">
        {config.userName || 'You'} · {config.topic || 'general'} · {config.difficulty}
      </p>

      <div className="results-summary-grid results-summary-grid--duo">
        <article>
          <span>Accuracy</span>
          <strong>{answers.length ? Math.round((score / answers.length) * 100) : 0}%</strong>
        </article>
        <article>
          <span>Topic</span>
          <strong>{config.topic || 'General'}</strong>
        </article>
        <article>
          <span>Difficulty</span>
          <strong>{config.difficulty}</strong>
        </article>
      </div>

      <div className="results-list results-list--duo">
        {answers.map((answer, index) => (
          <article key={answer.questionId} className={'result-item' + (answer.isCorrect ? ' is-correct' : ' is-wrong')}>
            <strong>
              Q{index + 1}. {answer.question}
            </strong>
            <p>You: {answer.selectedOption || 'Skipped'}</p>
            <p>Answer: {answer.correctAnswer}</p>
            <p className="result-item__explain">{answer.explanation}</p>
          </article>
        ))}
      </div>

      <button type="button" className="duo-start-btn duo-start-btn--wide" onClick={onRestart}>
        Again
      </button>
    </section>
  </main>
)

const Quiz = () => {
  const { user } = useContext(AuthContext)
  const {
    status,
    quizConfig,
    currentQuestion,
    currentIndex,
    selectedOption,
    answers,
    score,
    questions,
    timeLeft,
    progress,
    setTimeLeft,
    beginGeneration,
    startQuiz,
    chooseOption,
    submitAnswer,
    resetQuiz
  } = useQuiz()

  const [form, setForm] = useState({
    userName: user?.name || 'Learner',
    topic: '',
    difficulty: 'medium',
    questionCount: 5
  })
  const [loadingStep, setLoadingStep] = useState(0)
  const [resultSaved, setResultSaved] = useState(false)

  useEffect(() => {
    setForm((current) => ({
      ...current,
      userName: user?.name || 'Learner'
    }))
  }, [user?.name])

  useEffect(() => {
    if (status !== 'loading') {
      return undefined
    }

    setLoadingStep(0)
    const generatedQuestions = buildQuizQuestions({
      topic: form.topic || 'dsa',
      difficulty: form.difficulty,
      questionCount: form.questionCount
    })

    const timers = loadSteps.map((_, index) =>
      window.setTimeout(() => {
        setLoadingStep(index)
      }, index * 700)
    )

    const startTimer = window.setTimeout(() => {
      startQuiz(generatedQuestions)
    }, loadSteps.length * 700 + 250)

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      window.clearTimeout(startTimer)
    }
  }, [form.difficulty, form.questionCount, form.topic, startQuiz, status])

  useEffect(() => {
    if (status !== 'active') {
      return undefined
    }

    if (timeLeft <= 0) {
      submitAnswer()
      return undefined
    }

    const timer = window.setTimeout(() => {
      setTimeLeft(timeLeft - 1)
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [setTimeLeft, status, submitAnswer, timeLeft])

  useEffect(() => {
    if (status !== 'results' || resultSaved || !questions.length) {
      return undefined
    }

    let isMounted = true
    const accuracy = questions.length ? Math.round((score / questions.length) * 100) : 0

    const saveResult = async () => {
      try {
        await api.post('/quiz/submit', {
          score: accuracy,
          accuracy,
          activityType: 'quiz',
          topic: quizConfig.topic || form.topic || 'General',
          difficulty: quizConfig.difficulty || form.difficulty,
          modeName: 'AI Quiz',
          totalQuestions: questions.length,
          correctAnswers: score
        })

        if (isMounted) {
          setResultSaved(true)
        }
      } catch (error) {
        if (isMounted) {
          setResultSaved(false)
        }
      }
    }

    saveResult()

    return () => {
      isMounted = false
    }
  }, [
    form.difficulty,
    form.topic,
    questions.length,
    quizConfig.difficulty,
    quizConfig.topic,
    resultSaved,
    score,
    status
  ])

  const quizHeaderMeta = useMemo(
    () => ({
      topic: (quizConfig.topic || form.topic || 'General').toUpperCase(),
      difficulty: (quizConfig.difficulty || form.difficulty).toUpperCase()
    }),
    [form.difficulty, form.topic, quizConfig.difficulty, quizConfig.topic]
  )

  const handleStart = () => {
    setResultSaved(false)
    beginGeneration({
      userName: user?.name || form.userName || 'Learner',
      topic: form.topic.trim() || 'DSA',
      difficulty: form.difficulty,
      questionCount: form.questionCount
    })
  }

  const handleConfirm = () => {
    submitAnswer()
  }

  return (
    <div className="page-shell page-shell--duo">
      <Navbar />

      {status === 'setup' && <SetupView form={form} setForm={setForm} onStart={handleStart} />}
      {status === 'loading' && <LoadingView activeStep={loadingStep} />}
      {status === 'results' && (
        <ResultsView answers={answers} score={score} onRestart={resetQuiz} config={quizConfig} />
      )}

      {status === 'active' && currentQuestion && (
        <main className="quiz-active-page quiz-active-page--duo">
          <section className="quiz-toolbar quiz-toolbar--duo">
            <Timer seconds={timeLeft} className="timer-pill--duo" />
          </section>

          <section className="quiz-progress-panel quiz-progress-panel--duo">
            <div className="quiz-progress-panel__header">
              <span>
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>
            <ProgressBar progress={progress} variant="duo" />
          </section>

          <QuestionCard
            question={currentQuestion}
            selectedOption={selectedOption}
            onSelect={chooseOption}
            onConfirm={handleConfirm}
            currentIndex={currentIndex}
            totalQuestions={questions.length}
          />
        </main>
      )}
    </div>
  )
}

export default Quiz
