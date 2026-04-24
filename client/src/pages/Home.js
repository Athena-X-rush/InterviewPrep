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
    description: 'Short sessions on whatever topic you type in. Nothing fancy — just questions, a timer, and a score at the end.'
  },
  {
    title: 'Interview practice',
    description: 'Talk through prompts with your mic and camera on, or stick to typing. Good for nervous energy, not perfect answers.'
  },
  {
    title: 'Resume & docs',
    description: 'Upload a file and practice answers that relate to what you actually wrote.'
  },
  {
    title: 'Leaderboard',
    description: 'Points add up over time. Mostly so you can see if you are showing up consistently.'
  },
  {
    title: 'Dashboard',
    description: 'Rank, points, and how you compare to the top score right now — all in one place.'
  },
  {
    title: 'Works in the browser',
    description: 'No desktop app. Log in, pick a mode, go. (You will need a mic for some interview modes.)'
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

  const accuracyScore = Math.max(0, Math.min(100, Math.round(userStats.averageAccuracy || 0)))

  const activityBars = useMemo(() => {
    const totalAttempts = Math.max(1, userStats.quizAttempts + userStats.interviewAttempts)
    const quizShare = Math.round((userStats.quizAttempts / totalAttempts) * 100)
    const interviewShare = Math.round((userStats.interviewAttempts / totalAttempts) * 100)

    return [
      { label: 'Quiz share', value: quizShare + '%' },
      { label: 'Interview share', value: interviewShare + '%' },
      { label: 'Avg. accuracy (rough)', value: accuracyScore + '%' }
    ]
  }, [userStats.averageAccuracy, userStats.interviewAttempts, userStats.quizAttempts, accuracyScore])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    const fetchStats = async () => {
      try {
        const response = await api.get('/api/daily-summary')
        setUserStats(response.data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      }
    }

    fetchStats()
  }, [isAuthenticated])

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
            <p className="stripe-hero__label">Prep for tech interviews & quizzes</p>
            <h1 className="stripe-hero__title">
              Everything in one place,
              <br />
              without the clutter.
            </h1>
            <p className="stripe-hero__lede">
              PrepFlow is a small practice app: quizzes, mock interviews, and a simple report when you are done.
              We are still improving it — feedback welcome.
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
                  <strong>{accuracyScore} / 100</strong>
                </div>
                <div className="stripe-preview-metric">
                  <span>Total points</span>
                  <strong>{userStats.totalPoints}</strong>
                </div>
                <div className="stripe-preview-rows">
                  {activityBars.map((row) => (
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
            <img src={dashboardIllustration} alt="Dashboard illustration" className="stripe-preview-illustration__image" />
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
            <p>Quiz for speed. Interview for talking. Dashboard when you want the numbers.</p>
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
