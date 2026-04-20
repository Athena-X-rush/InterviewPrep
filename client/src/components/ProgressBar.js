import React from 'react';

const ProgressBar = ({ progress, variant }) => (
  <div
    className={`progress-shell${variant === 'duo' ? ' progress-shell--duo' : ''}`}
    aria-label={`Quiz progress ${Math.round(progress)} percent`}
  >
    <div className={`progress-track${variant === 'duo' ? ' progress-track--duo' : ''}`}>
      <div className="progress-fill" style={{ width: `${progress}%` }} />
    </div>
    <span>{Math.round(progress)}%</span>
  </div>
);

export default ProgressBar;
