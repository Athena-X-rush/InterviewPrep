import React, { useContext, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { AuthContext } from '../context/AuthContext'
import api from '../services/api'
import dashboardIllustration from '../assets/images/dashboard-illustration.png'
import heroAnim1 from '../assets/animations/1.png'
import heroAnim2 from '../assets/animations/2.png'
import heroAnim3 from '../assets/animations/3.png'

const features = [
  {
    title: 'Quizzes',
    description: 'Pick a topic, answer a few questions, and see how you did at the end.'
  },
  {
    title: 'Interview practice',
    description: 'Practice answering interview questions with your mic and camera, or just type if that feels easier.'
  },
  {
    title: 'Resume & docs',
    description: 'Use your own resume or study notes so the questions stay closer to what you are preparing for.'
  },
  {
    title: 'Leaderboard',
    description: 'Your points build up over time so you can track your progress across sessions.'
  },
  {
    title: 'Dashboard',
    description: 'See your score, rank, and a simple summary of how your recent practice is going.'
  },
  {
    title: 'Works in the browser',
    description: 'Everything runs in the browser, so you can log in and start without installing anything.'
  }
]

const Home = () => {
  const { isAuthenticated } = useContext(AuthContext)
  const [userStats, setUserStats] = useState({
    totalPoints: 0,
    quizAttempts: 0,
    interviewAttempts: 0,
    averageAccuracy: 0,
    rank: null
  })

  const accuracy = Math.max(0, Math.min(100, Math.round(userStats.averageAccuracy || 0)))

  const statsRows = useMemo(() => {
    const totalAttempts = Math.max(1, userStats.quizAttempts + userStats.interviewAttempts)
    const quizShare = Math.round((userStats.quizAttempts / totalAttempts) * 100)
    const interviewShare = Math.round((userStats.interviewAttempts / totalAttempts) * 100)

    return [
      { label: 'Quiz share', value: quizShare + '%' },
      { label: 'Interview share', value: interviewShare + '%' },
      { label: 'Avg. accuracy (rough)', value: accuracy + '%' }
    ]
  }, [userStats.averageAccuracy, userStats.interviewAttempts, userStats.quizAttempts, accuracy])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    }, { threshold: 0.1 })

    const elements = document.querySelectorAll('.scroll-animate')
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    let shouldUpdate = true
    const refreshStats = async () => {
      try {
        const { data } = await api.get('/quiz/summary')
        if (shouldUpdate && data?.summary) {
          setUserStats((current) => ({ ...current, ...data.summary }))
        }
      } catch (error) {
      }
    }

    refreshStats()

    return () => {
      shouldUpdate = false
    }
  }, [isAuthenticated])

  return (
    <div className="home-page home-page--stripe">
      <Navbar />
      <main className="home-shell home-shell--stripe">
        <section className="stripe-hero">
          <div className="stripe-hero__animated-bg">
            <img src={heroAnim1} alt="" className="stripe-hero__anim-image stripe-hero__anim-image--1" />
            <img src={heroAnim2} alt="" className="stripe-hero__anim-image stripe-hero__anim-image--2" />
            <img src={heroAnim3} alt="" className="stripe-hero__anim-image stripe-hero__anim-image--3" />
          </div>
          <div className="stripe-hero__content">
            <p className="stripe-hero__label">Interview and quiz practice</p>
            <h1 className="stripe-hero__title">
              Practice in one place,
              <br />
              without switching tools.
            </h1>
            <p className="stripe-hero__lede">
              PrepFlow is a practice app for quizzes, mock interviews, and quick progress tracking.
              It is built to keep things simple and easy to use.
            </p>
            <div className="stripe-hero__cta">
              <Link to="/quiz" className="stripe-btn stripe-btn--primary">
                Start a quiz
              </Link>
              <Link to="/interview" className="stripe-btn stripe-btn--quiet">
                Open interview
              </Link>
            </div>
          </div>
        </section>

        <div className="stripe-preview-section scroll-animate">
          <div className="stripe-preview-wrap">
            <div className="stripe-preview-card" aria-hidden="true">
              <div className="stripe-preview-card__chrome">
                <span />
                <span />
                <span />
                <span className="stripe-preview-card__title">Today</span>
              </div>
              <div className="stripe-preview-card__body">
                <div className="stripe-preview-metric">
                  <span>Readiness (rough)</span>
                  <strong>{accuracy} / 100</strong>
                </div>
                <div className="stripe-preview-metric">
                  <span>Total points</span>
                  <strong>{userStats.totalPoints}</strong>
                </div>
                <div className="stripe-preview-rows">
                  {statsRows.map((row) => (
                    <div key={row.label} className="stripe-preview-row">
                      <span>{row.label}</span>
                      <span className="stripe-preview-row__bar">
                        <i style={{ width: row.value }} />
                      </span>
                    </div>
                  ))}
                </div>
                <div className="stripe-preview-footer">
                  <span>{userStats.rank ? 'Rank #' + userStats.rank : 'No rank yet'}</span>
                  <span>
                    {userStats.interviewAttempts} interview · {userStats.quizAttempts} quiz
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="stripe-preview-illustration">
            <img
              src={dashboardIllustration}
              alt="Dashboard illustration"
              className="stripe-preview-illustration__image"
            />
          </div>
        </div>

        <section className="stripe-section scroll-animate" id="features">
          <h2 className="stripe-section__title">What you can do here</h2>
          <ul className="stripe-feature-grid">
            {features.map((feature) => (
              <li key={feature.title} className="stripe-feature-card">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="stripe-band">
          <div className="stripe-band__inner">
            <h2>Pick a mode and go</h2>
            <p>
              Use quiz mode for quick revision, interview mode for speaking practice, and the
              dashboard for your progress.
            </p>
            <div className="stripe-band__actions">
              <Link to="/quiz" className="stripe-btn stripe-btn--primary stripe-btn--sm">
                Quiz
              </Link>
              <Link to="/interview/document" className="stripe-btn stripe-btn--inverse stripe-btn--sm">
                Document mock
              </Link>
              <Link to="/dashboard" className="stripe-btn stripe-btn--quiet stripe-btn--sm">
                View report
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Home;
