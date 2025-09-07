import React from 'react';
import { Button } from '@stellar/design-system';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const { address } = useWallet();

  return (
    <div className="hero">
      <div className="hero-content">
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem' }}>
          <h1 
            className="text-4xl animate-fade-in-up"
            style={{ 
              marginBottom: '1.5rem',
              color: 'var(--text-inverse)',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            fKALE
          </h1>
          <p 
            className="text-xl animate-fade-in-up"
            style={{ 
              marginBottom: '2rem',
              color: 'rgba(255, 255, 255, 0.9)',
              animationDelay: '0.2s',
              fontStyle: 'italic',
              fontSize: '1.5rem'
            }}
          >
            "Trade your unfarmed $KALE"
          </p>
          <p 
            className="text-lg animate-fade-in-up"
            style={{ 
              marginBottom: '3rem',
              color: 'rgba(255, 255, 255, 0.8)',
              animationDelay: '0.4s',
              maxWidth: '600px',
              margin: '0 auto 3rem auto'
            }}
          >
            Lock XLM collateral, mint fKALE tokens at 1000:1 ratio. 
            Keep your XLM exposure while accessing liquidity from future KALE farming rewards.
          </p>
          
          <div 
            className="animate-fade-in-up"
            style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'center',
              flexWrap: 'wrap',
              animationDelay: '0.6s'
            }}
          >
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/buy-fkale')}
              disabled={!address}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '1rem 2rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                borderRadius: '16px',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.3)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              🚀 Start Trading
            </Button>
            
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/redeem-kale')}
              disabled={!address}
              style={{
                background: 'transparent',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '1rem 2rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                borderRadius: '16px',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            >
              🌾 Redeem KALE
            </Button>
          </div>

          {!address && (
            <p 
              className="animate-fade-in-up"
              style={{ 
                marginTop: '2rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.9rem',
                animationDelay: '0.8s'
              }}
            >
              Connect your wallet to get started
            </p>
          )}
        </div>
      </div>

      {/* Floating particles effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none'
      }}>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: '4px',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.3)',
              borderRadius: '50%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `pulse ${2 + Math.random() * 2}s infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSection;
