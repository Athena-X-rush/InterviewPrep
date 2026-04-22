import Groq from 'groq-sdk';

export const generateResumeQuestions = async (req, res) => {
  try {
    const { resumeText, role, difficulty, questionCount } = req.body;

    if (!resumeText || !role) {
      return res.status(400).json({ message: 'Resume text and role are required' });
    }

    const groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const systemPrompt = `You are a technical interviewer conducting a ${difficulty || 'medium'} difficulty interview for a ${role} position.

Based on the candidate's resume content below, generate ${questionCount || 8} UNIQUE interview questions. CRITICAL: Each question must be completely different from the others. No duplicates, no similar questions, no variations of the same concept.

Each question should:
1. Be specific to the skills, projects, and experience mentioned in the resume
2. Match the difficulty level (${difficulty || 'medium'})
3. Cover DIFFERENT aspects of the resume (e.g., different projects, different skills, different experiences, behavioral vs technical, etc.)
4. Use different question formats (project deep-dive, technical skills, behavioral, scenario-based, "tell me about a time", etc.)
5. Be concise and clear
6. Test understanding of their actual experience

Resume content:
${resumeText}

Return ONLY a JSON array of strings, each string being a question. No additional text or commentary. Ensure ALL questions are unique and cover different aspects of the resume.`;

    const userPrompt = `Role: ${role}\nDifficulty: ${difficulty || 'medium'}\nNumber of questions: ${questionCount || 8}\n\nGenerate ${questionCount || 8} unique interview questions based on the resume.`;

    const aiResponse = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1500,
      temperature: 0.8,
    });

    const responseText = aiResponse.choices[0]?.message?.content?.trim() || '[]';
    let questions;
    
    try {
      questions = JSON.parse(responseText);
      if (!Array.isArray(questions)) {
        questions = [responseText];
      }
    } catch {
      questions = [responseText];
    }

    const formattedQuestions = questions.map((q, index) => ({
      id: `resume-question-${index + 1}`,
      prompt: q,
      guidance: 'Use a structured answer with context, your decision-making, and a concrete outcome.',
    }));

    res.json({ questions: formattedQuestions });
  } catch (error) {
    console.error('Groq API error:', error);
    res.status(500).json({ 
      message: 'Failed to generate questions',
      error: error.message 
    });
  }
};

export const generateQuestions = async (req, res) => {
  try {
    const { topic, difficulty, questionCount } = req.body;

    if (!topic) {
      return res.status(400).json({ message: 'Topic is required' });
    }

    const groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const systemPrompt = `You are a technical interviewer conducting a ${difficulty || 'medium'} difficulty interview on ${topic || 'computer science'}.

Generate ${questionCount || 6} UNIQUE interview questions on this topic. CRITICAL: Each question must be completely different from the others. No duplicates, no similar questions, no variations of the same concept.

Each question should:
1. Be specific to the topic
2. Match the difficulty level (${difficulty || 'medium'})
3. Cover DIFFERENT aspects of the topic (e.g., different subtopics, different concepts, different scenarios, etc.)
4. Use different question formats (conceptual, practical, scenario-based, comparison, "what happens if", etc.)
5. Be concise and clear
6. Test different aspects of the topic

Return ONLY a JSON array of strings, each string being a question. No additional text or commentary. Ensure ALL questions are unique and cover different subtopics.`;

    const userPrompt = `Topic: ${topic}\nDifficulty: ${difficulty || 'medium'}\nNumber of questions: ${questionCount || 6}\n\nGenerate ${questionCount || 6} unique interview questions.`;

    const aiResponse = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1000,
      temperature: 0.8,
    });

    const responseText = aiResponse.choices[0]?.message?.content?.trim() || '[]';
    let questions;
    
    try {
      questions = JSON.parse(responseText);
      if (!Array.isArray(questions)) {
        questions = [responseText];
      }
    } catch {
      questions = [responseText];
    }

    const formattedQuestions = questions.map((q, index) => ({
      id: `ai-question-${index + 1}`,
      prompt: q,
      guidance: 'Use a structured answer with context, your decision-making, and a concrete outcome.',
    }));

    res.json({ questions: formattedQuestions });
  } catch (error) {
    console.error('Groq API error:', error);
    res.status(500).json({ 
      message: 'Failed to generate questions',
      error: error.message 
    });
  }
};

export const askFollowUp = async (req, res) => {
  try {
    const { question, answer, topic, difficulty } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ message: 'Question and answer are required' });
    }

    const groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const systemPrompt = `You are a technical interviewer conducting a ${difficulty || 'medium'} difficulty interview on ${topic || 'computer science'}.
    
Generate a relevant follow-up question based on the candidate's answer. The follow-up should:
1. Probe deeper into specific points mentioned in their answer
2. Test understanding of related concepts
3. Be concise (1-2 sentences)
4. Be technically accurate
5. Match the difficulty level

Return ONLY the follow-up question as plain text, no additional commentary.`;

    const userPrompt = `Original question: ${question}\n\nCandidate's answer: ${answer}\n\nGenerate a relevant follow-up question.`;

    const aiResponse = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const followUpQuestion = aiResponse.choices[0]?.message?.content?.trim() || null;

    res.json({ followUpQuestion });
  } catch (error) {
    console.error('Groq API error:', error);
    res.status(500).json({ 
      message: 'Failed to generate follow-up question',
      error: error.message 
    });
  }
};

export const generateDocumentQuestions = async (req, res) => {
  try {
    const { documentText, role, difficulty, questionCount } = req.body;

    if (!documentText || !role) {
      return res.status(400).json({ message: 'Document text and role are required' });
    }

    const groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const systemPrompt = `You are a technical interviewer conducting a ${difficulty || 'medium'} difficulty interview for a ${role} position.

Based on the study document content below, generate ${questionCount || 8} UNIQUE interview questions. CRITICAL: Each question must be completely different from the others. No duplicates, no similar questions, no variations of the same concept.

Each question should:
1. Be specific to the concepts, topics, and information in the document
2. Match the difficulty level (${difficulty || 'medium'})
3. Cover DIFFERENT aspects of the document (e.g., different sections, different concepts, different topics, different applications, etc.)
4. Use different question formats (conceptual, practical, scenario-based, comparison, "what happens if", etc.)
5. Be concise and clear
6. Test understanding of the document content

Document content:
${documentText}

Return ONLY a JSON array of strings, each string being a question. No additional text or commentary. Ensure ALL questions are unique and cover different aspects of the document.`;

    const userPrompt = `Role: ${role}\nDifficulty: ${difficulty || 'medium'}\nNumber of questions: ${questionCount || 8}\n\nGenerate ${questionCount || 8} unique interview questions based on the document.`;

    const aiResponse = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1500,
      temperature: 0.8,
    });

    const responseText = aiResponse.choices[0]?.message?.content?.trim() || '[]';
    let questions;
    
    try {
      questions = JSON.parse(responseText);
      if (!Array.isArray(questions)) {
        questions = [responseText];
      }
    } catch {
      questions = [responseText];
    }

    const formattedQuestions = questions.map((q, index) => ({
      id: `document-question-${index + 1}`,
      prompt: q,
    }));

    res.json({ questions: formattedQuestions });
  } catch (error) {
    console.error('Groq API error:', error);
    res.status(500).json({ 
      message: 'Failed to generate questions',
      error: error.message 
    });
  }
};

export const evaluateAnswer = async (req, res) => {
  try {
    const { question, answer, topic } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ message: 'Question and answer are required' });
    }

    const groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const systemPrompt = `You are a technical interviewer evaluating a candidate's answer.

Evaluate the answer based on:
1. Relevance to the question
2. Depth of understanding
3. Communication clarity
4. Technical accuracy

Provide a JSON response with this exact structure:
{
  "overall": number (1-10),
  "relevance": number (1-10),
  "depth": number (1-10),
  "communication": number (1-10),
  "feedback": string (brief constructive feedback),
  "strengths": array of strings (what the candidate did well),
  "improvements": array of strings (what could be improved)
}

Return ONLY the JSON, no additional text.`;

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

    const responseText = aiResponse.choices[0]?.message?.content?.trim() || '{}';
    let evaluation;
    
    try {
      evaluation = JSON.parse(responseText);
    } catch {
      evaluation = {
        overall: 5,
        relevance: 5,
        depth: 5,
        communication: 5,
        feedback: 'Could not parse AI evaluation.',
        strengths: [],
        improvements: []
      };
    }

    res.json(evaluation);
  } catch (error) {
    console.error('Groq API error:', error);
    res.status(500).json({ 
      message: 'Failed to evaluate answer',
      error: error.message 
    });
  }
};

export const generateQuizQuestions = async (req, res) => {
  try {
    const { topic, difficulty, questionCount } = req.body;

    if (!topic) {
      return res.status(400).json({ message: 'Topic is required' });
    }

    const groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const systemPrompt = `You are a quiz creator generating multiple-choice questions for a ${difficulty || 'medium'} difficulty quiz on ${topic || 'computer science'}.

Generate ${questionCount || 5} UNIQUE multiple-choice questions. CRITICAL: Each question must be completely different from the others. No duplicates, no similar questions, no variations of the same concept.

Each question should:
1. Be specific to the topic
2. Match the difficulty level (${difficulty || 'medium'})
3. Cover DIFFERENT aspects of the topic (e.g., if topic is OS, cover process management, memory management, file systems, I/O, etc.)
4. Be concise and clear
5. Use different question formats (definition, comparison, scenario, "what happens if", etc.)

Each question must have:
- A clear question text
- 4 options (A, B, C, D) - all plausible but only one correct
- The correct option letter
- A brief explanation of why the answer is correct

Return ONLY a JSON array with this exact structure:
[
  {
    "question": "string",
    "options": ["A: option1", "B: option2", "C: option3", "D: option4"],
    "correctAnswer": "A",
    "explanation": "string"
  }
]

No additional text or commentary. Ensure ALL questions are unique and cover different subtopics.`;

    const userPrompt = `Topic: ${topic}\nDifficulty: ${difficulty || 'medium'}\nNumber of questions: ${questionCount || 5}\n\nGenerate ${questionCount || 5} unique multiple-choice questions.`;

    const aiResponse = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.8,
    });

    const responseText = aiResponse.choices[0]?.message?.content?.trim() || '[]';
    let questions;
    
    try {
      questions = JSON.parse(responseText);
      if (!Array.isArray(questions)) {
        questions = [];
      }
    } catch {
      questions = [];
    }

    const formattedQuestions = questions.map((q, index) => ({
      id: `quiz-question-${index + 1}`,
      prompt: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation
    }));

    res.json({ questions: formattedQuestions });
  } catch (error) {
    console.error('Groq API error:', error);
    res.status(500).json({ 
      message: 'Failed to generate questions',
      error: error.message 
    });
  }
};