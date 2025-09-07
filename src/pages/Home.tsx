import React, { useState, useEffect } from "react";
import { Layout, Card, Button } from "@stellar/design-system";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { useWalletBalance } from "../hooks/useWalletBalance";
import HeroSection from "../components/HeroSection";
import StatsCard from "../components/StatsCard";
import { getUserBalances } from "../lib/soroban";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { address } = useWallet();
  const { xlm, isLoading: balanceLoading } = useWalletBalance();
  const [sorobanBalances, setSorobanBalances] = useState({ xlm: 0, kale: 0, fkale: 0 });
  const [sorobanLoading, setSorobanLoading] = useState(false);

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

  return (
    <Layout.Content style={{ padding: 0 }}>
      <HeroSection />
      
      <Layout.Inset style={{ padding: '4rem 2rem' }}>
        {/* Stats Section */}
        {address && (
          <div style={{ marginBottom: '4rem' }}>
            <h2 
              className="text-xl animate-fade-in-up" 
              style={{ 
                textAlign: 'center', 
                marginBottom: '2rem',
                color: 'var(--text-primary)'
              }}
            >
              Your Portfolio
            </h2>
            <div className="grid grid-cols-3" style={{ gap: '1.5rem' }}>
              <StatsCard
                title="XLM Balance"
                value={balanceLoading ? '...' : `${parseFloat(xlm.replace(/,/g, '')).toFixed(2)}`}
                subtitle="Available for collateral"
                icon="💰"
                loading={balanceLoading}
              />
              <StatsCard
                title="fKALE Balance"
                value={sorobanLoading ? '...' : sorobanBalances.fkale.toLocaleString()}
                subtitle="Future KALE tokens"
                icon="🌾"
                trend="neutral"
                trendValue="1:1 KALE ratio"
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
        )}

        {/* Features Grid */}
        <div style={{ marginBottom: '4rem' }}>
          <h2 
            className="text-xl animate-fade-in-up" 
            style={{ 
              textAlign: 'center', 
              marginBottom: '3rem',
              color: 'var(--text-primary)'
            }}
          >
            Platform Features
          </h2>
          
          <div className="grid grid-cols-3" style={{ gap: '2rem' }}>
            <Card 
              className="card animate-fade-in-up"
              style={{ 
                animationDelay: '0.1s',
                textAlign: 'center',
                cursor: 'pointer'
              }}
              onClick={() => address && navigate("/buy-fkale")}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
              <h3 style={{ 
                marginBottom: '1rem', 
                color: 'var(--text-primary)',
                fontSize: '1.25rem'
              }}>
                Mint fKALE
              </h3>
              <p style={{ 
                color: 'var(--text-secondary)', 
                marginBottom: '2rem',
                lineHeight: '1.6'
              }}>
                Lock XLM as 1:1 collateral and receive 1000 fKALE tokens per XLM. 
                Maintain full exposure to XLM price movements.
              </p>
              <div style={{
                background: 'var(--bg-tertiary)',
                padding: '1rem',
                borderRadius: '12px',
                marginBottom: '1.5rem'
              }}>
                <div style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700',
                  color: 'var(--brand-primary)'
                }}>
                  1000:1
                </div>
                <div style={{ 
                  fontSize: '0.875rem',
                  color: 'var(--text-tertiary)'
                }}>
                  fKALE per XLM
                </div>
              </div>
              <Button 
                variant="primary"
                disabled={!address}
                style={{ 
                  width: '100%',
                  background: !address ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
                  borderRadius: '12px'
                }}
              >
                {!address ? 'Connect Wallet' : 'Mint fKALE'}
              </Button>
            </Card>

            <Card 
              className="card animate-fade-in-up"
              style={{ 
                animationDelay: '0.2s',
                textAlign: 'center',
                cursor: 'pointer'
              }}
              onClick={() => address && navigate("/redeem-kale")}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌾</div>
              <h3 style={{ 
                marginBottom: '1rem', 
                color: 'var(--text-primary)',
                fontSize: '1.25rem'
              }}>
                Redeem KALE
              </h3>
              <p style={{ 
                color: 'var(--text-secondary)', 
                marginBottom: '2rem',
                lineHeight: '1.6'
              }}>
                Exchange your fKALE tokens for KALE at a 1:1 ratio when KALE 
                is available in the redemption pool.
              </p>
              <div style={{
                background: 'var(--bg-tertiary)',
                padding: '1rem',
                borderRadius: '12px',
                marginBottom: '1.5rem'
              }}>
                <div style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700',
                  color: 'var(--brand-success)'
                }}>
                  1:1
                </div>
                <div style={{ 
                  fontSize: '0.875rem',
                  color: 'var(--text-tertiary)'
                }}>
                  fKALE to KALE
                </div>
              </div>
              <Button 
                variant="primary"
                disabled={!address}
                style={{ 
                  width: '100%',
                  background: !address ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, var(--brand-success), var(--brand-primary))',
                  borderRadius: '12px'
                }}
              >
                {!address ? 'Connect Wallet' : 'Redeem KALE'}
              </Button>
            </Card>

            <Card 
              className="card animate-fade-in-up"
              style={{ 
                animationDelay: '0.3s',
                textAlign: 'center',
                cursor: 'pointer'
              }}
              onClick={() => address && navigate("/manage-position")}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚙️</div>
              <h3 style={{ 
                marginBottom: '1rem', 
                color: 'var(--text-primary)',
                fontSize: '1.25rem'
              }}>
                Manage Position
              </h3>
              <p style={{ 
                color: 'var(--text-secondary)', 
                marginBottom: '2rem',
                lineHeight: '1.6'
              }}>
                Monitor your collateral position, track maturity dates, and 
                withdraw XLM after the lock period expires.
              </p>
              <div style={{
                background: 'var(--bg-tertiary)',
                padding: '1rem',
                borderRadius: '12px',
                marginBottom: '1.5rem'
              }}>
                <div style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700',
                  color: 'var(--brand-secondary)'
                }}>
                  30d
                </div>
                <div style={{ 
                  fontSize: '0.875rem',
                  color: 'var(--text-tertiary)'
                }}>
                  Lock Period
                </div>
              </div>
              <Button 
                variant="primary"
                disabled={!address}
                style={{ 
                  width: '100%',
                  background: !address ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))',
                  borderRadius: '12px'
                }}
              >
                {!address ? 'Connect Wallet' : 'View Position'}
              </Button>
            </Card>
          </div>
        </div>

        {/* How it Works */}
        <div className="card animate-fade-in-up" style={{ 
          padding: '3rem',
          textAlign: 'center',
          animationDelay: '0.4s'
        }}>
          <h2 style={{ 
            marginBottom: '2rem',
            color: 'var(--text-primary)',
            fontSize: '1.75rem'
          }}>
            How fKALE Works
          </h2>
          
          <div className="grid grid-cols-2" style={{ gap: '3rem', textAlign: 'left' }}>
            <div>
              <h3 style={{ 
                color: 'var(--brand-primary)',
                marginBottom: '1.5rem',
                fontSize: '1.25rem'
              }}>
                🚀 For Liquidity Seekers
              </h3>
              <ol style={{ 
                lineHeight: '1.8',
                color: 'var(--text-secondary)',
                paddingLeft: '1.5rem'
              }}>
                <li><strong>Lock XLM:</strong> Provide 1 XLM as collateral (maintain price exposure)</li>
                <li><strong>Mint fKALE:</strong> Receive 1000 fKALE tokens immediately</li>
                <li><strong>Trade fKALE:</strong> Sell fKALE for immediate liquidity needs</li>
                <li><strong>Withdraw:</strong> Reclaim XLM after 30 days + KALE delivery</li>
              </ol>
            </div>
            
            <div>
              <h3 style={{ 
                color: 'var(--brand-success)',
                marginBottom: '1.5rem',
                fontSize: '1.25rem'
              }}>
                🌾 For KALE Farmers
              </h3>
              <ol style={{ 
                lineHeight: '1.8',
                color: 'var(--text-secondary)',
                paddingLeft: '1.5rem'
              }}>
                <li><strong>Buy fKALE:</strong> Acquire fKALE tokens from the market</li>
                <li><strong>Hold Position:</strong> Wait for KALE delivery to redemption pool</li>
                <li><strong>Redeem:</strong> Exchange fKALE for KALE at 1:1 ratio</li>
                <li><strong>Earn:</strong> Benefit from KALE token appreciation</li>
              </ol>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-secondary)',
            padding: '2rem',
            borderRadius: '16px',
            marginTop: '3rem',
            border: '2px dashed var(--brand-warning)'
          }}>
            <h4 style={{ 
              color: 'var(--brand-warning)',
              marginBottom: '1rem',
              fontSize: '1.1rem'
            }}>
              ⚠️ MVP Notice
            </h4>
            <p style={{ 
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: '1.6'
            }}>
              Current implementation uses a <strong>shared pool system</strong> for demonstration. 
              Production version will feature user-specific pools, dynamic AMM pricing, and advanced risk management.
            </p>
          </div>
        </div>
      </Layout.Inset>
    </Layout.Content>
  );
};

export default Home;