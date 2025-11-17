import {
  TransactionBuilder,
  Contract,
  Address,
  nativeToScVal,
  scValToNative,
  xdr,
  rpc,
  Horizon,
  Account,
} from "@stellar/stellar-sdk";
import {
  FORWARDS_CONTRACT_ID,
  FKALE_TOKEN_CONTRACT_ID,
  KALE_SAC_ID,
  XLM_SAC_ID,
  xlmToStroops,
  stroopsToXlm,
  kaleToStroops,
  stroopsToKale,
} from "./contracts";
import {
  rpcUrl,
  horizonUrl,
  networkPassphrase,
  stellarNetwork,
} from "../contracts/util";

const server = new rpc.Server(rpcUrl, {
  allowHttp: stellarNetwork === "LOCAL",
});
const horizon = new Horizon.Server(horizonUrl, {
  allowHttp: stellarNetwork === "LOCAL",
});

export interface WalletConnection {
  address: string | null;
  isConnected: boolean;
}

export interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
  data?: unknown;
}

export interface UserPosition {
  user: string;
  fkale_amount: number;
  xlm_locked: number;
  created_at: number;
  maturity_date: number;
  kale_delivered: number;
  status: number; // 0=active, 1=redeemed, 2=liquidated
}

export interface ContractData {
  admin: string;
  exchange_rate: number;
  lock_period_days: number;
}

// Type for contract response data
interface ContractResponse {
  user?: string;
  fkale_amount?: bigint | number;
  xlm_locked?: bigint | number;
  created_at?: bigint | number;
  maturity_date?: bigint | number;
  kale_delivered?: bigint | number;
  status?: number;
  admin?: string;
  exchange_rate?: number;
  lock_period_days?: number;
}

// Helper function to invoke contract with wallet
async function invokeContract(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  userAddress: string,
): Promise<TransactionResult> {
  try {
    const contract = new Contract(contractId);
    // Use Horizon for source account (server.getAccount is RPC; Horizon has getAccount for tx building)
    const sourceAccount = await horizon.loadAccount(userAddress);

    // Build the transaction
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: "100000",
      networkPassphrase: networkPassphrase,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(300)
      .build();

    // Simulate first to check if it would work
    const simulateResult = await server.simulateTransaction(transaction);
    console.log("[soroban] simulateTransaction result:", simulateResult);

    if (rpc.Api.isSimulationError(simulateResult)) {
      return {
        success: false,
        error: `Simulation failed: ${simulateResult.error}`,
      };
    }

    // Get wallet kit from the existing wallet system
    const { wallet } = await import("../util/wallet");

    if (!wallet) {
      return {
        success: false,
        error: "Wallet not connected",
      };
    }

    // Prepare XDR for signing
    let xdrToSign: string;
    if (rpc.Api.isSimulationSuccess(simulateResult)) {
      // Assemble and build a Transaction from the builder
      const assembledBuilder = rpc.assembleTransaction(
        transaction,
        simulateResult,
      );
      const builtTx = assembledBuilder.build();
      xdrToSign = builtTx.toEnvelope().toXDR("base64");
    } else {
      xdrToSign = transaction.toEnvelope().toXDR("base64");
    }

    // Sign and submit the transaction with wallet
    try {
      const { signedTxXdr } = await wallet.signTransaction(xdrToSign, {
        networkPassphrase,
        address: userAddress,
      });
      const submittedTx = await server.sendTransaction(
        TransactionBuilder.fromXDR(signedTxXdr, networkPassphrase),
      );
      console.log("[soroban] sendTransaction response:", submittedTx);

      if (String(submittedTx.status) === "SUCCESS") {
        return {
          success: true,
          hash: submittedTx.hash,
          data: submittedTx,
        };
      } else if (String(submittedTx.status) === "PENDING") {
        // Wait for confirmation
        let result = await server.getTransaction(submittedTx.hash);
        while (String(result.status) === "NOT_FOUND") {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          result = await server.getTransaction(submittedTx.hash);
        }

        if (String(result.status) === "SUCCESS") {
          return {
            success: true,
            hash: submittedTx.hash,
            data: result,
          };
        } else {
          return {
            success: false,
            error: `Transaction failed: ${result.status}`,
          };
        }
      } else {
        const txWithError = submittedTx as unknown as Record<string, unknown>;
        const errDetail = txWithError.error || txWithError.errorResult || "";
        return {
          success: false,
          error: `Transaction submission failed: ${submittedTx.status}${errDetail ? ` - ${typeof errDetail === "string" ? errDetail : ""}` : ""}`,
          data: submittedTx,
        };
      }
    } catch (walletError) {
      return {
        success: false,
        error: `Wallet error: ${walletError instanceof Error ? walletError.message : "Unknown wallet error"}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Helper function for read-only contract calls
async function readContract(
  contractId: string,
  method: string,
  args: xdr.ScVal[] = [],
): Promise<unknown> {
  try {
    console.log(`Reading contract ${contractId}.${method}`, args);
    const contract = new Contract(contractId);

    // Create a dummy account for simulation
    const dummyAccount = new Account(
      "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
      "0",
    );

    // Build transaction for simulation
    const transaction = new TransactionBuilder(dummyAccount, {
      fee: "100",
      networkPassphrase: networkPassphrase,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(300)
      .build();

    // Simulate the transaction
    const result = await server.simulateTransaction(transaction);

    console.log(`Contract ${contractId}.${method} result:`, result);

    if (rpc.Api.isSimulationSuccess(result) && result.result?.retval) {
      const nativeValue: unknown = scValToNative(result.result.retval);
      console.log(`Native value for ${method}:`, nativeValue);
      return nativeValue;
    }

    return null;
  } catch (error) {
    console.error(`Error reading contract ${contractId}.${method}:`, error);
    return null;
  }
}

// Contract interaction functions
export async function buyFKaleTokens(
  userAddress: string,
  xlmAmount: number,
): Promise<TransactionResult> {
  const xlmStroops = xlmToStroops(xlmAmount);

  const args = [
    Address.fromString(userAddress).toScVal(),
    nativeToScVal(xlmStroops, { type: "i128" }),
  ];

  return await invokeContract(
    FORWARDS_CONTRACT_ID,
    "buy_fkale",
    args,
    userAddress,
  );
}

export async function depositKaleForRedemption(
  userAddress: string,
  kaleAmount: number,
): Promise<TransactionResult> {
  const kaleStroops = kaleToStroops(kaleAmount);

  // 1) Approve the forwards contract to spend user's KALE
  // live_until must be >= current ledger sequence
  const latest = await server.getLatestLedger();
  const liveUntil = Number(latest.sequence) + 200000; // ~long-lived approval

  const approveArgs = [
    Address.fromString(userAddress).toScVal(),
    Address.fromString(FORWARDS_CONTRACT_ID).toScVal(),
    nativeToScVal(kaleStroops, { type: "i128" }),
    nativeToScVal(liveUntil, { type: "u32" }),
  ];

  const approveRes = await invokeContract(
    KALE_SAC_ID,
    "approve",
    approveArgs,
    userAddress,
  );
  if (!approveRes.success) {
    return approveRes;
  }

  // 2) Call deposit on forwards
  const depositArgs = [
    Address.fromString(userAddress).toScVal(),
    nativeToScVal(kaleStroops, { type: "i128" }),
  ];

  return await invokeContract(
    FORWARDS_CONTRACT_ID,
    "deposit_kale_for_redemption",
    depositArgs,
    userAddress,
  );
}

export async function redeemFKaleForKale(
  userAddress: string,
  fkaleAmount: number,
): Promise<TransactionResult> {
  const fkaleStroops = kaleToStroops(fkaleAmount); // fKALE has same decimals as KALE

  const args = [
    Address.fromString(userAddress).toScVal(),
    nativeToScVal(fkaleStroops, { type: "i128" }),
  ];

  return await invokeContract(
    FORWARDS_CONTRACT_ID,
    "redeem_fkale",
    args,
    userAddress,
  );
}

export async function withdrawLockedXlm(
  userAddress: string,
): Promise<TransactionResult> {
  const args = [Address.fromString(userAddress).toScVal()];

  return await invokeContract(
    FORWARDS_CONTRACT_ID,
    "withdraw_xlm",
    args,
    userAddress,
  );
}

export async function liquidateUserPosition(
  adminAddress: string,
  userAddress: string,
): Promise<TransactionResult> {
  const args = [
    Address.fromString(adminAddress).toScVal(),
    Address.fromString(userAddress).toScVal(),
  ];

  return await invokeContract(
    FORWARDS_CONTRACT_ID,
    "liquidate_position",
    args,
    adminAddress,
  );
}

// Read-only functions
export async function getUserPosition(
  userAddress: string,
): Promise<UserPosition | null> {
  try {
    const result = (await readContract(
      FORWARDS_CONTRACT_ID,
      "get_user_position",
      [Address.fromString(userAddress).toScVal()],
    )) as ContractResponse | null;

    if (result && typeof result === "object" && "user" in result) {
      return {
        user: String(result.user),
        fkale_amount: stroopsToKale(result.fkale_amount ?? 0),
        xlm_locked: stroopsToXlm(result.xlm_locked ?? 0),
        created_at: Number(result.created_at ?? 0),
        maturity_date: Number(result.maturity_date ?? 0),
        kale_delivered: stroopsToKale(result.kale_delivered ?? 0),
        status: Number(result.status ?? 0),
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching position:", error);
    return null;
  }
}

export async function getUserBalances(userAddress: string): Promise<{
  xlm: number;
  kale: number;
  fkale: number;
}> {
  try {
    console.log(`Getting balances for user: ${userAddress}`);
    console.log(
      `Contract IDs - XLM: ${XLM_SAC_ID}, KALE: ${KALE_SAC_ID}, fKALE: ${FKALE_TOKEN_CONTRACT_ID}`,
    );

    const [xlmBalance, kaleBalance, fkaleBalance] = await Promise.all([
      readContract(XLM_SAC_ID, "balance", [
        Address.fromString(userAddress).toScVal(),
      ]),
      readContract(KALE_SAC_ID, "balance", [
        Address.fromString(userAddress).toScVal(),
      ]),
      readContract(FKALE_TOKEN_CONTRACT_ID, "balance", [
        Address.fromString(userAddress).toScVal(),
      ]),
    ]);

    console.log("Raw balances:", { xlmBalance, kaleBalance, fkaleBalance });

    const result = {
      xlm: xlmBalance ? stroopsToXlm(xlmBalance as number | bigint) : 0,
      kale: kaleBalance ? stroopsToKale(kaleBalance as number | bigint) : 0,
      fkale: fkaleBalance ? stroopsToKale(fkaleBalance as number | bigint) : 0,
    };

    console.log("Converted balances:", result);
    return result;
  } catch (error) {
    console.error("Error fetching balances:", error);
    return { xlm: 0, kale: 0, fkale: 0 };
  }
}

export async function getContractInfo(): Promise<{
  totalKaleAvailable: number;
  exchangeRate: number;
  lockPeriodDays: number;
  admin: string;
}> {
  try {
    const [contractData, totalKale] = await Promise.all([
      readContract(FORWARDS_CONTRACT_ID, "get_contract_data", []),
      readContract(FORWARDS_CONTRACT_ID, "get_total_kale_available", []),
    ]);

    const data = contractData as ContractResponse | null;

    return {
      totalKaleAvailable: totalKale
        ? stroopsToKale(totalKale as number | bigint)
        : 0,
      exchangeRate: Number(data?.exchange_rate ?? 1000),
      lockPeriodDays: Number(data?.lock_period_days ?? 30),
      admin: String(data?.admin ?? ""),
    };
  } catch (error) {
    console.error("Error fetching contract info:", error);
    return {
      totalKaleAvailable: 0,
      exchangeRate: 1000,
      lockPeriodDays: 30,
      admin: "",
    };
  }
}

export async function canWithdrawXlm(userAddress: string): Promise<boolean> {
  const args = [Address.fromString(userAddress).toScVal()];
  const result = await readContract(
    FORWARDS_CONTRACT_ID,
    "can_withdraw_xlm",
    args,
  );
  return Boolean(result);
}

// Network configuration
export function getNetworkConfig() {
  return {
    rpcUrl: rpcUrl,
    networkPassphrase: networkPassphrase,
    contractsDeployed: !!(FKALE_TOKEN_CONTRACT_ID && FORWARDS_CONTRACT_ID),
  };
}

// Check if contracts are deployed
export function areContractsDeployed(): boolean {
  return !!(FKALE_TOKEN_CONTRACT_ID && FORWARDS_CONTRACT_ID);
}
