import React from 'react';

export default function AttendanceBadge({ percentage, status }) {
  if (status !== undefined) {
    const isPresent = status === 'Present';
    return (
      <span className={isPresent ? 'badge badge-present' : 'badge badge-absent'}>
        {status}
      </span>
    );
  }

  const num = Number(percentage) || 0;
  const isSafe = num >= 75;

  return (
    <span className={isSafe ? 'badge badge-safe' : 'badge badge-shortage'}>
      {num.toFixed(1)}%
    </span>
  );
}
