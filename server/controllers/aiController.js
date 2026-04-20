import Groq from 'groq-sdk';

export const askFollowUp = async (req, res) => {
  try {
    const { question, answer, topic, difficulty } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ message: 'Question and answer are required' });
    }

    const interviewer = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const instructions = `You are a technical interviewer conducting a ${difficulty || 'medium'} difficulty interview on ${topic || 'computer science'}.
    
Generate a relevant follow-up question based on the candidate's answer. The follow-up should:
1. Probe deeper into specific points mentioned in their answer
2. Test understanding of related concepts
3. Be concise (1-2 sentences)
4. Be technically accurate
5. Match the difficulty level

Return ONLY the follow-up question as plain text, no additional commentary.`;

    const context = `Original question: ${question}\n\nCandidate's answer: ${answer}\n\nGenerate a relevant follow-up question.`;

    const result = await interviewer.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: instructions },
        { role: 'user', content: context },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const followUpQuestion = result.choices[0]?.message?.content?.trim() || null;

    res.json({ followUpQuestion });
  } catch (error) {
    console.error('Groq API error:', error);
    res.status(500).json({ 
      message: 'Failed to generate follow-up question',
      error: error.message 
    });
  }
};
