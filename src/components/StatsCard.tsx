import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  loading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  loading = false
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'var(--brand-success)';
      case 'down': return 'var(--brand-error)';
      default: return 'var(--text-secondary)';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  return (
    <div
      className={`card animate-fade-in-up ${loading ? 'loading' : ''}`}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: '16px',
        padding: '1.5rem',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        minHeight: '120px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        e.currentTarget.style.borderColor = 'var(--brand-primary)';
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.borderColor = 'var(--border-light)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ 
            margin: 0,
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            fontWeight: '500'
          }}>
            {title}
          </p>
          <p style={{ 
            margin: '0.5rem 0 0 0',
            fontSize: '1.875rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            lineHeight: '1'
          }}>
            {loading ? (
              <span style={{
                background: 'var(--bg-tertiary)',
                borderRadius: '4px',
                width: '80px',
                height: '30px',
                display: 'inline-block'
              }}></span>
            ) : (
              value
            )}
          </p>
        </div>
        {icon && (
          <div style={{
            fontSize: '2rem',
            opacity: 0.7,
            filter: 'grayscale(0.3)'
          }}>
            {icon}
          </div>
        )}
      </div>

      <div style={{ marginTop: '1rem' }}>
        {subtitle && (
          <p style={{ 
            margin: 0,
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)'
          }}>
            {subtitle}
          </p>
        )}
        {trend && trendValue && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            marginTop: '0.25rem'
          }}>
            <span style={{ fontSize: '0.75rem' }}>
              {getTrendIcon()}
            </span>
            <span style={{ 
              fontSize: '0.75rem',
              fontWeight: '600',
              color: getTrendColor()
            }}>
              {trendValue}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
