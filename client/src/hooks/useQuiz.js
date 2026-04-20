import { useContext } from 'react';
import { QuizContext } from '../context/QuizContext';

const useQuiz = () => useContext(QuizContext);

export default useQuiz;
