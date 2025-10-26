# 🎉 Contract Deployed Successfully!

## Deployment Details

**Contract Address:** `0xa2eE3C8bc9511De79b3CA5868A42526a271Ccb35`

**Network:** Base Sepolia (Testnet)

**Chain ID:** 84532

**Deployer:** 0xe73417AcE35B4B62f0Cf9d0078b56569b079309E

**Treasury:** 0xe73417AcE35B4B62f0Cf9d0078b56569b079309E

**Block Explorer:** https://sepolia.basescan.org/address/0xa2eE3C8bc9511De79b3CA5868A42526a271Ccb35

## Game Configuration

- **Bond Amount:** 0.001 ETH per player
- **Total Rounds:** 10
- **Treasury Fee:** 0.5%
- **Winner Prize:** 0.002 ETH (minus fee)

## How to Play

1. **Open your site** and navigate to the Multiplayer section
2. **Connect MetaMask** - it will automatically prompt you to switch to Base Sepolia
3. **Click "Connect Wallet"** and approve the connection
4. **Click "Create or Join Game"**
5. **Approve the 0.001 ETH transaction** to stake your bond
6. **Wait for an opponent** to join (or get a friend to join!)
7. **Play 10 rounds** of Trust vs Cheat
8. **Winner takes all!** (or split on tie)

## Network Auto-Switch

The webapp now automatically detects if you're on the wrong network and will:
- Prompt you to switch to Base Sepolia
- Automatically add Base Sepolia to MetaMask if needed
- Show helpful error messages if something goes wrong

## Get Test ETH

Need more test ETH? Visit:
- https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- https://www.alchemy.com/faucets/base-sepolia

## What's Next?

### Optional: Verify Your Contract

```bash
npx hardhat verify --network baseSepolia \
  0xa2eE3C8bc9511De79b3CA5868A42526a271Ccb35 \
  "0xe73417AcE35B4B62f0Cf9d0078b56569b079309E"
```

This makes your contract code readable on BaseScan (builds trust).

### Test the Game!

1. Open two browser windows (or use a friend)
2. Connect different wallets
3. Player 1: Create game
4. Player 2: Join game
5. Play all 10 rounds
6. Check that winner gets the prize!

### Deploy to Mainnet (When Ready)

When you're ready for real money:

```bash
npm run deploy:base
```

Then update `CONTRACT_ADDRESS` in `crypto-game.js` with the mainnet address.

## Files Updated

✅ `crypto-game.js` - Contract address updated
✅ `deployment-info.json` - Deployment record saved
✅ Network detection added - Auto-switches to Base Sepolia

## Support

Your contract is live at:
https://sepolia.basescan.org/address/0xa2eE3C8bc9511De79b3CA5868A42526a271Ccb35

Have fun and may the best strategist win! 🎮
