import React, { useState, useEffect } from "react";
import { Layout, Card, Button, Input, Alert } from "@stellar/design-system";
import { useWallet } from "../hooks/useWallet";
import { 
  getUserPosition, 
  getContractInfo,
  canWithdrawXlm,
  withdrawLockedXlm,
  liquidateUserPosition 
} from "../lib/soroban";

interface UserPosition {
  fkale_amount: number;
  xlm_locked: number;
  created_at: number;
  maturity_date: number;
  kale_delivered: number;
  status: number; // 0=active, 1=redeemed, 2=liquidated
}

interface ContractData {
  admin: string;
  exchange_rate: number;
  lock_period_days: number;
}

const ManagePosition: React.FC = () => {
  const { address } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [liquidationUser, setLiquidationUser] = useState('');
  const [loading, setLoading] = useState(true);
  const [canWithdraw, setCanWithdraw] = useState(false);

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
      const [position, contractInfo, withdrawable] = await Promise.all([
        getUserPosition(address),
        getContractInfo(),
        canWithdrawXlm(address)
      ]);
      
      setUserPosition(position);
      setContractData({
        admin: contractInfo.admin,
        exchange_rate: contractInfo.exchangeRate,
        lock_period_days: contractInfo.lockPeriodDays
      });
      setCanWithdraw(withdrawable);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const canWithdrawXlmLocal = canWithdraw;

  const isMatured = userPosition && Date.now() / 1000 >= userPosition.maturity_date;
  const isAdmin = contractData && address === contractData.admin;
  const daysUntilMaturity = userPosition 
    ? Math.ceil((userPosition.maturity_date - Date.now() / 1000) / 86400)
    : 0;

  const handleWithdrawXlm = async () => {
    if (!address) {
      setError("Please connect your wallet");
      return;
    }

    if (!canWithdrawXlmLocal) {
      setError("Cannot withdraw XLM: position not matured or insufficient KALE delivered");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await withdrawLockedXlm(address);
      
      if (result.success) {
        setSuccess(`Successfully withdrew ${userPosition!.xlm_locked} XLM! Your position is now closed.`);
        
        // Reload data
        await loadData();
      } else {
        setError(result.error || "Failed to withdraw XLM");
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to withdraw XLM");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLiquidatePosition = async () => {
    if (!address) {
      setError("Please connect your wallet");
      return;
    }

    if (!liquidationUser) {
      setError("Please enter a user address to liquidate");
      return;
    }

    if (!isAdmin) {
      setError("Only the contract admin can liquidate positions");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await liquidateUserPosition(address, liquidationUser);
      
      if (result.success) {
        setSuccess(`Successfully liquidated position for ${liquidationUser}. XLM collateral has been transferred to admin.`);
        setLiquidationUser('');
      } else {
        setError(result.error || "Failed to liquidate position");
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to liquidate position");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return { bg: "#e7f5e7", color: "#2d5a2d", text: "Active" };
      case 1: return { bg: "#d4edda", color: "#155724", text: "Redeemed" };
      case 2: return { bg: "#f8d7da", color: "#721c24", text: "Liquidated" };
      default: return { bg: "#f8f9fa", color: "#666", text: "Unknown" };
    }
  };

  if (!address) {
    return (
      <Layout.Content>
        <Layout.Inset>
          <Card style={{ padding: "2rem", textAlign: "center" }}>
            <h2>Connect Wallet</h2>
            <p>Please connect your wallet to manage your position.</p>
          </Card>
        </Layout.Inset>
      </Layout.Content>
    );
  }

  return (
    <Layout.Content>
      <Layout.Inset>
        <h1>⚙️ Manage Position</h1>
        <p style={{ marginBottom: "2rem", color: "#666" }}>
          View your position details and withdraw XLM after maturity. Admins can liquidate defaulted positions.
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
            <div>Loading your position data...</div>
          </Card>
        )}

        {/* Position Details */}
        {!loading && userPosition ? (
          <Card style={{ padding: "2rem", marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3>Your Position</h3>
              <div style={{ 
                padding: "0.5rem 1rem", 
                borderRadius: "20px", 
                backgroundColor: getStatusColor(userPosition.status).bg,
                color: getStatusColor(userPosition.status).color,
                fontSize: "0.9rem",
                fontWeight: "bold"
              }}>
                {getStatusColor(userPosition.status).text}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem", marginBottom: "2rem" }}>
              <div>
                <h4 style={{ margin: "0 0 0.5rem 0", color: "#666" }}>Position Details</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div><strong>fKALE Minted:</strong> {userPosition.fkale_amount.toFixed(2)}</div>
                  <div><strong>XLM Locked:</strong> {userPosition.xlm_locked.toFixed(2)} XLM</div>
                  <div><strong>Exchange Rate:</strong> 1 XLM = {contractData?.exchange_rate || 1000} fKALE</div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: "0 0 0.5rem 0", color: "#666" }}>Timing</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div><strong>Created:</strong> {new Date(userPosition.created_at * 1000).toLocaleDateString()}</div>
                  <div><strong>Maturity:</strong> {new Date(userPosition.maturity_date * 1000).toLocaleDateString()}</div>
                  <div style={{ color: isMatured ? "#2d5a2d" : "#856404" }}>
                    <strong>Status:</strong> {isMatured ? "Matured" : `${daysUntilMaturity} days remaining`}
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: "0 0 0.5rem 0", color: "#666" }}>KALE Delivery</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div><strong>Required:</strong> {userPosition.fkale_amount.toFixed(2)} KALE</div>
                  <div><strong>Delivered:</strong> {userPosition.kale_delivered.toFixed(2)} KALE</div>
                  <div style={{ 
                    color: userPosition.kale_delivered >= userPosition.fkale_amount ? "#2d5a2d" : "#d73527"
                  }}>
                    <strong>Progress:</strong> {userPosition.fkale_amount > 0 ? ((userPosition.kale_delivered / userPosition.fkale_amount) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>
            </div>

            {/* Withdraw XLM Section */}
            <div style={{ 
              padding: "1.5rem", 
              backgroundColor: canWithdrawXlmLocal ? "#e7f5e7" : "#f8f9fa", 
              borderRadius: "8px",
              border: `2px solid ${canWithdrawXlmLocal ? "#2d5a2d" : "#e0e0e0"}`
            }}>
              <h4 style={{ margin: "0 0 1rem 0" }}>Withdraw XLM Collateral</h4>
              
              {canWithdrawXlmLocal ? (
                <div>
                  <p style={{ color: "#2d5a2d", marginBottom: "1rem" }}>
                    ✅ Your position has matured and you've delivered sufficient KALE. You can now withdraw your XLM!
                  </p>
                  <Button
                    variant="primary"
                    onClick={handleWithdrawXlm}
                    disabled={isLoading}
                    style={{ backgroundColor: "#2d5a2d" }}
                  >
                    {isLoading ? "Withdrawing..." : `Withdraw ${userPosition.xlm_locked.toFixed(2)} XLM`}
                  </Button>
                </div>
              ) : (
                <div>
                  <p style={{ color: "#666", marginBottom: "1rem" }}>
                    {!isMatured 
                      ? `⏳ Position matures in ${daysUntilMaturity} days`
                      : userPosition.kale_delivered < userPosition.fkale_amount
                        ? `⚠️ Need ${(userPosition.fkale_amount - userPosition.kale_delivered).toFixed(2)} more KALE to withdraw XLM`
                        : "❌ Position cannot be withdrawn"
                    }
                  </p>
                  <Button
                    variant="secondary"
                    disabled
                    style={{ opacity: 0.5 }}
                  >
                    Withdraw Not Available
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ) : !loading && address ? (
          <Card style={{ padding: "2rem", textAlign: "center", marginBottom: "2rem" }}>
            <h3>No Position Found</h3>
            <p style={{ color: "#666" }}>
              You don't have an active fKALE position. Visit the "Buy fKALE" page to create one.
            </p>
          </Card>
        ) : null}

        {/* Admin Liquidation Panel */}
        {isAdmin && (
          <Card style={{ padding: "2rem", backgroundColor: "#fff8e1", border: "2px solid #ffc107" }}>
            <h3 style={{ color: "#856404" }}>🔨 Admin Liquidation Panel</h3>
            <p style={{ color: "#856404", marginBottom: "1.5rem" }}>
              As the contract admin, you can liquidate positions that have matured but failed to deliver sufficient KALE.
            </p>

            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="liquidationUser" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", color: "#856404" }}>
                User Address to Liquidate
              </label>
              <Input
                id="liquidationUser"
                type="text"
                placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={liquidationUser}
                onChange={(e) => {
                  setLiquidationUser(e.target.value);
                  setError(null);
                  setSuccess(null);
                }}
                disabled={isLoading}
              />
              <small style={{ color: "#856404" }}>
                Enter the Stellar address of the user whose position you want to liquidate
              </small>
            </div>

            <Button
              variant="primary"
              onClick={handleLiquidatePosition}
              disabled={!liquidationUser || isLoading}
              style={{ backgroundColor: "#d73527", borderColor: "#d73527" }}
            >
              {isLoading ? "Liquidating..." : "Liquidate Position"}
            </Button>

            <div style={{ 
              marginTop: "1rem", 
              padding: "1rem", 
              backgroundColor: "#f8d7da", 
              borderRadius: "8px",
              border: "1px solid #f5c6cb"
            }}>
              <strong style={{ color: "#721c24" }}>⚠️ Liquidation Conditions:</strong>
              <ul style={{ color: "#721c24", margin: "0.5rem 0 0 1.5rem", fontSize: "0.9rem" }}>
                <li>Position must be matured (past 30-day lock period)</li>
                <li>User must have failed to deliver sufficient KALE</li>
                <li>XLM collateral will be transferred to admin as compensation</li>
                <li>This action is irreversible</li>
              </ul>
            </div>
          </Card>
        )}

        {/* Contract Information */}
        <Card style={{ marginTop: "2rem", padding: "2rem", backgroundColor: "#f8f9fa" }}>
          <h3>Contract Information</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div>
              <strong>Exchange Rate:</strong>
              <div>{contractData?.exchange_rate || 1000} fKALE per XLM</div>
            </div>
            <div>
              <strong>Lock Period:</strong>
              <div>{contractData?.lock_period_days || 30} days</div>
            </div>
            <div>
              <strong>Admin:</strong>
              <div style={{ fontSize: "0.8rem", fontFamily: "monospace" }}>
                {contractData?.admin ? 
                  `${contractData.admin.slice(0, 8)}...${contractData.admin.slice(-8)}` : 
                  'Loading...'
                }
              </div>
            </div>
            <div>
              <strong>Your Role:</strong>
              <div style={{ 
                color: isAdmin ? "#2d5a2d" : "#666",
                fontWeight: isAdmin ? "bold" : "normal"
              }}>
                {isAdmin ? "Contract Admin" : "User"}
              </div>
            </div>
          </div>
        </Card>
      </Layout.Inset>
    </Layout.Content>
  );
};

export default ManagePosition;
