# Evolution of Trust - Smart Contract Deployment Guide

## Overview

This smart contract implements a blockchain-based Iterated Prisoner's Dilemma game where two players stake 0.001 ETH each to play a 10-round trust game. The winner takes all (or funds split on tie).

## Prerequisites

- Node.js and npm installed
- Hardhat or Foundry for deployment
- MetaMask or another Web3 wallet
- Some ETH for deployment (on testnet or mainnet)

## Contract Details

- **Bond Amount**: 0.001 ETH per player
- **Rounds**: 10
- **Treasury Fee**: 0.5% (50 basis points)
- **Networks**: Compatible with any EVM chain (Ethereum, Polygon, Base, etc.)

## Deployment Steps

### Option 1: Using Hardhat

1. Install dependencies:
```bash
npm init -y
npm install --save-dev hardhat @openzeppelin/contracts @nomicfoundation/hardhat-toolbox
```

2. Initialize Hardhat:
```bash
npx hardhat init
```

3. Install OpenZeppelin contracts:
```bash
npm install @openzeppelin/contracts
```

4. Create a deployment script (`scripts/deploy.js`):
```javascript
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contract with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy the contract
  const treasuryAddress = deployer.address; // Or specify a different treasury address

  const EvolutionOfTrust = await hre.ethers.getContractFactory("EvolutionOfTrust");
  const contract = await EvolutionOfTrust.deploy(treasuryAddress);

  await contract.deployed();

  console.log("EvolutionOfTrust deployed to:", contract.address);
  console.log("Treasury address:", treasuryAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

5. Configure `hardhat.config.js`:
```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // For testnet deployment (e.g., Sepolia)
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    },
    // For mainnet deployment
    mainnet: {
      url: process.env.MAINNET_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    },
    // For Base mainnet
    base: {
      url: "https://mainnet.base.org",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 8453
    },
    // For Base Sepolia testnet
    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 84532
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
```

6. Create a `.env` file:
```
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
```

7. Deploy to testnet:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

8. Deploy to mainnet:
```bash
npx hardhat run scripts/deploy.js --network mainnet
```

### Option 2: Using Foundry

1. Install Foundry:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. Initialize Foundry project:
```bash
forge init
```

3. Install OpenZeppelin:
```bash
forge install OpenZeppelin/openzeppelin-contracts
```

4. Update `foundry.toml`:
```toml
[profile.default]
src = 'src'
out = 'out'
libs = ['lib']
remappings = ['@openzeppelin/=lib/openzeppelin-contracts/']

[rpc_endpoints]
sepolia = "${SEPOLIA_RPC_URL}"
mainnet = "${MAINNET_RPC_URL}"
```

5. Deploy:
```bash
forge create --rpc-url sepolia \
  --private-key $PRIVATE_KEY \
  --constructor-args $TREASURY_ADDRESS \
  src/EvolutionOfTrust.sol:EvolutionOfTrust
```

## Post-Deployment

### 1. Update Frontend Configuration

After deploying, update `crypto-game.js` with your contract address:

```javascript
const CONTRACT_ADDRESS = "0xYourContractAddressHere";
```

### 2. Verify Contract on Etherscan

Using Hardhat:
```bash
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS "TREASURY_ADDRESS"
```

Using Foundry:
```bash
forge verify-contract \
  --chain-id 11155111 \
  --compiler-version v0.8.19+commit.7dd6d404 \
  --constructor-args $(cast abi-encode "constructor(address)" $TREASURY_ADDRESS) \
  DEPLOYED_CONTRACT_ADDRESS \
  src/EvolutionOfTrust.sol:EvolutionOfTrust \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

### 3. Test the Contract

Create a test file (`test/EvolutionOfTrust.test.js`):

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EvolutionOfTrust", function () {
  let contract;
  let owner, player1, player2;
  const bondAmount = ethers.utils.parseEther("0.001");

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();

    const EvolutionOfTrust = await ethers.getContractFactory("EvolutionOfTrust");
    contract = await EvolutionOfTrust.deploy(owner.address);
    await contract.deployed();
  });

  it("Should create and join a game", async function () {
    // Player 1 creates game
    await contract.connect(player1).createOrJoinGame({ value: bondAmount });

    // Player 2 joins game
    const tx = await contract.connect(player2).createOrJoinGame({ value: bondAmount });
    const receipt = await tx.wait();

    // Check game started event
    const gameStartedEvent = receipt.events.find(e => e.event === "GameStarted");
    expect(gameStartedEvent).to.not.be.undefined;
  });

  it("Should play a full game", async function () {
    // Create and join game
    await contract.connect(player1).createOrJoinGame({ value: bondAmount });
    await contract.connect(player2).createOrJoinGame({ value: bondAmount });

    const gameId = 1;

    // Play 10 rounds
    for (let i = 0; i < 10; i++) {
      await contract.connect(player1).submitMove(gameId, true); // Cooperate
      await contract.connect(player2).submitMove(gameId, false); // Defect
    }

    // Check game is finalized
    const game = await contract.getGame(gameId);
    expect(game.state).to.equal(4); // GameState.Finalized
  });
});
```

Run tests:
```bash
npx hardhat test
```

## Security Considerations

1. **Testnet First**: Always deploy to testnet (Sepolia, Goerli) before mainnet
2. **Audit**: Consider getting the contract audited before mainnet deployment
3. **Gas Optimization**: The contract is optimized, but test gas costs on mainnet
4. **Treasury Address**: Ensure the treasury address is correct and secure
5. **Reentrancy Protection**: Contract uses OpenZeppelin's ReentrancyGuard

## Recommended Networks

- **Ethereum Mainnet**: High security, high gas costs
- **Base**: Lower gas costs, good UX, growing ecosystem
- **Polygon**: Very low gas costs, fast transactions
- **Arbitrum**: L2 with lower costs than Ethereum mainnet

## Gas Estimates

- Create Game: ~100,000 gas
- Join Game: ~80,000 gas
- Submit Move: ~50,000 gas (per move)
- Withdraw Winnings: ~60,000 gas

## Support

For issues or questions:
- Check the contract code comments
- Review the spec in `crypto_spec.md`
- Test thoroughly on testnet before mainnet deployment

## License

MIT
