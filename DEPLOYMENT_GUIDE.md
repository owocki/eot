# Smart Contract Deployment Guide

This guide will walk you through deploying the Evolution of Trust smart contract.

## Prerequisites

- Node.js and npm installed
- MetaMask wallet with some testnet ETH
- (Optional) Alchemy or Infura account for RPC access

## Quick Start (Local Testing)

If you just want to test locally first:

```bash
# Install dependencies
npm install

# Start local Hardhat node
npm run node

# In a new terminal, deploy to local network
npm run deploy:local
```

Then update `crypto-game.js` with the contract address shown in the output.

## Deploy to Base Sepolia Testnet (Recommended)

Base Sepolia is a great testnet - low gas costs and easy to get test ETH.

### Step 1: Get Test ETH

1. Visit [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
2. Connect your MetaMask wallet
3. Request test ETH (0.05 ETH should be plenty)

### Step 2: Set Up Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your private key
# Get it from MetaMask: Click account > Account Details > Export Private Key
nano .env
```

Your `.env` should look like:
```
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
ETHERSCAN_API_KEY=your_optional_api_key
```

**Note:** The Etherscan API key is optional for deployment, but required for contract verification.

**⚠️ NEVER commit your .env file to git!**

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Deploy to Base Sepolia

```bash
npm run deploy:baseSepolia
```

You should see output like:
```
Deploying contracts with account: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
Account balance: 0.05 ETH

Deploying EvolutionOfTrust contract...
Treasury address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

✅ EvolutionOfTrust deployed to: 0x1234567890123456789012345678901234567890

📋 IMPORTANT: Update crypto-game.js with this address:
const CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890";
```

### Step 5: Update Frontend

Copy the contract address from the output and update `crypto-game.js`:

```javascript
// Replace this line:
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";

// With your deployed address:
const CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890";
```

### Step 6: Test It!

1. Open your site
2. Go to Multiplayer section
3. Click "Connect Wallet"
4. Make sure MetaMask is on Base Sepolia network
5. Click "Create or Join Game"
6. Approve the 0.001 ETH transaction

🎉 You're live!

## Deploy to Base Mainnet (Real ETH)

**⚠️ Only do this when you're ready to go live with real money!**

```bash
# Make sure you have real ETH on Base Mainnet
npm run deploy:base
```

## Verify Contract on Block Explorer

After deployment, verify your contract so users can read it on BaseScan.

### Get an Etherscan API Key

1. Go to [Etherscan](https://etherscan.io/myapikey)
2. Sign up or log in
3. Create a new API key
4. Add it to your `.env` file as `ETHERSCAN_API_KEY`

**Note:** The same Etherscan API key works for Base networks (BaseScan is now part of Etherscan).

### Verify the Contract

```bash
# Replace with your actual deployed address and treasury address
npx hardhat verify --network baseSepolia YOUR_CONTRACT_ADDRESS "YOUR_TREASURY_ADDRESS"
```

Example:
```bash
npx hardhat verify --network baseSepolia 0x1234567890123456789012345678901234567890 "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

## Troubleshooting

### "Insufficient funds"
You need testnet ETH. Visit the Base Sepolia faucet.

### "Invalid private key"
Make sure your private key in `.env` starts with `0x` and is the correct length (66 characters including 0x).

### "Network not found"
Make sure you're using the correct network name:
- `baseSepolia` for Base Sepolia testnet
- `base` for Base mainnet
- `sepolia` for Ethereum Sepolia testnet

### "Contract already verified"
This is fine - it means someone already verified it!

## Network Information

### Base Sepolia (Testnet)
- Chain ID: 84532
- RPC: https://sepolia.base.org
- Explorer: https://sepolia.basescan.org
- Faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

### Base Mainnet
- Chain ID: 8453
- RPC: https://mainnet.base.org
- Explorer: https://basescan.org
- Gas: Usually ~0.001-0.01 gwei

## Cost Estimates

### Deployment Cost
- Base Sepolia: FREE (testnet)
- Base Mainnet: ~$5-10 (varies with gas prices)

### Game Costs (Per Player)
- Bond: 0.001 ETH (~$2-3 at current prices)
- Gas to create game: ~$0.10
- Gas per move: ~$0.05
- Gas to withdraw: ~$0.08

## Security Notes

1. **Test First**: Always deploy to testnet first
2. **Small Stakes**: Start with small bond amounts
3. **Audit**: Consider getting the contract audited before mainnet
4. **Private Key**: Never share your private key
5. **Treasury Address**: Double-check the treasury address before deploying

## Next Steps

After deployment:

1. ✅ Update CONTRACT_ADDRESS in crypto-game.js
2. ✅ Test the game thoroughly on testnet
3. ✅ Verify the contract on BaseScan
4. ✅ Share your deployed game!
5. 💰 (Optional) Deploy to mainnet when ready

## Support

If you run into issues:
1. Check the [Hardhat documentation](https://hardhat.org/docs)
2. Check the [Base documentation](https://docs.base.org)
3. Review the deployment output for error messages
4. Make sure you have enough ETH for gas

Good luck! 🎮
