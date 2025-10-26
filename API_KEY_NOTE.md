# API Key Update - BaseScan → Etherscan

## TL;DR

**You DON'T need an API key to deploy.** It's only needed for contract verification (optional).

If you want to verify your contract on BaseScan:

1. Go to https://etherscan.io/myapikey
2. Sign up / Log in
3. Create a new API key
4. Add to `.env` as `ETHERSCAN_API_KEY`

The same Etherscan API key works for:
- ✅ Ethereum Mainnet
- ✅ Ethereum Sepolia
- ✅ Base Mainnet
- ✅ Base Sepolia

## Why the Change?

BaseScan was acquired by Etherscan and now uses Etherscan's API infrastructure. This is actually better - one API key works everywhere!

## Do I Need It?

**For Deployment:** ❌ No, you can deploy without it

**For Verification:** ✅ Yes, you need it to verify your contract on the block explorer

**Why Verify?**
- Users can read your contract code on BaseScan
- Builds trust
- Makes your contract "official"
- Not required for the game to work

## Quick Deploy Without Verification

```bash
# 1. Just add your private key to .env
PRIVATE_KEY=0xYOUR_KEY_HERE

# 2. Deploy
npm run deploy:baseSepolia

# 3. Update CONTRACT_ADDRESS in crypto-game.js

# Done! Your game works, just without verified contract
```

## Deploy WITH Verification

```bash
# 1. Get Etherscan API key from https://etherscan.io/myapikey

# 2. Add to .env
PRIVATE_KEY=0xYOUR_KEY_HERE
ETHERSCAN_API_KEY=your_etherscan_api_key

# 3. Deploy
npm run deploy:baseSepolia

# 4. Verify (command will be shown in deploy output)
npx hardhat verify --network baseSepolia YOUR_ADDRESS "YOUR_TREASURY"

# Done! Contract is verified on BaseScan
```

## Bottom Line

Skip the API key if you just want to test. Add it later if you want the contract verified on BaseScan.
