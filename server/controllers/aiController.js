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

Based on the candidate's resume content below, generate ${questionCount || 8} unique interview questions. Each question should:
1. Be specific to the skills, projects, and experience mentioned in the resume
2. Match the difficulty level (${difficulty || 'medium'})
3. Be different from each other (vary the question types: project deep-dive, technical skills, behavioral, scenario-based, etc.)
4. Be concise and clear
5. Test understanding of their actual experience

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

Generate ${questionCount || 6} unique interview questions on this topic. Each question should:
1. Be specific to the topic
2. Match the difficulty level (${difficulty || 'medium'})
3. Be different from each other (vary the question types: conceptual, practical, scenario-based, comparison, etc.)
4. Be concise and clear
5. Test different aspects of the topic

Return ONLY a JSON array of strings, each string being a question. No additional text or commentary.`;

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