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

  const submitAnswer = () => {
    if (!currentQuestion) {
      return false;
    }

    const finalOption = selectedOption || '';
    const isCorrect = finalOption === currentQuestion.correctAnswer;
    const nextAnswer = {
      questionId: currentQuestion.id,
      question: currentQuestion.prompt,
      selectedOption: finalOption,
      correctAnswer: currentQuestion.correctAnswer,
      explanation: currentQuestion.explanation,
      isCorrect,
    };

    const nextAnswers = [...answers, nextAnswer];
    const nextScore = isCorrect ? score + 1 : score;

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
