import Groq from 'groq-sdk';

export const generateResumeQuestions = async (req, res) => {
  try {
    const { resumeText, role, difficulty, questionCount, personality, company } = req.body;

    if (!resumeText || !role) {
      return res.status(400).json({ message: 'Resume text and role are required' });
    }

    const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const personalityPrompts = {
      strict: `You are a tough, demanding technical interviewer. Challenge every answer. Ask follow-up questions that test depth. Be critical and push for better explanations. Do not accept superficial answers.`,
      friendly: `You are a supportive mentor interviewer. Encourage the candidate. Give helpful hints. Be patient and constructive in your feedback. Make the candidate feel comfortable.`,
      faang: `You are a FAANG-style interviewer. Ask complex, multi-layered questions. Focus on problem-solving approach, not just answers. Expect clear communication and structured thinking.`
    };

    const companyPrompts = {
      google: `Focus on problem-solving, scalability, and system design. Ask questions that test ability to think through complex problems.`,
      amazon: `Ask questions that test leadership principles like "Customer Obsession", "Ownership", "Bias for Action", and "Deliver Results".`,
      meta: `Focus on impact at scale, fast iteration, and building for billions of users. Test ability to handle ambiguity.`,
      startup: `Focus on practical skills, speed of execution, and adaptability. Ask about wearing multiple hats and shipping products.`
    };

    const base = `You are a technical interviewer conducting a ${difficulty || 'medium'} difficulty interview for a ${role} position.`;
    const personalityStyle = personalityPrompts[personality] || '';
    const companyStyle = companyPrompts[company] || '';

    const systemPrompt = `${base} ${personalityStyle} ${companyStyle}

Based on the candidate's resume content below, generate ${questionCount || 8} UNIQUE interview questions. CRITICAL: Each question must be completely different from the others. No duplicates, no similar questions, no variations of the same concept.

Each question should:
1. Be specific to the skills, projects, and experience mentioned in the resume
2. Match the difficulty level (${difficulty || 'medium'})
3. Cover DIFFERENT aspects of the resume
4. Use different question formats (project deep-dive, technical skills, behavioral, scenario-based, "tell me about a time", etc.)
5. Be concise and clear
6. Test understanding of their actual experience

Resume content:
${resumeText}

Return ONLY a JSON array of strings, each string being a question. No additional text or commentary.`;

    const userPrompt = `Role: ${role}\nDifficulty: ${difficulty || 'medium'}\nNumber of questions: ${questionCount || 8}\n\nGenerate ${questionCount || 8} unique interview questions based on the resume.`;

    const aiResponse = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1500,
      temperature: 0.9,
    });

    const raw = aiResponse.choices[0]?.message?.content?.trim() || '[]';

    let questions;
    try {
      questions = JSON.parse(raw);
      if (!Array.isArray(questions)) questions = [raw];
    } catch {
      questions = [raw];
    }

    const result = questions.map((q, i) => ({
      id: `resume-question-${i + 1}`,
      prompt: q,
      guidance: 'Use a structured answer with context, your decision-making, and a concrete outcome.',
    }));

    res.json({ questions: result });

  } catch (err) {
    console.error('Groq API error:', err);
    res.status(500).json({ message: 'Failed to generate questions', error: err.message });
  }
};


export const generateQuestions = async (req, res) => {
  try {
    const { topic, difficulty, questionCount } = req.body;

    if (!topic) {
      return res.status(400).json({ message: 'Topic is required' });
    }

    const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const systemPrompt = `You are a technical interviewer conducting a ${difficulty || 'medium'} difficulty interview on ${topic}.

Generate ${questionCount || 6} UNIQUE interview questions on this topic. Each question must be completely different from the others. No duplicates, no similar questions.

Each question should:
1. Be specific to the topic
2. Match the difficulty level (${difficulty || 'medium'})
3. Cover DIFFERENT aspects of the topic
4. Use different question formats (conceptual, practical, scenario-based, comparison, "what happens if", etc.)
5. Be concise and clear

Return ONLY a JSON array of strings. No additional text or commentary.`;

    const userPrompt = `Topic: ${topic}\nDifficulty: ${difficulty || 'medium'}\nNumber of questions: ${questionCount || 6}\n\nGenerate ${questionCount || 6} unique interview questions.`;

    const aiResponse = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1000,
      temperature: 0.9,
    });

    const raw = aiResponse.choices[0]?.message?.content?.trim() || '[]';

    let questions;
    try {
      questions = JSON.parse(raw);
      if (!Array.isArray(questions)) questions = [raw];
    } catch {
      questions = [raw];
    }

    const result = questions.map((q, i) => ({
      id: `ai-question-${i + 1}`,
      prompt: q,
      guidance: 'Use a structured answer with context, your decision-making, and a concrete outcome.',
    }));

    res.json({ questions: result });

  } catch (err) {
    console.error('Groq API error:', err);
    res.status(500).json({ message: 'Failed to generate questions', error: err.message });
  }
};


export const askFollowUp = async (req, res) => {
  try {
    const { history, topic, difficulty } = req.body;

    if (!history || !Array.isArray(history) || history.length === 0) {
      return res.status(400).json({ message: 'Conversation history is required' });
    }

    const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const lastAnswer = history[history.length - 1].answer;
    const lastQuestion = history[history.length - 1].question;

    const step1 = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `Extract exactly 3 specific technical concepts, technologies, or claims the candidate mentioned in their answer.
Return ONLY a JSON array of 3 strings. No explanation, no markdown, no extra text.
Example output: ["Redis cache eviction policy", "fan-out on write", "vector clocks"]`
        },
        {
          role: 'user',
          content: `Candidate's answer: "${lastAnswer}"\n\nExtract 3 specific technical concepts from this answer.`
        }
      ],
      max_tokens: 100,
      temperature: 0.3,
    });

    let concepts = [];
    try {
      const text = step1.choices[0]?.message?.content?.trim() || '[]';
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      concepts = JSON.parse(cleaned);
      if (!Array.isArray(concepts) || concepts.length === 0) throw new Error('empty');
    } catch {
      concepts = [lastAnswer.slice(0, 100)];
    }

    const picked = concepts[0];

    const step2 = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a strict technical interviewer. Ask ONE follow-up question on the concept given.
Rules:
- Stay at the same difficulty level as the original question — do not go deeper into advanced internals
- Ask about practical understanding, not compiler internals, bytecode, or JVM specifics unless the candidate explicitly mentioned those things
- Be specific to what the candidate said, not generic
- 1 sentence only
- Do not introduce new topics the candidate did not mention
- Return ONLY the question, nothing else`
        },
        {
          role: 'user',
          content: `The original question difficulty is: ${difficulty || 'medium'}\n\nThe candidate was asked: "${lastQuestion}"\n\nThey mentioned: "${picked}"\n\nAsk one follow-up question at the same difficulty level about this specific concept.`
        }
      ],
      max_tokens: 100,
      temperature: 0.5,
    });

    const followUpQuestion = step2.choices[0]?.message?.content?.trim() || null;

    res.json({ followUpQuestion });

  } catch (err) {
    console.error('Groq API error:', err);
    res.status(500).json({ message: 'Failed to generate follow-up question', error: err.message });
  }
};


export const generateDocumentQuestions = async (req, res) => {
  try {
    const { documentText, role, difficulty, questionCount, personality, company } = req.body;

    if (!documentText || !role) {
      return res.status(400).json({ message: 'Document text and role are required' });
    }

    const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const personalityPrompts = {
      strict: `You are a tough, demanding technical interviewer. Challenge every answer. Ask follow-up questions that test depth. Be critical and push for better explanations. Do not accept superficial answers.`,
      friendly: `You are a supportive mentor interviewer. Encourage the candidate. Give helpful hints. Be patient and constructive in your feedback. Make the candidate feel comfortable.`,
      faang: `You are a FAANG-style interviewer. Ask complex, multi-layered questions. Focus on problem-solving approach, not just answers. Expect clear communication and structured thinking.`
    };

    const companyPrompts = {
      google: `Focus on problem-solving, scalability, and system design. Ask questions that test ability to think through complex problems.`,
      amazon: `Ask questions that test leadership principles like "Customer Obsession", "Ownership", "Bias for Action", and "Deliver Results".`,
      meta: `Focus on impact at scale, fast iteration, and building for billions of users. Test ability to handle ambiguity.`,
      startup: `Focus on practical skills, speed of execution, and adaptability. Ask about wearing multiple hats and shipping products.`
    };

    const base = `You are a technical interviewer conducting a ${difficulty || 'medium'} difficulty interview for a ${role} position.`;
    const personalityStyle = personalityPrompts[personality] || '';
    const companyStyle = companyPrompts[company] || '';

    const systemPrompt = `${base} ${personalityStyle} ${companyStyle}

Based on the study document content below, generate ${questionCount || 8} UNIQUE interview questions. Each question must be completely different from the others. No duplicates, no similar questions.

Each question should:
1. Be specific to the concepts and topics in the document
2. Match the difficulty level (${difficulty || 'medium'})
3. Cover DIFFERENT aspects of the document
4. Use different question formats (conceptual, practical, scenario-based, comparison, etc.)
5. Be concise and clear

Document content:
${documentText}

Return ONLY a JSON array of strings. No additional text or commentary.`;

    const userPrompt = `Role: ${role}\nDifficulty: ${difficulty || 'medium'}\nNumber of questions: ${questionCount || 8}\n\nGenerate ${questionCount || 8} unique interview questions based on the document.`;

    const aiResponse = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1500,
      temperature: 0.9,
    });

    const raw = aiResponse.choices[0]?.message?.content?.trim() || '[]';

    let questions;
    try {
      questions = JSON.parse(raw);
      if (!Array.isArray(questions)) questions = [];
    } catch {
      questions = [];
    }

    const result = questions.map((q, i) => ({
      id: `document-question-${i + 1}`,
      prompt: q,
    }));

    res.json({ questions: result });

  } catch (err) {
    console.error('Groq API error:', err);
    res.status(500).json({ message: 'Failed to generate questions', error: err.message });
  }
};


export const evaluateAnswer = async (req, res) => {
  try {
    const { question, answer, topic } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ message: 'Question and answer are required' });
    }

    const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const systemPrompt = `You are a strict technical interviewer evaluating a candidate's answer.

Scoring rules:
- If the answer is identical to the question or just repeats it: score 1
- If the answer is mostly the question with minor changes: score 2
- If the answer is too short or vague: score 2-4
- If the answer shows understanding but lacks depth: score 5-6
- If the answer is good with clear explanation: score 7-8
- If the answer is excellent with deep insight: score 9-10

IMPORTANT: Check if the answer text is the same as or very similar to the question text. If so, give score 1 or 2.

Provide a JSON response with this exact structure:
{
  "overall": number (1-10),
  "feedback": string (brief constructive feedback),
  "strengths": array of strings,
  "improvements": array of strings,
  "betterAnswer": string (MUST be a string, not an array) — write this as numbered points only, each on its own line. Follow this exact format:
1. First point here
2. Second point here
3. Third point here
Example: show a short concrete example here if the question involves code or implementation

CRITICAL: betterAnswer MUST be a string type, not an array. Use newline characters \\n between points.
}

Return ONLY the JSON. No markdown, no backticks, no extra text.`;

    const userPrompt = `Question: ${question}\n\nCandidate's answer: ${answer}\n\nTopic: ${topic || 'general'}\n\nEvaluate this answer.`;

    const aiResponse = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const raw = aiResponse.choices[0]?.message?.content?.trim() || '{}';

    let evaluation;
    try {
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      evaluation = JSON.parse(cleaned);
    } catch (err) {
      evaluation = {
        overall: 5,
        feedback: 'Could not parse AI evaluation.',
        strengths: [],
        improvements: []
      };
    }

    res.json(evaluation);

  } catch (err) {
    console.error('Groq API error:', err);
    res.status(500).json({ message: 'Failed to evaluate answer', error: err.message });
  }
};


export const generateQuizQuestions = async (req, res) => {
  try {
    const { topic, difficulty, questionCount } = req.body;

    if (!topic) {
      return res.status(400).json({ message: 'Topic is required' });
    }

    const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const systemPrompt = `You are a quiz creator generating multiple-choice questions for a ${difficulty || 'medium'} difficulty quiz on ${topic}.

Generate ${questionCount || 5} UNIQUE multiple-choice questions. Each question must be completely different. No duplicates.

Each question must have:
- A clear question text
- 4 options (A, B, C, D) — all plausible but only one correct
- The correct option letter
- A brief explanation of why the answer is correct

Return ONLY a JSON array with this exact structure, no markdown, no backticks:
[
  {
    "question": "string",
    "options": ["A: option1", "B: option2", "C: option3", "D: option4"],
    "correctAnswer": "A",
    "explanation": "string"
  }
]`;

    const userPrompt = `Topic: ${topic}\nDifficulty: ${difficulty || 'medium'}\nNumber of questions: ${questionCount || 5}\n\nGenerate ${questionCount || 5} unique multiple-choice questions.`;

    const aiResponse = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.9,
    });

    const raw = aiResponse.choices[0]?.message?.content?.trim() || '[]';

    let questions;
    try {
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      questions = JSON.parse(cleaned);
      if (!Array.isArray(questions)) questions = [];
    } catch {
      questions = [];
    }

    const result = questions.map((q, i) => ({
      id: `quiz-question-${i + 1}`,
      prompt: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    }));

    res.json({ questions: result });

  } catch (err) {
    console.error('Groq API error:', err);
    res.status(500).json({ message: 'Failed to generate questions', error: err.message });
  }
};


export const generateStudyPlan = async (req, res) => {
  try {
    const { sessionData } = req.body;

    if (!sessionData) {
      return res.status(400).json({ message: 'Session data is required' });
    }

    const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const step1 = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are analyzing interview performance. Look at the questions, answers, and scores.
Find the topics where the candidate struggled (score below 6).
Return ONLY a JSON array of objects. No markdown, no backticks, no extra text.

Each object must have:
- topic: string (the BROAD skill they need to improve — e.g. "Method Overriding in OOP" not "dynamic method dispatch bytecode invokevirtual". Keep it simple and human-readable, not a copy of the question)
- why: string (one sentence — what specifically they got wrong or missed in their answer)
- score: number (their score out of 10)

Example:
[
  { "topic": "React useState", "why": "Did not explain how state updates trigger re-renders", "score": 4 },
  { "topic": "CSS Flexbox", "why": "Confused flex-grow and flex-shrink behavior", "score": 3 }
]`
        },
        {
          role: 'user',
          content: `Here is the interview session data:\n${JSON.stringify(sessionData, null, 2)}\n\nFind the weak topics. Remember: topic must be a broad readable skill name, not a copy of the question text.`
        }
      ],
      max_tokens: 400,
      temperature: 0.3,
    });

    let weakTopics = [];
    try {
      const text = step1.choices[0]?.message?.content?.trim() || '[]';
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      weakTopics = JSON.parse(cleaned);
      if (!Array.isArray(weakTopics)) weakTopics = [];
    } catch {
      weakTopics = [];
    }

    if (weakTopics.length === 0) {
      return res.json({ days: [] });
    }

    const topicsToStudy = weakTopics.slice(0, 3);
    const topicList = topicsToStudy.map((t, i) => `Day ${i + 1}: ${t.topic}`).join('\n');

    const step2 = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a study plan generator. Generate a day-by-day study plan.

CRITICAL RULES FOR URLS:
- resources must only use these reading/docs domains: react.dev, developer.mozilla.org, docs.python.org, javascript.info, web.dev, nodejs.org, docs.github.com, typescriptlang.org, nextjs.org, expressjs.com, mongodb.com/docs, postgresql.org/docs, redis.io/docs
- practice must only use these hands-on coding domains: codepen.io, jsfiddle.net, exercism.org — these are places where the user can actually write and run code
- Do NOT use docs sites for practice
- Do NOT use coding sites for resources
- Do NOT make up URLs
- Do NOT use generic urls like "https://example.com"

Return ONLY a JSON array. No markdown, no backticks, no extra text.
Each item in the array must be a day object with this exact shape:
{
  "day": number,
  "topic": string,
  "why": string (one sentence — why this is in their plan, reference what they got wrong),
  "duration": string (like "1-2 hrs"),
  "resources": [
    { "label": string, "url": string, "type": "docs" or "video" or "article" }
  ],
  "practice": { "label": string, "url": string }
}`
        },
        {
          role: 'user',
          content: `The candidate struggled with these topics:\n${topicList}\n\nWeak topic details:\n${JSON.stringify(topicsToStudy, null, 2)}\n\nGenerate the day-by-day study plan JSON array.`
        }
      ],
      max_tokens: 1000,
      temperature: 0.4,
    });

    let days = [];
    try {
      const text = step2.choices[0]?.message?.content?.trim() || '[]';
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      days = JSON.parse(cleaned);
      if (!Array.isArray(days)) days = [];
    } catch {
      days = [];
    }

    res.json({ days });

  } catch (err) {
    console.error('Groq API error:', err);
    res.status(500).json({ message: 'Failed to generate study plan', error: err.message });
  }
};


export const detectResumeGaps = async (req, res) => {
  try {
    const { resumeText, role } = req.body;

    if (!resumeText || !role) {
      return res.status(400).json({ message: 'Resume text and role are required' });
    }

    const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const aiResponse = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a resume reviewer. Analyze the resume for a ${role} position and find gaps, weak spots, and missing things.

Return ONLY a JSON array of objects. No markdown, no backticks, no extra text.
Each object must have:
- type: string — either "missing", "weak", or "suggestion"
- text: string — one short sentence describing the gap or suggestion

Keep it to max 6 items. Be specific to the role. Do not be generic.

Example:
[
  { "type": "missing", "text": "No mention of database experience for a backend role" },
  { "type": "weak", "text": "Projects section lacks specific technologies used" },
  { "type": "suggestion", "text": "Add metrics to quantify achievements like users served or performance gains" }
]`
        },
        {
          role: 'user',
          content: `Role: ${role}\n\nResume:\n${resumeText}\n\nFind gaps and suggestions.`
        }
      ],
      max_tokens: 400,
      temperature: 0.4,
    });

    const raw = aiResponse.choices[0]?.message?.content?.trim() || '[]';

    let gaps = [];
    try {
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      gaps = JSON.parse(cleaned);
      if (!Array.isArray(gaps)) gaps = [];
    } catch {
      gaps = [];
    }

    res.json({ gaps });

  } catch (err) {
    console.error('Groq API error:', err);
    res.status(500).json({ message: 'Failed to analyze resume', error: err.message });
  }
};