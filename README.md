# fKALE
## *"Trade your unfarmed $KALE"*

fKALE is a revolutionary DeFi platform on Stellar that allows users to leverage their future KALE token expectations without selling their XLM holdings. Users can provide 1:1 XLM collateral to mint fKALE tokens at a 1000:1 ratio, maintaining exposure to XLM volatility while accessing liquidity from their anticipated KALE farming rewards.

## Core Value Proposition

**Trade your unfarmed $KALE** - fKALE enables users to:
- 🔒 **Maintain XLM Exposure**: Keep your XLM bags while accessing liquidity
- 💰 **1:1 Collateral Efficiency**: Provide 1 XLM, receive 1000 fKALE tokens
- 🌾 **Monetize Future Farming**: Trade expected KALE rewards before you farm them
- ⚡ **Instant Liquidity**: Get immediate access to capital without selling your XLM
- 🔄 **Volatility Participation**: Stay exposed to XLM price movements while leveraging future yields

## Project Overview

| **Category** | **Details** |
|--------------|-------------|
| **🏗️ Project Type** | DeFi Protocol on Stellar Blockchain |
| **🎯 Primary Function** | Collateralized Token Minting & Future Asset Trading |
| **💰 Collateral Asset** | XLM (Stellar Lumens) |
| **🌾 Target Asset** | KALE Tokens |
| **🔄 Exchange Rate** | 1 XLM = 1000 fKALE tokens |
| **🔒 Collateral Ratio** | 1:1 (1 XLM locked per 1 XLM worth of fKALE) |
| **⏰ Lock Period** | 30 days (MVP) |
| **🌐 Network** | Stellar Testnet (MVP) → Mainnet (Production) |
| **🏛️ Architecture** | Smart Contracts + React Frontend |
| **🔧 Status** | MVP Demo (Not Production Ready) |
| **🛡️ Security** | Unaudited (Audit Required for Production) |
| **📱 Platforms** | Web Application (Mobile Responsive) |
| **🎨 UI Framework** | React + TypeScript + Stellar Design System |
| **⚡ Key Features** | Mint, Redeem, Position Management, Debug Tools |
| **🚀 Deployment** | Automated via npm scripts |

## Live Application Features

### 🏠 **Home Dashboard**
- **Portfolio Overview**: Real-time display of XLM, fKALE, and KALE balances
- **Interactive Feature Cards**: Quick access to all platform functions
- **Educational Content**: Clear explanations of how fKALE works
- **Theme Toggle**: Dark/Light mode support for optimal user experience
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### 💰 **Mint fKALE Tokens**
- **Smart Input Validation**: Real-time balance checking and error handling
- **Live Rate Calculator**: Automatic calculation of fKALE tokens to receive (1000:1 ratio)
- **Transaction Preview**: Detailed breakdown of collateral, fees, and lock period
- **MAX Button**: One-click option to use maximum available XLM (minus fees)
- **Progress Indicators**: Loading states and transaction status updates
- **Position Tracking**: Immediate balance updates after successful minting

### 🌾 **Redeem KALE Tokens**
- **Dual Functionality**: 
  - Deposit KALE tokens to enable redemptions for others
  - Redeem your fKALE tokens for KALE at 1:1 ratio
- **Pool Status**: View available KALE in the redemption pool
- **Fee Earning**: Earn fees by providing KALE liquidity
- **Instant Redemption**: When KALE is available, redeem fKALE immediately

### ⚙️ **Position Management**
- **Comprehensive Overview**: View all active positions and collateral
- **Lock Period Tracking**: Monitor 30-day lock period countdown
- **Withdrawal Eligibility**: Check when XLM can be withdrawn
- **Position Health**: Monitor collateral ratios and position status
- **Transaction History**: View all minting, redemption, and withdrawal activities

### 🔧 **Advanced Debug Interface**
- **Contract Interaction**: Direct interface to all contract functions
- **Real-time Validation**: Input validation with immediate feedback
- **Transaction Simulation**: Preview transactions before execution
- **Contract Metadata**: View complete contract schemas and functions
- **Developer Tools**: JSON viewers, XDR utilities, and error diagnostics

### 🎨 **Modern UI/UX Features**
- **Glass Morphism Design**: Modern translucent cards with backdrop blur
- **Smooth Animations**: Professional fade-in effects and hover transitions
- **Brand Identity**: Cohesive fKALE branding with custom color palette
- **Error Boundaries**: Graceful error handling with user-friendly messages
- **Accessibility**: Keyboard navigation and screen reader support
- **Performance Optimized**: Fast loading with skeleton states and lazy loading

## Contract Addresses

### **Testnet Deployment**
- **fKALE Token Contract**: `CC3A4X5YBD7YN2WFRECSQPA3N4JGGWOMSXF7ED5ZCQANMTRVHH6CRHJN`
- **Forwards Contract**: `CDP2A3JLSFR4G3SQWKAYZMRUN7XN5K3AQZ2FY5QFZ3X2T32VLUDHW4ES`
- **KALE SAC**: `CAAVU2UQJLMZ3GUZFM56KVNHLPA3ZSSNR4VP2U53YBXFD2GI3QLIVHZZ`
- **XLM SAC**: `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`

## Smart Contract Architecture

### **fKALE Token Contract**
The fKALE token contract is a Stellar Asset Contract (SAC) compliant fungible token that represents claims on future KALE tokens. Key features:

- **Mintable**: New fKALE tokens are minted when users provide XLM collateral
- **Burnable**: fKALE tokens are burned when redeemed for KALE
- **Transferable**: Users can trade fKALE tokens freely
- **1:1 KALE Backing**: Each fKALE token represents a claim on 1 KALE token

### **Forwards Contract**
The forwards contract manages the collateral system and forward positions. Core functions:

- **Position Management**: Creates and tracks user positions with XLM collateral
- **Collateral Handling**: Manages 1:1 XLM collateral for fKALE minting
- **Redemption Logic**: Facilitates fKALE to KALE redemption when KALE is available
- **Liquidation System**: Handles position liquidation and collateral distribution

### **Current Architecture (MVP)**
⚠️ **Note**: The current implementation uses a **shared pool system** which is **NOT production-ready**. This is for demonstration purposes only.

**Current MVP Features:**
- Shared collateral pool for all users
- Simplified position tracking
- Basic redemption mechanism
- 30-day lock period for all positions
- Fixed 1000:1 XLM to fKALE exchange rate

## Production Roadmap

### **Phase 1: Advanced Features** 🚀
- [ ] **User-Specific Pools**: Individual collateral management per user
- [ ] **Dynamic Pricing**: Market-driven exchange rates for fKALE
- [ ] **Variable Lock Periods**: User-selectable lock durations (7, 30, 90, 180 days)
- [ ] **Partial Withdrawals**: Allow partial collateral withdrawal before maturity
- [ ] **Position Transfers**: Enable trading of locked positions

### **Phase 2: Market Making & Liquidity** 💱
- [ ] **Automated Market Maker**: XLM-fKALE trading pool with dynamic pricing
- [ ] **fKALE-KALE Pool**: Direct redemption pool with liquidity incentives
- [ ] **Yield Farming**: Liquidity provider rewards and staking mechanisms
- [ ] **Cross-Chain Integration**: Bridge to other blockchain networks
- [ ] **Institutional Integration**: API for institutional traders and market makers

### **Phase 3: Advanced Risk Management** ⚖️
- [ ] **Dynamic Collateral Ratios**: Risk-adjusted collateral requirements
- [ ] **Liquidation Engine**: Automated position liquidation system
- [ ] **Insurance Fund**: Protocol insurance for extreme market events
- [ ] **Reflector Integration**: Real-time price feeds for accurate valuations
- [ ] **Stress Testing**: Continuous monitoring and risk assessment

### **Phase 4: Advanced DeFi Integration** 🔗
- [ ] **Lending Protocols**: Use fKALE as collateral in lending platforms
- [ ] **Synthetic Assets**: Create synthetic KALE derivatives
- [ ] **Options Trading**: fKALE options and futures contracts
- [ ] **Perpetual Swaps**: Leveraged trading of fKALE positions
- [ ] **Cross-Protocol Yield**: Optimize yields across multiple DeFi protocols

## Getting Started

### Prerequisites

- Node.js 18+
- Rust with `wasm32v1-none` target
- Stellar-compatible wallet (Freighter, Albedo, etc.)
- Testnet XLM for transactions

### Quick Start

1. **Clone the repository**
```bash
   git clone https://github.com/kaankacar/fkale.git
   cd fkale
   ```

2. **Install dependencies**
```bash
npm install
rustup target add wasm32v1-none
```

3. **Set up environment**
```bash
   cp env.example .env
   # Edit .env with your configuration
```

4. **Start development server**
```bash
   npm run dev
   ```

5. **Visit the application**
   ```
   http://localhost:5173
   ```

### For Developers

#### Build contracts
```bash
npm run build:contracts
```

#### Run tests
```bash
npm run test:contracts
```

#### Deploy to testnet
```bash
npm run deploy:fkale
npm run deploy:forwards
npm run setup:complete
```

## User Workflows

### **Basic User Journey**
1. **Connect Wallet** → Link your Stellar wallet to the platform
2. **Fund Account** → Ensure sufficient XLM for transactions and collateral
3. **Mint fKALE** → Lock XLM collateral and receive fKALE tokens
4. **Trade or Hold** → Use fKALE for immediate liquidity or hold for KALE redemption
5. **Redeem KALE** → Exchange fKALE for KALE when available (1:1 ratio)
6. **Withdraw Collateral** → Reclaim XLM after lock period and sufficient KALE delivery

### **Advanced Trading Scenarios**

**Liquidity Seeker**
- Lock XLM → Mint fKALE → Sell fKALE → Maintain XLM exposure → Profit from XLM appreciation

**KALE Farmer**
- Buy fKALE → Hold until KALE delivery → Redeem fKALE for KALE → Benefit from KALE value

**Arbitrage Trader**
- Monitor fKALE prices → Mint when premium exists → Sell at higher prices → Profit from spreads

## Security & Risk Considerations

- **MVP Status**: Current implementation is for demonstration only
- **Shared Pools**: Not suitable for production use
- **Audit Required**: Contracts need professional security audit
- **Testnet Only**: Do not use real funds without proper auditing
- **Smart Contract Risk**: Potential for bugs or vulnerabilities
- **Market Risk**: XLM and KALE price volatility affects positions

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Disclaimer

⚠️ **Important**: This is an MVP (Minimum Viable Product) for demonstration purposes. Do not use in production without proper security audits and testing. The contracts have not been audited and may contain vulnerabilities. Use at your own risk.

## Support & Community

- **GitHub Issues**: [Report bugs or request features](https://github.com/your-username/fkale/issues)
- **Documentation**: [Soroban Documentation](https://developers.stellar.org/docs/soroban)
- **Community**: [Stellar Discord](https://discord.gg/stellardev)
- **Updates**: Follow development progress on GitHub

---

**Built with ❤️ on Stellar** | **fKALE Protocol** | **"Trade your unfarmed $KALE"**