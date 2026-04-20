import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { buildDocumentInterviewQuestions } from '../data/interviewBank';
import { AuthContext } from '../context/AuthContext';

const DocumentInterview = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [form, setForm] = useState({
    userName: user?.name || 'Learner',
    role: 'Software Engineer',
    difficulty: 'Medium',
    questions: '8 Questions',
    timePerQuestion: '2 minutes',
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm((current) => ({
      ...current,
      userName: user?.name || 'Learner',
    }));
  }, [user?.name]);

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0];

    if (!nextFile) {
      return;
    }

    if (nextFile.size > 12 * 1024 * 1024) {
      setError('Please upload a file smaller than 12MB.');
      return;
    }

    setFile(nextFile);
    setError('');
  };

  const handleStart = () => {
    if (!file) {
      setError('Upload a question document before starting the interview.');
      return;
    }

    const questionCount = Number(form.questions.split(' ')[0]);
    const timePerQuestionSeconds = Number(form.timePerQuestion.split(' ')[0]) * 60;
    const questions = buildDocumentInterviewQuestions({
      questionCount,
      fileName: file.name,
      role: form.role,
    });

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
  };

  return (
    <div className="interview-shell">
      <main className="interview-page interview-page--wide">
        <Link to="/interview" className="back-link">← Back</Link>

        <section className="interview-title-block">
          <h1>Document interview</h1>
          <p>
            Upload a question file and turn it into a timed interview session with generated reference answers when needed.
          </p>
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
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
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
                  onChange={(event) => setForm((current) => ({ ...current, difficulty: event.target.value }))}
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
                  onChange={(event) => setForm((current) => ({ ...current, questions: event.target.value }))}
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
                onChange={(event) => setForm((current) => ({ ...current, timePerQuestion: event.target.value }))}
              >
                <option>1 minute</option>
                <option>2 minutes</option>
                <option>3 minutes</option>
              </select>
            </label>
          </article>

          <article className="interview-panel">
            <h2>Upload Question Document</h2>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.md"
              className="visually-hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="upload-dropzone upload-dropzone--highlight upload-dropzone--button"
              onClick={() => inputRef.current?.click()}
            >
              <span className="upload-dropzone__icon">📎</span>
              <strong>{file ? file.name : 'Drop your question/answer doc here'}</strong>
              <small>{file ? `${Math.round(file.size / 1024)} KB selected` : 'PDF, DOC, DOCX · Max 12MB'}</small>
            </button>

            <ul className="feature-list">
              <li>Question extraction from uploaded files</li>
              <li>Reference answers when no answer key exists</li>
              <li>Typed or voice-based responses</li>
              <li>Camera-supported interview session</li>
              <li>Per-question evaluation and review</li>
            </ul>
          </article>
        </section>

        {error ? <p className="inline-error inline-error--wide">{error}</p> : null}

        <button type="button" className="button button--primary full-width-cta" onClick={handleStart}>
          Start from document
        </button>
      </main>
    </div>
  );
};

export default DocumentInterview;
