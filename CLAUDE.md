# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a Web3 educational platform with three main components:

- **contracts/** - Hardhat-based Solidity contracts (YDToken, CourseManager, SimpleStaking)
- **frontend/** - React + TypeScript + Vite frontend with Web3 integration
- **backend/** - Empty directory (backend development pending)
- **docs/** - Chinese documentation with detailed task lists

## Development Commands

### Frontend (React + Vite + TailwindCSS)
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production (runs tsc -b && vite build)
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Smart Contracts (Hardhat)
```bash
cd contracts
npx hardhat compile                    # Compile contracts
npx hardhat test                      # Run tests
npx hardhat node                      # Start local blockchain
npx hardhat verify --network sepolia  # Verify contracts on Etherscan
```

## Technology Stack

### Frontend
- React 19.1.1 with TypeScript
- Vite 7.1.2 for build tooling
- TailwindCSS 4.1.13 for styling
- ethers.js 6.15.0 for Web3 interactions
- Zustand 5.0.8 for state management
- React Router DOM 7.8.2 for routing

### Smart Contracts
- Hardhat 3.0.4 with TypeScript
- Solidity 0.8.28
- OpenZeppelin contracts 5.4.0
- Viem 2.37.5 for testing
- Deployed on Sepolia testnet

## Contract Architecture

The platform has three main contracts:
1. **YDToken.sol** - ERC20 token for platform currency
2. **CourseManager.sol** - Handles course creation and purchases
3. **SimpleStaking.sol** - Token staking with 1% daily rewards

## Configuration Notes

- Frontend uses absolute imports and TailwindCSS v4
- Contracts configured for Sepolia network with Etherscan verification
- Environment variables needed: SEPOLIA_RPC_URL, SEPOLIA_PRIVATE_KEY, ETHERSCAN_API_KEY
- Backend directory exists but is empty (development pending)

## Development Status

Based on Chinese documentation in docs/任务.md:
- ✅ Smart contracts deployed to Sepolia
- 🔄 Contract verification on Etherscan in progress  
- ❌ Backend API development not started
- ❌ Frontend Web3 integration not implemented
- ❌ User authentication and course purchase flows pending