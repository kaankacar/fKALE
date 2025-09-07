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
import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import * as dotenv from "dotenv";
import * as bip39 from "bip39";

// Load environment variables
dotenv.config();

// Configuration
const RPC_URL = process.env.PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = process.env.PUBLIC_STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;
const DEPLOYER_SEED = process.env.DEPLOYER_SEED_PHRASE || "math breeze mixture satoshi motion paddle cradle love smooth collect voice unfair";

const KALE_SAC_ID = process.env.KALE_SAC_ID || "CAAVU2UQJLMZ3GUZFM56KVNHLPA3ZSSNR4VP2U53YBXFD2GI3QLIVHZZ";
const XLM_SAC_ID = process.env.XLM_SAC_ID || "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
const FKALE_TOKEN_CONTRACT_ID = process.env.FKALE_TOKEN_CONTRACT_ID;

async function buildContract(): Promise<void> {
  console.log("🔨 Building forwards contract...");
  
  try {
    execSync("cd contracts/forwards && cargo build --target wasm32v1-none --release", {
      stdio: "inherit"
    });
    console.log("✅ Forwards contract built successfully");
  } catch (error) {
    console.error("❌ Failed to build forwards contract:", error);
    process.exit(1);
  }
}

async function deployContract(wasmPath: string, deployer: Keypair, server: SorobanRpc.Server): Promise<string> {
  console.log(`📦 Deploying contract from ${wasmPath}...`);
  
  try {
    // Read WASM file
    const wasmBuffer = readFileSync(wasmPath);
    
    // Get deployer account
    const deployerAccount = await server.getAccount(deployer.publicKey());
    
    // Create install contract operation
    const transaction = new TransactionBuilder(deployerAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        xdr.Operation.invokeHostFunction(
          xdr.HostFunction.hostFunctionTypeUploadContractWasm(wasmBuffer)
        )
      )
      .setTimeout(30)
      .build();
    
    // Sign transaction
    transaction.sign(deployer);
    
    // Submit transaction
    const response = await server.sendTransaction(transaction);
    console.log("📤 Install response:", response.status);
    
    if (response.status === "ERROR") {
      throw new Error(`Failed to install contract: ${response.errorResult}`);
    }
    
    // Wait for transaction
    let getResponse = await server.getTransaction(response.hash);
    while (getResponse.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) {
      console.log("⏳ Waiting for transaction confirmation...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      getResponse = await server.getTransaction(response.hash);
    }
    
    if (getResponse.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`Transaction failed: ${getResponse.resultXdr}`);
    }
    
    // Create contract from uploaded WASM
    const deployerAccount2 = await server.getAccount(deployer.publicKey());
    const salt = Keypair.random().rawSecretKey();
    
    const createTransaction = new TransactionBuilder(deployerAccount2, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        xdr.Operation.invokeHostFunction(
          xdr.HostFunction.hostFunctionTypeCreateContract(
            xdr.CreateContractArgs.createContractArgsFromAddress(
              new xdr.CreateContractArgsFromAddress({
                address: Address.fromString(deployer.publicKey()).toScAddress(),
                salt: salt,
                wasmHash: getResponse.returnValue!,
              })
            )
          )
        )
      )
      .setTimeout(30)
      .build();
    
    createTransaction.sign(deployer);
    
    const createResponse = await server.sendTransaction(createTransaction);
    console.log("📤 Create response:", createResponse.status);
    
    if (createResponse.status === "ERROR") {
      throw new Error(`Failed to create contract: ${createResponse.errorResult}`);
    }
    
    // Wait for create transaction
    let getCreateResponse = await server.getTransaction(createResponse.hash);
    while (getCreateResponse.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) {
      console.log("⏳ Waiting for contract creation...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      getCreateResponse = await server.getTransaction(createResponse.hash);
    }
    
    if (getCreateResponse.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`Create transaction failed: ${getCreateResponse.resultXdr}`);
    }
    
    // Extract contract ID from response
    const contractId = Address.fromScAddress(getCreateResponse.returnValue!).toString();
    
    console.log(`✅ Contract deployed with ID: ${contractId}`);
    return contractId;
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

async function initializeForwardsContract(contractId: string, deployer: Keypair, server: SorobanRpc.Server): Promise<void> {
  console.log("🔧 Initializing forwards contract...");
  
  if (!FKALE_TOKEN_CONTRACT_ID) {
    throw new Error("FKALE_TOKEN_CONTRACT_ID not found in environment. Please deploy fKALE token first.");
  }
  
  try {
    const contract = new Contract(contractId);
    const account = await server.getAccount(deployer.publicKey());
    
    const initTx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          "initialize",
          Address.fromString(deployer.publicKey()).toScVal(), // admin
          Address.fromString(KALE_SAC_ID).toScVal(), // KALE SAC
          Address.fromString(XLM_SAC_ID).toScVal(), // XLM SAC
          Address.fromString(FKALE_TOKEN_CONTRACT_ID).toScVal() // fKALE token
        )
      )
      .setTimeout(30)
      .build();
    
    initTx.sign(deployer);
    
    const initResponse = await server.sendTransaction(initTx);
    console.log("📤 Initialize response:", initResponse.status);
    
    if (initResponse.status === "ERROR") {
      throw new Error(`Failed to initialize contract: ${initResponse.errorResult}`);
    }
    
    // Wait for initialization
    let getInitResponse = await server.getTransaction(initResponse.hash);
    while (getInitResponse.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) {
      console.log("⏳ Waiting for initialization...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      getInitResponse = await server.getTransaction(initResponse.hash);
    }
    
    if (getInitResponse.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`Initialize transaction failed: ${getInitResponse.resultXdr}`);
    }
    
    console.log("✅ Forwards contract initialized successfully");
    
  } catch (error) {
    console.error("❌ Initialization failed:", error);
    throw error;
  }
}

function updateEnvFile(contractId: string): void {
  console.log("📝 Updating .env file...");
  
  try {
    let envContent = "";
    
    try {
      envContent = readFileSync(".env", "utf8");
    } catch (error) {
      // .env doesn't exist, create from .env.example
      envContent = readFileSync("env.example", "utf8");
    }
    
    // Update or add FORWARDS_CONTRACT_ID
    if (envContent.includes("FORWARDS_CONTRACT_ID=")) {
      envContent = envContent.replace(
        /FORWARDS_CONTRACT_ID=.*/,
        `FORWARDS_CONTRACT_ID=${contractId}`
      );
    } else {
      envContent += `\nFORWARDS_CONTRACT_ID=${contractId}\n`;
    }
    
    writeFileSync(".env", envContent);
    console.log("✅ .env file updated");
    
  } catch (error) {
    console.error("❌ Failed to update .env file:", error);
  }
}

async function main() {
  console.log("🚀 Starting forwards contract deployment...");
  // Derive keypair from seed phrase
  const seed = bip39.mnemonicToSeedSync(DEPLOYER_SEED);
  const deployer = Keypair.fromRawEd25519Seed(seed.slice(0, 32));
  
  console.log(`👤 Deployer: ${deployer.publicKey()}`);
  console.log(`🌐 Network: ${NETWORK_PASSPHRASE}`);
  console.log(`🔗 RPC URL: ${RPC_URL}`);
  
  if (!FKALE_TOKEN_CONTRACT_ID) {
    console.error("❌ FKALE_TOKEN_CONTRACT_ID not found in environment.");
    console.log("Please run 'npm run deploy:fkale' first to deploy the fKALE token contract.");
    process.exit(1);
  }
  
  try {
    // Note: Build contracts first with 'stellar contract build' or 'npm run build:contracts'
    console.log("📋 Using pre-built contracts (run 'stellar contract build' if needed)");
    
    // Deploy contract
    const server = new rpc.Server(RPC_URL);
    
    const contractId = await deployContract(
      "target/wasm32v1-none/release/forwards.wasm",
      deployer,
      server
    );
    
    // Initialize contract
    await initializeForwardsContract(contractId, deployer, server);
    
    // Update .env file
    updateEnvFile(contractId);
    
    console.log("\n🎉 Forwards contract deployment complete!");
    console.log("\n📋 Contract Information:");
    console.log(`FORWARDS_CONTRACT_ID=${contractId}`);
    console.log(`Admin: ${deployer.publicKey()}`);
    console.log(`KALE SAC: ${KALE_SAC_ID}`);
    console.log(`XLM SAC: ${XLM_SAC_ID}`);
    console.log(`fKALE Token: ${FKALE_TOKEN_CONTRACT_ID}`);
    console.log(`Exchange Rate: 1000 fKALE per XLM`);
    console.log(`Lock Period: 30 days`);
    
    console.log("\n🔗 Next Steps:");
    console.log("1. Run 'npm run setup:complete' to finalize the setup");
    console.log("2. Fund the contracts with KALE for redemption");
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Run main function if this script is executed directly
main();
