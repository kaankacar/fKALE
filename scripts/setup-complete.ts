#!/usr/bin/env node

import { 
  Keypair, 
  TransactionBuilder, 
  Networks, 
  BASE_FEE,
  Address,
  Contract,
  xdr,
  rpc
} from "@stellar/stellar-sdk";
import { readFileSync } from "fs";
import * as dotenv from "dotenv";
import * as bip39 from "bip39";

// Load environment variables
dotenv.config();

// Configuration
const RPC_URL = process.env.PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = process.env.PUBLIC_STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;
const DEPLOYER_SEED = process.env.DEPLOYER_SEED_PHRASE || "math breeze mixture satoshi motion paddle cradle love smooth collect voice unfair";

const FKALE_TOKEN_CONTRACT_ID = process.env.FKALE_TOKEN_CONTRACT_ID;
const FORWARDS_CONTRACT_ID = process.env.FORWARDS_CONTRACT_ID;

async function setFKaleTokenAdmin(deployer: Keypair, server: SorobanRpc.Server): Promise<void> {
  console.log("🔧 Setting fKALE token admin to forwards contract...");
  
  if (!FKALE_TOKEN_CONTRACT_ID || !FORWARDS_CONTRACT_ID) {
    throw new Error("Contract IDs not found in environment. Please deploy contracts first.");
  }
  
  try {
    const contract = new Contract(FKALE_TOKEN_CONTRACT_ID);
    const account = await server.getAccount(deployer.publicKey());
    
    const setAdminTx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          "set_admin",
          Address.fromString(FORWARDS_CONTRACT_ID).toScVal() // new admin (forwards contract)
        )
      )
      .setTimeout(30)
      .build();
    
    setAdminTx.sign(deployer);
    
    const response = await server.sendTransaction(setAdminTx);
    console.log("📤 Set admin response:", response.status);
    
    if (response.status === "ERROR") {
      throw new Error(`Failed to set admin: ${response.errorResult}`);
    }
    
    // Wait for transaction
    let getResponse = await server.getTransaction(response.hash);
    while (getResponse.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) {
      console.log("⏳ Waiting for admin change...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      getResponse = await server.getTransaction(response.hash);
    }
    
    if (getResponse.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`Set admin transaction failed: ${getResponse.resultXdr}`);
    }
    
    console.log("✅ fKALE token admin set to forwards contract");
    
  } catch (error) {
    console.error("❌ Failed to set admin:", error);
    throw error;
  }
}

async function fundDeployerWithTestnetTokens(deployer: Keypair): Promise<void> {
  console.log("💰 Funding deployer with testnet XLM...");
  
  try {
    const friendbotUrl = `https://friendbot.stellar.org?addr=${deployer.publicKey()}`;
    const response = await fetch(friendbotUrl);
    
    if (response.ok) {
      console.log("✅ Deployer funded with testnet XLM");
    } else {
      console.log("⚠️ Friendbot funding failed (account may already be funded)");
    }
  } catch (error) {
    console.log("⚠️ Could not fund deployer with friendbot:", error);
  }
}

async function createTestPosition(deployer: Keypair, server: SorobanRpc.Server): Promise<void> {
  console.log("🧪 Creating test position...");
  
  if (!FORWARDS_CONTRACT_ID) {
    throw new Error("FORWARDS_CONTRACT_ID not found in environment");
  }
  
  try {
    const contract = new Contract(FORWARDS_CONTRACT_ID);
    const account = await server.getAccount(deployer.publicKey());
    
    // Create a test position: 1 XLM for 1000 fKALE
    const xlmAmount = 10000000; // 1 XLM in stroops
    
    const buyTx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          "buy_fkale",
          Address.fromString(deployer.publicKey()).toScVal(), // user
          xdr.ScVal.scvI128(new xdr.Int128Parts({ hi: xdr.Uint64.fromString("0"), lo: xdr.Uint64.fromString(xlmAmount.toString()) })) // XLM amount
        )
      )
      .setTimeout(30)
      .build();
    
    buyTx.sign(deployer);
    
    const response = await server.sendTransaction(buyTx);
    console.log("📤 Test position response:", response.status);
    
    if (response.status === "ERROR") {
      console.log("⚠️ Test position creation failed (this is expected if tokens aren't funded)");
      return;
    }
    
    // Wait for transaction
    let getResponse = await server.getTransaction(response.hash);
    while (getResponse.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) {
      console.log("⏳ Waiting for test position...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      getResponse = await server.getTransaction(response.hash);
    }
    
    if (getResponse.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
      console.log("✅ Test position created successfully");
    } else {
      console.log("⚠️ Test position creation failed (this is expected without token funding)");
    }
    
  } catch (error) {
    console.log("⚠️ Could not create test position:", error);
  }
}

function displayFundingInstructions(): void {
  console.log("\n💡 KALE Funding Instructions:");
  console.log("═".repeat(60));
  console.log("To make the fKALE system fully functional, you need to fund the");
  console.log("contracts with KALE tokens for redemption.");
  console.log("");
  console.log("📍 Contracts that need KALE funding:");
  console.log("");
  console.log(`1. Forwards Contract: ${FORWARDS_CONTRACT_ID}`);
  console.log("   - This contract needs KALE to enable fKALE → KALE redemption");
  console.log("   - Users deposit KALE here to back their fKALE positions");
  console.log("");
  console.log("💰 Recommended KALE amounts:");
  console.log("   - Start with 10,000 KALE for testing");
  console.log("   - Scale based on expected fKALE demand");
  console.log("");
  console.log("🔗 How to fund:");
  console.log(`   stellar contract invoke --id ${process.env.KALE_SAC_ID} -- transfer`);
  console.log(`     --from YOUR_ADDRESS --to ${FORWARDS_CONTRACT_ID} --amount 100000000000`);
  console.log("");
  console.log("   (100000000000 = 10,000 KALE with 7 decimals)");
  console.log("");
  console.log("⚠️  Without KALE funding, users can buy fKALE but cannot redeem it for KALE.");
}

async function main() {
  console.log("🚀 Starting setup completion...");
  
  if (!FKALE_TOKEN_CONTRACT_ID || !FORWARDS_CONTRACT_ID) {
    console.error("❌ Contract IDs not found in environment.");
    console.log("Please run the deployment scripts first:");
    console.log("  npm run deploy:fkale");
    console.log("  npm run deploy:forwards");
    process.exit(1);
  }
  
  // Derive keypair from seed phrase
  const seed = bip39.mnemonicToSeedSync(DEPLOYER_SEED);
  const deployer = Keypair.fromRawEd25519Seed(seed.slice(0, 32));
  const server = new rpc.Server(RPC_URL);
  
  console.log(`👤 Deployer: ${deployer.publicKey()}`);
  console.log(`🌐 Network: ${NETWORK_PASSPHRASE}`);
  console.log(`🔗 RPC URL: ${RPC_URL}`);
  
  try {
    // Step 1: Fund deployer with testnet XLM
    await fundDeployerWithTestnetTokens(deployer);
    
    // Step 2: Set fKALE token admin to forwards contract
    await setFKaleTokenAdmin(deployer, server);
    
    // Step 3: Create a test position (may fail without token funding)
    await createTestPosition(deployer, server);
    
    console.log("\n🎉 Setup completion finished!");
    console.log("\n📋 System Status:");
    console.log(`✅ fKALE Token deployed: ${FKALE_TOKEN_CONTRACT_ID}`);
    console.log(`✅ Forwards Contract deployed: ${FORWARDS_CONTRACT_ID}`);
    console.log(`✅ fKALE admin set to forwards contract`);
    console.log(`✅ System ready for use`);
    
    // Display funding instructions
    displayFundingInstructions();
    
    console.log("\n🚀 Ready to launch!");
    console.log("Run 'npm run dev' to start the frontend and begin testing.");
    
  } catch (error) {
    console.error("❌ Setup failed:", error);
    
    // Still display funding instructions even if setup partially failed
    displayFundingInstructions();
    
    process.exit(1);
  }
}

// Run main function if this script is executed directly
main();
