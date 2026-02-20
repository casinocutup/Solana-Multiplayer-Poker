# Solana Multiplayer Poker – Real-Time Texas Hold'em dApp with Anchor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Anchor](https://img.shields.io/badge/Anchor-0.30.0-blue.svg)](https://www.anchor-lang.com/)
[![Solana](https://img.shields.io/badge/Solana-Web3-purple.svg)](https://solana.com/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)

A full-stack Solana dApp for **real-time multiplayer Texas Hold'em poker**. Built with Anchor (Rust) for on-chain game logic and React for the frontend, featuring real-time WebSocket event subscriptions for live game state synchronization.

## 🎮 Features

- **🔄 Real-Time Multiplayer Sync**: WebSocket subscriptions (programSubscribe, accountSubscribe, logsSubscribe) for live game updates without polling
- **🎯 Full Texas Hold'em Rules**: Preflop, flop, turn, river, showdown with proper betting rounds
- **👥 Multi-Table Support**: Create and join tables with 2-9 players per table
- **💰 On-Chain Game Logic**: All game state managed by Solana program (PDAs)
- **🎨 Animated UI**: Card flips, chip movements, and smooth transitions with Framer Motion
- **🔐 Wallet Integration**: Connect with Phantom, Backpack, and other Solana wallets
- **⚡ Real-Time Events**: Anchor events emitted for every action (player joined, game started, actions taken, pot distributed)
- **🎲 Provably Fair**: Commitment scheme for card dealing (can be extended with VRF)

## 🛠️ Tech Stack

### Solana Program
- **Anchor 0.30.0** - Solana framework
- **Rust** - Program logic
- **PDAs** - Table and player state management
- **Anchor Events** - Real-time event emission

### Frontend
- **React 19** + **Vite** + **TypeScript**
- **@solana/web3.js** - WebSocket PubSub subscriptions
- **@solana/wallet-adapter-react** - Wallet integration
- **@coral-xyz/anchor** - Anchor client
- **Framer Motion** - Animations
- **Tailwind CSS v4** - Styling
- **Zustand** - State management

## 📋 Prerequisites

- **Rust** (latest stable)
- **Anchor** 0.30.0+ (`cargo install --git https://github.com/coral-xyz/anchor avm && avm install latest && avm use latest`)
- **Solana CLI** 1.18.0+
- **Node.js** 18+ and npm
- **Solana Wallet** (Phantom, Backpack, etc.)

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd Solana-Multiplayer-Poker-1

# Install Anchor dependencies
anchor build

# Install frontend dependencies
cd frontend
npm install
```

### 2. Start Local Validator

```bash
# Terminal 1: Start local Solana validator
solana-test-validator
```

### 3. Deploy Program

```bash
# Terminal 2: Deploy to localnet
anchor deploy
```

### 4. Start Frontend

```bash
# Terminal 3: Start frontend dev server
cd frontend
npm run dev
```

### 5. Open in Browser

Navigate to `http://localhost:5174` and connect your wallet!

## 🎮 How to Play

1. **Connect Wallet**: Click the wallet button and connect your Solana wallet
2. **Create Table**: Set blinds, max players, and buy-in, then create a table
3. **Join Table**: Other players can join your table or you can join existing tables
4. **Start Game**: Once 2+ players are seated, click "Start Game"
5. **Play Rounds**: 
   - Preflop: Hole cards dealt, betting round
   - Flop: 3 community cards, betting round
   - Turn: 4th community card, betting round
   - River: 5th community card, final betting round
   - Showdown: Reveal cards, determine winners
6. **Take Actions**: Fold, Check, Call, Raise, or All-In when it's your turn
7. **Real-Time Updates**: Watch the game update in real-time as other players act

## Contact

- Telegram: https://t.me/CasinoCutup
- Twitter: https://x.com/CasinoCutup
