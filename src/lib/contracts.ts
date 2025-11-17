// Contract addresses and configuration
export const KALE_SAC_ID = String(
  import.meta.env.VITE_KALE_SAC_ID ||
    "CAAVU2UQJLMZ3GUZFM56KVNHLPA3ZSSNR4VP2U53YBXFD2GI3QLIVHZZ",
);
export const XLM_SAC_ID = String(
  import.meta.env.VITE_XLM_SAC_ID ||
    "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
);
export const FKALE_TOKEN_CONTRACT_ID = String(
  import.meta.env.VITE_FKALE_TOKEN_CONTRACT_ID ||
    "CC3A4X5YBD7YN2WFRECSQPA3N4JGGWOMSXF7ED5ZCQANMTRVHH6CRHJN",
);
export const FORWARDS_CONTRACT_ID = String(
  import.meta.env.VITE_FORWARDS_CONTRACT_ID ||
    "CDP2A3JLSFR4G3SQWKAYZMRUN7XN5K3AQZ2FY5QFZ3X2T32VLUDHW4ES",
);

export const RPC_URL = String(
  import.meta.env.VITE_PUBLIC_STELLAR_RPC_URL ||
    "https://soroban-testnet.stellar.org",
);
export const NETWORK_PASSPHRASE = String(
  import.meta.env.VITE_PUBLIC_STELLAR_NETWORK_PASSPHRASE ||
    "Test SDF Network ; September 2015",
);

// Contract deployment status
export function getDeploymentStatus() {
  return {
    fkaleToken: !!FKALE_TOKEN_CONTRACT_ID,
    forwardsContract: !!FORWARDS_CONTRACT_ID,
    allDeployed: !!FKALE_TOKEN_CONTRACT_ID && !!FORWARDS_CONTRACT_ID,
  };
}

// Exchange rate constants
export const EXCHANGE_RATE = 1000; // 1000 fKALE per 1 XLM
export const LOCK_PERIOD_DAYS = 30; // 30 days lock period

// Helper functions for amount conversion
export function xlmToStroops(xlm: number): bigint {
  return BigInt(Math.floor(xlm * 10000000)); // 7 decimals
}

export function stroopsToXlm(stroops: number | bigint): number {
  const s = typeof stroops === "bigint" ? Number(stroops) : stroops;
  return s / 10000000;
}

export function kaleToStroops(kale: number): bigint {
  return BigInt(Math.floor(kale * 10000000)); // 7 decimals
}

export function stroopsToKale(stroops: number | bigint): number {
  const s = typeof stroops === "bigint" ? Number(stroops) : stroops;
  return s / 10000000;
}

// Contract method names for reference
export const CONTRACT_METHODS = {
  FKALE_TOKEN: {
    BALANCE: "balance",
    TOTAL_SUPPLY: "total_supply",
    MINT: "mint",
    BURN: "burn",
    TRANSFER: "transfer",
    APPROVE: "approve",
  },
  FORWARDS: {
    BUY_FKALE: "buy_fkale",
    DEPOSIT_KALE: "deposit_kale_for_redemption",
    REDEEM_FKALE: "redeem_fkale",
    WITHDRAW_XLM: "withdraw_xlm",
    LIQUIDATE: "liquidate_position",
    GET_POSITION: "get_user_position",
    CAN_WITHDRAW: "can_withdraw_xlm",
    GET_CONTRACT_DATA: "get_contract_data",
    GET_TOTAL_KALE: "get_total_kale_available",
  },
  SAC: {
    BALANCE: "balance",
    TRANSFER: "transfer",
    APPROVE: "approve",
    ALLOWANCE: "allowance",
  },
} as const;
