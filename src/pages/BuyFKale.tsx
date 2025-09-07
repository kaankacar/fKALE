import React, { useState, useEffect } from "react";
import { Layout, Button } from "@stellar/design-system";
import { useWallet } from "../hooks/useWallet";
import { useWalletBalance } from "../hooks/useWalletBalance";
import { buyFKaleTokens, getUserBalances } from "../lib/soroban";
import StatsCard from "../components/StatsCard";

const BuyFKale: React.FC = () => {
  const { address } = useWallet();
  const [xlmAmount, setXlmAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { xlm, isLoading: balanceLoading } = useWalletBalance();
  const [sorobanBalances, setSorobanBalances] = useState({ xlm: 0, kale: 0, fkale: 0 });
  const [sorobanLoading, setSorobanLoading] = useState(false);

  const fkaleAmount = xlmAmount ? (parseFloat(xlmAmount) * 1000).toString() : '0';
  const xlmBalance = parseFloat(xlm.replace(/,/g, '')) || 0;

  // Load Soroban balances
  useEffect(() => {
    if (address) {
      setSorobanLoading(true);
      getUserBalances(address)
        .then(setSorobanBalances)
        .catch(err => console.error('Error loading soroban balances:', err))
        .finally(() => setSorobanLoading(false));
    }
  }, [address]);

  const handleBuyFKale = async () => {
    if (!address) {
      setError("Please connect your wallet");
      return;
    }

    if (!xlmAmount || parseFloat(xlmAmount) <= 0) {
      setError("Please enter a valid XLM amount");
      return;
    }

    if (parseFloat(xlmAmount) > xlmBalance) {
      setError("Insufficient XLM balance");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await buyFKaleTokens(address, parseFloat(xlmAmount));
      
      if (result.success) {
        setSuccess(`Successfully minted ${Number(fkaleAmount).toLocaleString()} fKALE tokens! Your ${xlmAmount} XLM is now locked as collateral for 30 days.`);
        setXlmAmount('');
        
        // Refresh balances
        getUserBalances(address)
          .then(setSorobanBalances)
          .catch(err => console.error('Error refreshing balances:', err));
      } else {
        setError(result.error || "Failed to mint fKALE tokens");
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mint fKALE tokens");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxClick = () => {
    if (xlmBalance > 0.5) {
      // Leave 0.5 XLM for transaction fees
      setXlmAmount((xlmBalance - 0.5).toFixed(2));
    }
  };

  if (!address) {
    return (
      <Layout.Content>
        <Layout.Inset>
          <div className="card animate-fade-in-up" style={{ 
            textAlign: 'center', 
            padding: '4rem',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>🔒</div>
            <h2 style={{ 
              color: 'var(--text-primary)',
              marginBottom: '1rem',
              fontSize: '1.5rem'
            }}>
              Wallet Connection Required
            </h2>
            <p style={{ 
              color: 'var(--text-secondary)',
              marginBottom: '2rem',
              lineHeight: '1.6'
            }}>
              Please connect your Stellar wallet to start minting fKALE tokens and managing your positions.
            </p>
            <Button 
              variant="primary"
              size="md"
              style={{
                background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
                borderRadius: '12px',
                padding: '0.75rem 2rem'
              }}
            >
              Connect Wallet
            </Button>
          </div>
        </Layout.Inset>
      </Layout.Content>
    );
  }

  return (
    <Layout.Content>
      <Layout.Inset>
        {/* Header */}
        <div className="animate-fade-in-up" style={{ 
          textAlign: 'center', 
          marginBottom: '3rem'
        }}>
          <h1 style={{ 
            fontSize: '2.5rem',
            marginBottom: '1rem',
            color: 'var(--text-primary)'
          }}>
            💰 Mint fKALE Tokens
          </h1>
          <p style={{ 
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Lock XLM as 1:1 collateral and receive 1000 fKALE tokens per XLM. 
            Your XLM remains yours - you keep full exposure to price movements.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div 
            className="animate-fade-in-up" 
            style={{ 
              marginBottom: '2rem',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid var(--brand-error)',
              background: 'rgba(220, 53, 69, 0.1)',
              color: 'var(--brand-error)'
            }}
          >
            ❌ {error}
          </div>
        )}

        {success && (
          <div 
            className="animate-fade-in-up" 
            style={{ 
              marginBottom: '2rem',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid var(--brand-success)',
              background: 'rgba(40, 167, 69, 0.1)',
              color: 'var(--brand-success)'
            }}
          >
            ✅ {success}
          </div>
        )}

        <div className="grid grid-cols-2" style={{ gap: '3rem', alignItems: 'start' }}>
          {/* Left Column - Trading Interface */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="card" style={{ padding: '2.5rem' }}>
              <h3 style={{ 
                marginBottom: '2rem',
                color: 'var(--text-primary)',
                fontSize: '1.25rem'
              }}>
                Mint fKALE Tokens
              </h3>

              {/* XLM Input */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  XLM Amount (Collateral)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="xlm-amount"
                    type="number"
                    value={xlmAmount}
                    onChange={(e) => setXlmAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="custom-input"
                    style={{
                      paddingRight: '4rem'
                    }}
                  />
                  <Button
                    variant="tertiary"
                    size="sm"
                    onClick={handleMaxClick}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'var(--brand-primary)',
                      color: 'white',
                      borderRadius: '8px',
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.75rem'
                    }}
                  >
                    MAX
                  </Button>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-tertiary)'
                }}>
                  <span>Available: {xlmBalance.toFixed(2)} XLM</span>
                  <span>≈ ${(xlmBalance * 0.12).toFixed(2)} USD</span>
                </div>
              </div>

              {/* Arrow */}
              <div style={{ 
                textAlign: 'center', 
                margin: '1.5rem 0',
                fontSize: '1.5rem',
                color: 'var(--brand-primary)'
              }}>
                ⬇️
              </div>

              {/* fKALE Output */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ 
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  fKALE Tokens (You Receive)
                </label>
                <div style={{
                  padding: '1rem',
                  fontSize: '1.1rem',
                  borderRadius: '12px',
                  border: '2px solid var(--border-light)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  fontWeight: '600'
                }}>
                  {Number(fkaleAmount).toLocaleString()} fKALE
                </div>
                <div style={{ 
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-tertiary)'
                }}>
                  Rate: 1 XLM = 1,000 fKALE
                </div>
              </div>

              {/* Transaction Details */}
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '1.5rem',
                borderRadius: '12px',
                marginBottom: '2rem',
                border: '1px solid var(--border-light)'
              }}>
                <h4 style={{ 
                  marginBottom: '1rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}>
                  Transaction Summary
                </h4>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem'
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Collateral Locked:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                    {xlmAmount || '0'} XLM
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem'
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>fKALE Minted:</span>
                  <span style={{ color: 'var(--brand-primary)', fontWeight: '600' }}>
                    {Number(fkaleAmount).toLocaleString()}
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem'
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Lock Period:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>30 days</span>
                </div>
                <hr style={{ 
                  margin: '1rem 0', 
                  border: 'none', 
                  borderTop: '1px solid var(--border-light)' 
                }} />
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: '0.875rem'
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Network Fee:</span>
                  <span style={{ color: 'var(--text-primary)' }}>~0.001 XLM</span>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                variant="primary"
                size="md"
                onClick={handleBuyFKale}
                disabled={!xlmAmount || parseFloat(xlmAmount) <= 0 || parseFloat(xlmAmount) > xlmBalance || isLoading}
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: (!xlmAmount || parseFloat(xlmAmount) <= 0 || parseFloat(xlmAmount) > xlmBalance) ? 0.6 : 1
                }}
              >
                {isLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <div className="spinner" style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white' }}></div>
                    Minting fKALE...
                  </span>
                ) : (
                  `🚀 Mint ${Number(fkaleAmount).toLocaleString()} fKALE`
                )}
              </Button>

              <p style={{ 
                marginTop: '1rem',
                fontSize: '0.75rem',
                color: 'var(--text-tertiary)',
                textAlign: 'center',
                lineHeight: '1.4'
              }}>
                Your XLM will be locked as collateral for 30 days. You maintain full price exposure 
                and can withdraw after the lock period + sufficient KALE delivery.
              </p>
            </div>
          </div>

          {/* Right Column - Stats & Info */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {/* Current Balances */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ 
                marginBottom: '1.5rem',
                color: 'var(--text-primary)',
                fontSize: '1.25rem'
              }}>
                Your Balances
              </h3>
              <div className="grid grid-cols-1" style={{ gap: '1rem' }}>
                <StatsCard
                  title="XLM Balance"
                  value={balanceLoading ? '...' : xlmBalance.toFixed(2)}
                  subtitle="Available for collateral"
                  icon="💰"
                  loading={balanceLoading}
                />
                <StatsCard
                  title="fKALE Balance"
                  value={sorobanLoading ? '...' : sorobanBalances.fkale.toLocaleString()}
                  subtitle="Future KALE claims"
                  icon="🌾"
                  loading={sorobanLoading}
                />
                <StatsCard
                  title="KALE Balance"
                  value={sorobanLoading ? '...' : sorobanBalances.kale.toLocaleString()}
                  subtitle="Redeemable tokens"
                  icon="🥬"
                  loading={sorobanLoading}
                />
              </div>
            </div>

            {/* Info Card */}
            <div className="card" style={{ padding: '2rem' }}>
              <h4 style={{ 
                marginBottom: '1.5rem',
                color: 'var(--text-primary)',
                fontSize: '1.1rem'
              }}>
                💡 How It Works
              </h4>
              <div style={{ 
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                lineHeight: '1.6'
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: 'var(--brand-primary)' }}>1. Lock Collateral:</strong><br />
                  Your XLM is locked 1:1 as collateral but remains your asset.
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: 'var(--brand-primary)' }}>2. Mint fKALE:</strong><br />
                  Receive 1000 fKALE tokens for each XLM locked.
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: 'var(--brand-primary)' }}>3. Keep Exposure:</strong><br />
                  You maintain full exposure to XLM price movements.
                </div>
                <div>
                  <strong style={{ color: 'var(--brand-primary)' }}>4. Trade or Hold:</strong><br />
                  Use fKALE for liquidity or hold until KALE redemption.
                </div>
              </div>
            </div>

            {/* Warning */}
            <div style={{
              background: 'rgba(255, 193, 7, 0.1)',
              border: '1px solid var(--brand-warning)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginTop: '2rem'
            }}>
              <h4 style={{ 
                color: 'var(--brand-warning)',
                marginBottom: '0.5rem',
                fontSize: '0.9rem'
              }}>
                ⚠️ Important Notice
              </h4>
              <p style={{ 
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                margin: 0,
                lineHeight: '1.5'
              }}>
                This is an MVP using shared pools. Production version will have individual user pools 
                and advanced risk management features.
              </p>
            </div>
          </div>
        </div>
      </Layout.Inset>
    </Layout.Content>
  );
};

export default BuyFKale;