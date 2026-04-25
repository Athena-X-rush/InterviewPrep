import React, { useContext, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import loginImage from '../assets/images/Screenshot 2026-04-19 at 09.19.47.png'

const initialForm = {
  name: '',
  email: '',
  password: ''
}

const Login = () => {
  const { isAuthenticated, isBootstrapping, login, register } = useContext(AuthContext)
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const redirectTo = location.state?.from?.pathname || '/dashboard'

  if (!isBootstrapping && isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (mode === 'register') {
        await register(form)
      } else {
        await login({ email: form.email, password: form.password })
      }

      navigate(redirectTo, { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to authenticate. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-shell">
      <Navbar />
      <main className="auth-page">
        <section className="auth-hero auth-hero--spline">
          <div className="spline-shell">
            <img src={loginImage} alt="Login illustration" />
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-card__tabs" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              className={'auth-card__tab' + (mode === 'login' ? ' is-active' : '')}
              onClick={() => setMode('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={'auth-card__tab' + (mode === 'register' ? ' is-active' : '')}
              onClick={() => setMode('register')}
            >
              Register
            </button>
          </div>

          <div className="auth-card__copy">
            <h2>{mode === 'login' ? 'Welcome back' : 'Create an account'}</h2>
            <p>
              {mode === 'login'
                ? 'Log in with your email and password to continue.'
                : 'Enter your name, email, and password to get started.'}
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' ? (
              <label className="auth-field">
                <span>Name</span>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ada Lovelace"
                  required
                />
              </label>
            ) : null}

            <label className="auth-field">
              <span>Email</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="auth-field">
              <span>Password</span>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                minLength="6"
                required
              />
            </label>

            {error ? <p className="auth-error">{error}</p> : null}

            <button className="button button--primary auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

          <p className="auth-switch">
            {mode === 'login' ? 'Need an account?' : 'Already registered?'}{' '}
            <button
              type="button"
              className="auth-switch__button"
              onClick={() => {
                const nextMode = mode === 'login' ? 'register' : 'login'
                setMode(nextMode)
                setError('')
              }}
            >
              {mode === 'login' ? 'Create one' : 'Log in'}
            </button>
          </p>
        </section>
      </main>
    </div>
  )
}

export default Login
