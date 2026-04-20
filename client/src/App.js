import React, { useContext } from 'react';
import { BrowserRouter as Router, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Interview from './pages/Interview';
import ResumeInterview from './pages/ResumeInterview';
import DocumentInterview from './pages/DocumentInterview';
import InterviewSession from './pages/InterviewSession';
import Quiz from './pages/Quiz';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { QuizProvider } from './context/QuizContext';
import { AuthContext } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isBootstrapping } = useContext(AuthContext);
  const location = useLocation();

  if (isBootstrapping) {
    return (
      <main className="generic-page">
        <section className="generic-page__card">
          <span className="eyebrow">Checking session</span>
          <h1>Loading your workspace</h1>
          <p>We are validating your login and preparing your dashboard.</p>
        </section>
      </main>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace state={{ from: location }} />;
};

function App() {
  return (
    <QuizProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/interview" element={<ProtectedRoute><Interview /></ProtectedRoute>} />
          <Route path="/interview/resume" element={<ProtectedRoute><ResumeInterview /></ProtectedRoute>} />
          <Route path="/interview/document" element={<ProtectedRoute><DocumentInterview /></ProtectedRoute>} />
          <Route path="/interview/session" element={<ProtectedRoute><InterviewSession /></ProtectedRoute>} />
          <Route path="/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </Router>
    </QuizProvider>
  );
}

export default App;
