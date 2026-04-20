import React from 'react';

const alphabet = ['A', 'B', 'C', 'D', 'E', 'F'];

const QuestionCard = ({
  question,
  selectedOption,
  onSelect,
  onConfirm,
  currentIndex,
  totalQuestions,
}) => (
  <section className="quiz-card quiz-card--duo">
    <span className="quiz-card__badge">Q{currentIndex + 1}</span>
    <h2>{question.prompt}</h2>

    <div className="quiz-options quiz-options--duo">
      {question.options.map((option, index) => {
        const isSelected = selectedOption === option;

        return (
          <button
            key={option}
            type="button"
            className={`quiz-option quiz-option--duo${isSelected ? ' is-selected' : ''}`}
            onClick={() => onSelect(option)}
          >
            <span className="quiz-option__label">{alphabet[index]}</span>
            <span className="quiz-option__text">{option}</span>
            {isSelected ? (
              <span className="quiz-option__check" aria-hidden="true">
                ✓
              </span>
            ) : null}
          </button>
        );
      })}
    </div>

    <button
      type="button"
      className="button quiz-confirm quiz-confirm--duo"
      onClick={onConfirm}
      disabled={!selectedOption}
    >
      {currentIndex + 1 === totalQuestions ? 'Finish lesson' : 'Submit Answer'}
    </button>
  </section>
);

export default QuestionCard;
