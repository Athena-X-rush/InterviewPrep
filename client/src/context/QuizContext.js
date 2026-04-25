import React, { createContext, useMemo, useState } from 'react';

export const QuizContext = createContext();

const initialConfig = {
  userName: 'Guest',
  topic: '',
  difficulty: 'medium',
  questionCount: 5,
};

export const QuizProvider = ({ children }) => {
  const [status, setStatus] = useState('setup');
  const [quizConfig, setQuizConfig] = useState(initialConfig);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);

  const currentQuestion = questions[currentIndex] || null;
  const progress = questions.length ? ((currentIndex + (status === 'results' ? 1 : 0)) / questions.length) * 100 : 0;

  const resetQuiz = () => {
    setStatus('setup');
    setQuizConfig(initialConfig);
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedOption('');
    setAnswers([]);
    setScore(0);
    setTimeLeft(45);
  };

  const beginGeneration = (config) => {
    setQuizConfig(config);
    setStatus('loading');
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedOption('');
    setAnswers([]);
    setScore(0);
    setTimeLeft(45);
  };

  const startQuiz = (generatedQuestions) => {
    setQuestions(generatedQuestions);
    setCurrentIndex(0);
    setSelectedOption('');
    setAnswers([]);
    setScore(0);
    setTimeLeft(45);
    setStatus('active');
  };

  const chooseOption = (option) => {
    setSelectedOption(option);
  };

  const findSavedAnswer = (questionId) => answers.find((item) => item.questionId === questionId) || null;
  const getOptionCode = (option) => {
    if (!option || typeof option !== 'string') {
      return '';
    }

    const match = option.match(/^([A-Z])\s*:/i);
    return match ? match[1].toUpperCase() : option.trim().toUpperCase();
  };

  const findCorrectOptionText = (question) => {
    if (!question?.options?.length) {
      return question?.correctAnswer || '';
    }

    const code = getOptionCode(question.correctAnswer);
    return question.options.find((option) => getOptionCode(option) === code) || question.correctAnswer;
  };

  const submitAnswer = () => {
    if (!currentQuestion) {
      return false;
    }

    const finalOption = selectedOption || '';
    const finalOptionCode = getOptionCode(finalOption);
    const correctOptionCode = getOptionCode(currentQuestion.correctAnswer);
    const isCorrect = finalOptionCode === correctOptionCode;
    const nextAnswer = {
      questionId: currentQuestion.id,
      question: currentQuestion.prompt,
      selectedOption: finalOption,
      correctAnswer: findCorrectOptionText(currentQuestion),
      explanation: currentQuestion.explanation,
      isCorrect,
    };

    const currentAnswerIndex = answers.findIndex((item) => item.questionId === currentQuestion.id);
    const nextAnswers = currentAnswerIndex >= 0
      ? answers.map((item, index) => (index === currentAnswerIndex ? nextAnswer : item))
      : [...answers, nextAnswer];
    const nextScore = nextAnswers.filter((item) => item.isCorrect).length;

    setAnswers(nextAnswers);
    setScore(nextScore);
    setSelectedOption('');

    if (currentIndex + 1 >= questions.length) {
      setStatus('results');
      setCurrentIndex(questions.length - 1);
      return true;
    }

    setCurrentIndex((value) => value + 1);
    setTimeLeft(45);
    return true;
  };

  const previousQuestion = () => {
    if (currentIndex <= 0) {
      return false;
    }

    const nextIndex = currentIndex - 1;
    const previousQuestionItem = questions[nextIndex];
    const savedAnswer = previousQuestionItem ? findSavedAnswer(previousQuestionItem.id) : null;

    setCurrentIndex(nextIndex);
    setSelectedOption(savedAnswer?.selectedOption || '');
    setTimeLeft(45);
    return true;
  };

  const endEarly = () => {
    setStatus('results');
  };

  const value = useMemo(
    () => ({
      status,
      setStatus,
      quizConfig,
      questions,
      currentQuestion,
      currentIndex,
      selectedOption,
      answers,
      score,
      timeLeft,
      progress,
      setTimeLeft,
      beginGeneration,
      startQuiz,
      chooseOption,
      submitAnswer,
      previousQuestion,
      resetQuiz,
      endEarly,
    }),
    [
      answers,
      currentIndex,
      currentQuestion,
      progress,
      questions,
      quizConfig,
      score,
      selectedOption,
      status,
      timeLeft,
    ]
  );

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
};
