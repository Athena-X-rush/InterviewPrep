const roleFocus = {
  'Software Engineer': ['architecture', 'debugging', 'delivery'],
  'Frontend Engineer': ['accessibility', 'state management', 'performance'],
  'Backend Engineer': ['APIs', 'scalability', 'data consistency'],
  'Data Analyst': ['metrics', 'SQL', 'insight communication'],
  'Product Manager': ['prioritization', 'user impact', 'execution'],
};

const difficultyTone = {
  Easy: 'foundation-level',
  Medium: 'mid-level',
  Hard: 'senior-level',
  'Easy (Junior)': 'foundation-level',
  'Medium (Mid Level)': 'mid-level',
  'Hard (Senior Level)': 'senior-level',
};

const liveTemplates = [
  'Explain the core concepts of {topic} as if you were onboarding a new teammate.',
  'Describe a real project or scenario where {topic} becomes critical and explain your tradeoffs.',
  'What are the most common mistakes engineers make with {topic}, and how would you avoid them?',
  'If performance issues appeared in a system involving {topic}, how would you debug them step by step?',
  'Compare two common approaches in {topic} and tell me when you would prefer each one.',
  'Design a short plan to improve a team\'s understanding of {topic} over the next sprint.',
  'Tell me how you would explain {topic} to both a junior engineer and a hiring manager.',
  'What signals would tell you that your implementation of {topic} is reliable in production?',
];

const resumeTemplates = [
  'Walk me through a project from your resume that best demonstrates your experience with {focus}.',
  'Tell me about a time your role as a {role} required balancing speed and quality.',
  'Which accomplishment on your resume would you highlight first for this {difficulty} interview, and why?',
  'Describe a challenge from one of your projects where you had to improve {focus}.',
  'If I asked a teammate about your strengths as a {role}, what evidence from your resume would they mention?',
  'Choose one resume bullet and expand it into a STAR-format answer with business impact.',
  'What experience in your background best prepares you for stronger ownership in {focus}?',
  'Looking at your resume, where do you think an interviewer would ask the toughest follow-up questions?',
];

const documentTemplates = [
  'Based on the uploaded document, answer the first major question in a structured way.',
  'What patterns or repeated themes do you notice across the uploaded question set?',
  'If one answer were missing from the document, how would you construct a high-quality response?',
  'Which question in the document would likely be hardest for candidates, and why?',
  'Summarize how you would prepare for the document\'s topics in a one-week study plan.',
  'How would you adapt your answer style if the interviewer used the uploaded document as a strict rubric?',
  'Pick one likely technical question from the document and answer it with examples.',
  'If the document contains inconsistent answers, how would you resolve that during an interview?',
];

const takeQuestions = (templates, count, mapper) =>
  templates.slice(0, count).map((template, index) => ({
    id: `interview-${index + 1}`,
    prompt: mapper(template),
    guidance: 'Use a structured answer with context, your decision-making, and a concrete outcome.',
  }));

export const buildLiveInterviewQuestions = ({ topic, difficulty, questionCount }) =>
  takeQuestions(liveTemplates, Number(questionCount), (template) =>
    template.replaceAll('{topic}', topic).replaceAll('{difficulty}', difficultyTone[difficulty] || difficulty.toLowerCase())
  );

export const buildResumeInterviewQuestions = ({ role, difficulty, questionCount, fileName }) => {
  const focusAreas = roleFocus[role] || ['delivery', 'communication', 'execution'];
  let cursor = 0;

  return takeQuestions(resumeTemplates, Number(questionCount), (template) => {
    const focus = focusAreas[cursor % focusAreas.length];
    cursor += 1;

    return template
      .replaceAll('{role}', role)
      .replaceAll('{focus}', focus)
      .replaceAll('{difficulty}', difficultyTone[difficulty] || difficulty.toLowerCase());
  });
};

export const buildDocumentInterviewQuestions = ({ questionCount, fileName, role }) =>
  takeQuestions(documentTemplates, Number(questionCount), (template) =>
    `${template}${role ? ` Target role: ${role}.` : ''}`
  );
