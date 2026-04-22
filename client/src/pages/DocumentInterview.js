import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const DocumentInterview = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    userName: user?.name || 'Learner',
    role: 'Software Engineer',
    difficulty: 'Medium',
    questions: '8 Questions',
    timePerQuestion: '2 minutes',
  });
  const [documentText, setDocumentText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleStart = async () => {
    if (!documentText || documentText.trim().length < 50) {
      setError('Please paste your document content first (at least 50 characters).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/ai/generate-document-questions', {
        documentText,
        role: form.role,
        difficulty: form.difficulty,
        questionCount: Number(form.questions.split(' ')[0]),
      });

      const questions = response.data.questions;
      const timePerQuestionSeconds = Number(form.timePerQuestion.split(' ')[0]) * 60;

      navigate('/interview/session', {
        state: {
          modeName: 'Document Mock Interview',
          modeLabel: 'DOCUMENT',
          metaLabel: `${form.role.toUpperCase()} · ${form.difficulty.toUpperCase()}`,
          summaryTopic: form.role,
          summaryDifficulty: form.difficulty.toLowerCase(),
          userName: form.userName.trim() || 'Guest',
          timePerQuestionSeconds,
          questions,
        },
      });
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to generate questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="interview-shell">
      <main className="interview-page interview-page--wide">
        <Link to="/interview" className="back-link">← Back</Link>

        <section className="interview-title-block">
          <h1>Document interview</h1>
        </section>

        <section className="two-panel-layout">
          <article className="interview-panel">
            <h2>Interview Setup</h2>

            <label className="form-group">
              <span>Active User</span>
              <input
                type="text"
                value={form.userName}
                readOnly
              />
            </label>

            <label className="form-group">
              <span>Target Role</span>
              <select
                value={form.role}
                onChange={(e) => set('role', e.target.value)}
              >
                <option>Software Engineer</option>
                <option>Frontend Engineer</option>
                <option>Backend Engineer</option>
                <option>Product Manager</option>
              </select>
            </label>

            <div className="interview-inline-grid">
              <label className="form-group">
                <span>Difficulty</span>
                <select
                  value={form.difficulty}
                  onChange={(e) => set('difficulty', e.target.value)}
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </label>

              <label className="form-group">
                <span>Questions</span>
                <select
                  value={form.questions}
                  onChange={(e) => set('questions', e.target.value)}
                >
                  <option>5 Questions</option>
                  <option>8 Questions</option>
                  <option>10 Questions</option>
                </select>
              </label>
            </div>

            <label className="form-group">
              <span>Time Per Question</span>
              <select
                value={form.timePerQuestion}
                onChange={(e) => set('timePerQuestion', e.target.value)}
              >
                <option>1 minute</option>
                <option>2 minutes</option>
                <option>3 minutes</option>
              </select>
            </label>
          </article>

          <article className="interview-panel">
            <h2>Paste your document</h2>

            <textarea
              className="iresume-textarea"
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              placeholder="Paste your study material, notes, or Q&A content here..."
              rows={15}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'monospace' }}
            />
          </article>
        </section>

        {error ? <p className="inline-error inline-error--wide">{error}</p> : null}

        <button type="button" className="button button--primary full-width-cta" onClick={handleStart} disabled={loading}>
          {loading ? 'Generating questions...' : 'Start from document'}
        </button>
      </main>
    </div>
  );
};

export default DocumentInterview;
