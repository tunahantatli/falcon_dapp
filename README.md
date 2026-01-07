# 🦅 Falcon Dapp: Decentralized Decision Intelligence

![ICP](https://img.shields.io/badge/Blockchain-Internet%20Computer-purple?style=flat&logo=internetcomputer)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-Development-blue)

**Falcon Dapp** is a SaaS-based cryptocurrency market analysis platform that leverages **Temporal Convolutional Networks (TCN)** to provide real-time decision support scores (0-100) for traders.

Built on the **Internet Computer (ICP)**, Falcon Dapp introduces a **trustless subscription model** by verifying **EVM-based payments (BSC/Arbitrum)** directly via **ICP HTTPS Outcalls**, eliminating the need for centralized backend servers or bridges.

---

## 🚀 The Vision: Why Falcon?

Cryptocurrency markets are volatile and complex. Most traders lose money due to emotional decisions or lack of data processing capacity.

**Falcon Dapp is NOT a trading bot.** It is a **Decision Support System.**
Instead of executing trades on behalf of the user, it processes historical data, market volume, and whale movements to generate a simple **"Trade Suitability Score" (0-100)**.

### Why ICP? (Chain Fusion Showcase)
Falcon Dapp serves as a prime example of **"Chain Fusion"** and **"Decentralized AI Orchestration"**:

1.  **Cross-Chain SaaS:** We demonstrate how to sell a service on ICP while accepting payments from EVM chains (USDT on BSC/Arbitrum) without off-chain verifiers.
2.  **Hybrid AI Architecture:** Heavy AI computation (TCN Model) runs on **Render Network/GPU Workers**, while the results are cryptographically signed and stored immutably on **ICP Canisters**.
3.  **Real Utility:** A subscription-based dApp that burns cycles regularly, contributing to the ICP deflationary economy.

---

## 🏗 System Architecture

Falcon Dapp consists of three main pillars:

### 1. The Frontend (Asset Canister)
* **Tech:** React.js, Tailwind CSS, Motoko.
* **Function:** Wallet connection (MetaMask/Rabby), Dashboard visualization (Standard vs. Pro views), and Payment initiation.
* **Hosting:** Fully decentralized on ICP Asset Canister.

### 2. The Backend (Membership & Signal Canisters)
* **Tech:** Motoko / Rust.
* **Key Feature - Trustless Payment Verification:**
    * Uses **HTTPS Outcalls** to query EVM RPC nodes directly.
    * Verifies transaction hashes (`TxHash`) to confirm 15 USDT subscription payments.
    * Manages user access (Standard/Pro) and expiration (30-day logic).

### 3. The AI Engine (Off-Chain Worker)
* **Tech:** Python, PyTorch (TCN Model).
* **Function:** Processes market data 24/7.
* **Security:** Pushes signals to the ICP Canister with **Ed25519 signatures** to ensure data integrity.

> **⚠️ NOTE ON PROPRIETARY IP**
>
> This repository contains the source code for the **ICP On-Chain Infrastructure** (Frontend & Canisters).
>
> The **TCN AI Model** and worker scripts are proprietary intellectual property and are hosted in a private repository to protect the commercial viability of the project. They interact with this dApp via authenticated ingress messages.

---

## 💰 Business Model

Falcon Dapp operates on a straightforward subscription model:

* **Standard Plan (7.99 USDT):** Basic TCN Scores.
* **Pro Plan (15.00 USDT):** Detailed Analytics + News/Whale Scores.

**User Flow:**
1.  Connect EVM Wallet to the dApp.
2.  Sign a transaction to pay subscription fee (on BSC/Arbitrum).
3.  ICP Canister verifies the payment via RPC (HTTPS Outcall).
4.  Access is granted instantly via Smart Contract.

---

## 🛠 Development & Setup

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+)
* [DFINITY SDK (dfx)](https://internetcomputer.org/docs/current/developer-docs/setup/install)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/tunahantatli/falcon_dapp.git](https://github.com/tunahantatli/falcon_dapp.git)
    cd falcon_dapp
    ```

2.  **Start the local ICP replica:**
    ```bash
    dfx start --background
    ```

3.  **Deploy Canisters:**
    ```bash
    dfx deploy
    ```

4.  **Launch Frontend:**
    The frontend will be accessible at: `http://localhost:4943?canisterId=[your-frontend-canister-id]`

---

## 🗺 Roadmap

- [x] **Phase 1:** Project Initialization & Architecture Design
- [ ] **Phase 2:** Skeleton Deployment (Frontend + Basic Canister Structure)
- [ ] **Phase 3:** TCN Signal Integration (Authenticated Ingress from Worker)
- [ ] **Phase 4:** HTTPS Outcalls Implementation for EVM Payment Verification
- [ ] **Phase 5:** Training the AI model for 50+ altcoins and publishing backtests
- [ ] **Phase 6:** Mainnet launch & marketing
- [ ] **Phase 7:** One-click DEX swap integration (EVM & Solana)
- [ ] **Phase 8:** Global fiat gateway launch & Falcon debit card vision

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.