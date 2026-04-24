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
    const personalityPrompt = personalityPrompts[personality] || '';
    const companyStyle = companyPrompts[company] || '';

    const systemPrompt = `${base} ${personalityPrompt} ${companyStyle}

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
          content: `You are a strict technical interviewer. Ask ONE deep follow-up question on the concept given.
Rules:
- Go deeper technically on that exact concept
- Be very specific, not general
- 1 sentence only
- Do not introduce new topics
- Return ONLY the question, nothing else`
        },
        {
          role: 'user',
          content: `The candidate was asked: "${lastQuestion}"\n\nThey mentioned: "${picked}"\n\nAsk one deep technical follow-up question specifically about this.`
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

    const systemPrompt = `You are a technical interviewer evaluating a candidate's answer.

Provide a JSON response with this exact structure:
{
  "overall": number (1-10),
  "feedback": string (brief constructive feedback),
  "strengths": array of strings,
  "improvements": array of strings,
  "betterAnswer": string (a better version of the answer)
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
    } catch {
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