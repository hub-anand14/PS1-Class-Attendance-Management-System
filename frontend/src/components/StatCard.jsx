import React from 'react';

export default function StatCard({ title, value, subtitle, isPercentage = false }) {
  return (
    <div className="stat-card">
      <div className="stat-card-title">{title}</div>
      <div className="stat-card-value">
        {value}
        {isPercentage ? '%' : ''}
      </div>
      {subtitle && <div className="stat-card-subtitle">{subtitle}</div>}
    </div>
  );
}
