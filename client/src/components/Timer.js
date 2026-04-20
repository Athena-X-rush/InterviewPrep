import React from 'react';

const Timer = ({ seconds, className = '' }) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const formatted = `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;

  return (
    <div className={`timer-pill${className ? ` ${className}` : ''}`} aria-live="polite">
      <span className="timer-pill__icon" aria-hidden="true">
        ◔
      </span>
      <strong>{formatted}</strong>
    </div>
  );
};

export default Timer;
