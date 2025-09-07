import React, { useState, useEffect } from "react";
import { Layout, Card, Button, Input, Alert } from "@stellar/design-system";
import { useWallet } from "../hooks/useWallet";
import { 
  getUserPosition, 
  getUserBalances, 
  depositKaleForRedemption,
  redeemFKaleForKale 
} from "../lib/soroban";

interface UserPosition {
  fkale_amount: number;
  xlm_locked: number;
  created_at: number;
  maturity_date: number;
  kale_delivered: number;
  status: number; // 0=active, 1=redeemed, 2=liquidated
}

const RedeemKale: React.FC = () => {
  const { address } = useWallet();
  const [kaleDepositAmount, setKaleDepositAmount] = useState('');
  const [fkaleRedeemAmount, setFkaleRedeemAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [balances, setBalances] = useState({ xlm: 0, kale: 0, fkale: 0 });
  const [loading, setLoading] = useState(true);

  // Load real data from contracts
  useEffect(() => {
    if (address) {
      loadData();
    }
  }, [address]);

  const loadData = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const [position, userBalances] = await Promise.all([
        getUserPosition(address),
        getUserBalances(address)
      ]);
      
      setUserPosition(position);
      setBalances(userBalances);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDepositKale = async () => {
    if (!address) {
      setError("Please connect your wallet");
      return;
    }

    if (!kaleDepositAmount || parseFloat(kaleDepositAmount) <= 0) {
      setError("Please enter a valid KALE amount");
      return;
    }

    if (parseFloat(kaleDepositAmount) > balances.kale) {
      setError("Insufficient KALE balance");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await depositKaleForRedemption(address, parseFloat(kaleDepositAmount));
      
      if (result.success) {
        setSuccess(`Successfully deposited ${kaleDepositAmount} KALE! This KALE is now available for fKALE redemption.`);
        setKaleDepositAmount('');
        
        // Reload data
        await loadData();
      } else {
        setError(result.error || "Failed to deposit KALE");
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deposit KALE");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeemFKale = async () => {
    if (!address) {
      setError("Please connect your wallet");
      return;
    }

    if (!fkaleRedeemAmount || parseFloat(fkaleRedeemAmount) <= 0) {
      setError("Please enter a valid fKALE amount");
      return;
    }

    if (parseFloat(fkaleRedeemAmount) > balances.fkale) {
      setError("Insufficient fKALE balance");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await redeemFKaleForKale(address, parseFloat(fkaleRedeemAmount));
      
      if (result.success) {
        setSuccess(`Successfully redeemed ${fkaleRedeemAmount} fKALE for ${fkaleRedeemAmount} KALE!`);
        setFkaleRedeemAmount('');
        
        // Reload data
        await loadData();
      } else {
        setError(result.error || "Failed to redeem fKALE");
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to redeem fKALE");
    } finally {
      setIsLoading(false);
    }
  };

  const daysUntilMaturity = userPosition 
    ? Math.ceil((userPosition.maturity_date - Date.now() / 1000) / 86400)
    : 0;

  if (!address) {
    return (
      <Layout.Content>
        <Layout.Inset>
          <Card style={{ padding: "2rem", textAlign: "center" }}>
            <h2>Connect Wallet</h2>
            <p>Please connect your wallet to redeem KALE tokens.</p>
          </Card>
        </Layout.Inset>
      </Layout.Content>
    );
  }

  return (
    <Layout.Content>
      <Layout.Inset>
        <h1>🌾 Redeem KALE</h1>
        <p style={{ marginBottom: "2rem", color: "#666" }}>
          Deposit KALE for redemption or redeem your fKALE tokens for KALE at a 1:1 ratio.
        </p>

        {error && (
          <Alert variant="error" style={{ marginBottom: "1rem" }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" style={{ marginBottom: "1rem" }}>
            {success}
          </Alert>
        )}

        {/* Loading State */}
        {loading && address && (
          <Card style={{ padding: "2rem", marginBottom: "2rem", textAlign: "center" }}>
            <div>Loading your position and balances...</div>
          </Card>
        )}

        {/* Balance Display */}
        {!loading && address && (
          <Card style={{ padding: "1.5rem", marginBottom: "2rem", backgroundColor: "#f8f9fa" }}>
            <h3>Your Balances</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
              <div>
                <strong>XLM:</strong>
                <div style={{ fontSize: "1.2rem", color: "#2d5a2d" }}>{balances.xlm.toFixed(2)}</div>
              </div>
              <div>
                <strong>KALE:</strong>
                <div style={{ fontSize: "1.2rem", color: "#2d5a2d" }}>{balances.kale.toFixed(2)}</div>
              </div>
              <div>
                <strong>fKALE:</strong>
                <div style={{ fontSize: "1.2rem", color: "#2d5a2d" }}>{balances.fkale.toFixed(2)}</div>
              </div>
            </div>
          </Card>
        )}

        {/* User Position Overview */}
        {!loading && userPosition && (
          <Card style={{ padding: "2rem", marginBottom: "2rem", backgroundColor: "#f8f9fa" }}>
            <h3>Your Position</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <div>
                <strong>fKALE Minted:</strong>
                <div style={{ fontSize: "1.2rem", color: "#2d5a2d" }}>{userPosition.fkale_amount.toFixed(2)}</div>
              </div>
              <div>
                <strong>XLM Locked:</strong>
                <div style={{ fontSize: "1.2rem", color: "#2d5a2d" }}>{userPosition.xlm_locked.toFixed(2)} XLM</div>
              </div>
              <div>
                <strong>KALE Delivered:</strong>
                <div style={{ fontSize: "1.2rem", color: "#2d5a2d" }}>{userPosition.kale_delivered.toFixed(2)}</div>
              </div>
              <div>
                <strong>Maturity:</strong>
                <div style={{ fontSize: "1.2rem", color: daysUntilMaturity > 0 ? "#856404" : "#2d5a2d" }}>
                  {daysUntilMaturity > 0 ? `${daysUntilMaturity} days` : "Matured"}
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: "1rem" }}>
              <div style={{ 
                padding: "0.5rem 1rem", 
                borderRadius: "20px", 
                backgroundColor: userPosition.kale_delivered >= userPosition.fkale_amount ? "#d4edda" : "#fff3cd",
                color: userPosition.kale_delivered >= userPosition.fkale_amount ? "#155724" : "#856404",
                display: "inline-block",
                fontSize: "0.9rem",
                fontWeight: "bold"
              }}>
                {userPosition.kale_delivered >= userPosition.fkale_amount 
                  ? "✅ Fully Backed" 
                  : `⚠️ Need ${(userPosition.fkale_amount - userPosition.kale_delivered).toFixed(2)} more KALE`}
              </div>
            </div>
          </Card>
        )}

        {/* No Position Message */}
        {!loading && address && !userPosition && (
          <Card style={{ padding: "2rem", marginBottom: "2rem", textAlign: "center", backgroundColor: "#f8f9fa" }}>
            <h3>No Position Found</h3>
            <p style={{ color: "#666" }}>
              You don't have an active fKALE position. Visit the "Buy fKALE" page to create one.
            </p>
          </Card>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          {/* Deposit KALE Section */}
          <Card style={{ padding: "2rem" }}>
            <h3>1. Deposit KALE for Redemption</h3>
            <p style={{ color: "#666", marginBottom: "1.5rem" }}>
              Deposit KALE tokens to make them available for fKALE redemption by anyone.
            </p>
            
            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="kaleDepositAmount" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                KALE Amount
              </label>
              <Input
                id="kaleDepositAmount"
                type="number"
                placeholder="1000"
                value={kaleDepositAmount}
                onChange={(e) => {
                  setKaleDepositAmount(e.target.value);
                  setError(null);
                  setSuccess(null);
                }}
                disabled={isLoading}
                min="0"
                step="1"
              />
              <small style={{ color: "#666" }}>KALE tokens to deposit</small>
            </div>

            <Button
              variant="primary"
              onClick={handleDepositKale}
              disabled={!kaleDepositAmount || isLoading}
              style={{ width: "100%" }}
            >
              {isLoading ? "Depositing..." : "Deposit KALE"}
            </Button>

            <div style={{ 
              marginTop: "1rem", 
              padding: "1rem", 
              backgroundColor: "#e7f5e7", 
              borderRadius: "8px"
            }}>
              <small style={{ color: "#2d5a2d" }}>
                💡 <strong>Tip:</strong> Deposit KALE equal to your fKALE position to secure your XLM for withdrawal after maturity.
              </small>
            </div>
          </Card>

          {/* Redeem fKALE Section */}
          <Card style={{ padding: "2rem" }}>
            <h3>2. Redeem fKALE for KALE</h3>
            <p style={{ color: "#666", marginBottom: "1.5rem" }}>
              Burn your fKALE tokens to receive KALE at a 1:1 ratio.
            </p>

            <div style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label htmlFor="fkaleRedeemAmount" style={{ fontWeight: "bold" }}>
                  fKALE Amount
                </label>
                <small style={{ color: "#666" }}>
                  Balance: {balances.fkale.toFixed(2)}
                </small>
              </div>
              <Input
                id="fkaleRedeemAmount"
                type="number"
                placeholder="1000"
                value={fkaleRedeemAmount}
                onChange={(e) => {
                  setFkaleRedeemAmount(e.target.value);
                  setError(null);
                  setSuccess(null);
                }}
                disabled={isLoading}
                min="0"
                step="1"
              />
            </div>

            <Button
              variant="primary"
              onClick={handleRedeemFKale}
              disabled={!fkaleRedeemAmount || isLoading}
              style={{ width: "100%" }}
            >
              {isLoading ? "Redeeming..." : "Redeem fKALE → KALE"}
            </Button>

            <div style={{ 
              marginTop: "1rem", 
              padding: "1rem", 
              backgroundColor: "#f8f9fa", 
              borderRadius: "8px"
            }}>
              <small style={{ color: "#666" }}>
                <strong>Exchange Rate:</strong> 1 fKALE = 1 KALE<br/>
                You'll receive {fkaleRedeemAmount || '0'} KALE for {fkaleRedeemAmount || '0'} fKALE
              </small>
            </div>
          </Card>
        </div>

        {/* Info Section */}
        <Card style={{ marginTop: "2rem", padding: "2rem", backgroundColor: "#f8f9fa" }}>
          <h3>How Redemption Works</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
            <div>
              <h4>Depositing KALE</h4>
              <ul style={{ lineHeight: "1.6", paddingLeft: "1.5rem" }}>
                <li>Deposit KALE to make it available for redemption</li>
                <li>Anyone can redeem fKALE against your deposited KALE</li>
                <li>Deposit enough to cover your fKALE position</li>
                <li>Required to withdraw your locked XLM after maturity</li>
              </ul>
            </div>
            <div>
              <h4>Redeeming fKALE</h4>
              <ul style={{ lineHeight: "1.6", paddingLeft: "1.5rem" }}>
                <li>Burn fKALE tokens to receive KALE (1:1 ratio)</li>
                <li>Available anytime if contract has KALE</li>
                <li>No time restrictions or penalties</li>
                <li>Instant settlement on-chain</li>
              </ul>
            </div>
          </div>
        </Card>
      </Layout.Inset>
    </Layout.Content>
  );
};

export default RedeemKale;
