import React, { useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Quiz', path: '/quiz' },
  { label: 'Interview', path: '/interview' },
  { label: 'Dashboard', path: '/dashboard' },
]

const SparkIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M13.4 2.7 6.8 11a1 1 0 0 0 .78 1.62h3.3l-.96 8.02a.6.6 0 0 0 1.09.4l6.54-8.32a1 1 0 0 0-.78-1.62h-3.2l.94-7.98a.6.6 0 0 0-1.1-.42Z"
      fill="currentColor"
    />
  </svg>
)

const Navbar = () => {
  const location = useLocation()
  const { user, isAuthenticated, logout } = useContext(AuthContext)

  return (
    <header className="topbar-shell">
      <nav className="topbar">
        <Link to="/" className="brand" aria-label="PrepFlow home">
          <span className="brand__mark">
            <SparkIcon />
          </span>
          <span className="brand__copy">
            <strong>PrepFlow</strong>
            <span>Practice app</span>
          </span>
        </Link>

        <div className="topbar__center">
          {navItems.map((item) => {
            const isInterviewRoute = item.path === '/interview' && location.pathname.startsWith('/interview')
            const isActive =
              isInterviewRoute ||
              (item.path !== '/' && item.path !== '/interview' && location.pathname === item.path) ||
              (item.path === '/' && location.pathname === '/' && item.label === 'Home')

            return (
              <Link
                key={item.label}
                to={item.path}
                className={`topbar__navlink${isActive ? ' is-active' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="topbar__actions">
          {isAuthenticated ? (
            <>
              <span className="topbar__welcome">Hi, {user?.name?.split(' ')[0] || 'Learner'}</span>
              <button className="topbar__cta" type="button" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="topbar__login">Log in</Link>
              <Link to="/login" className="topbar__cta">Get started</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Navbar
