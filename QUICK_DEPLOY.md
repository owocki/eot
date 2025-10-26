# Quick Deploy - TL;DR

## 5-Minute Deployment to Base Sepolia

### 1. Get Test ETH
Visit: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Your Private Key
```bash
cp .env.example .env
nano .env
# Add your private key from MetaMask
```

### 4. Deploy
```bash
npm run deploy:baseSepolia
```

### 5. Update Contract Address
Copy the address from the output and paste it into `crypto-game.js`:

```javascript
const CONTRACT_ADDRESS = "0xYOUR_DEPLOYED_ADDRESS_HERE";
```

### 6. Test!
Open your site, go to Multiplayer, and click "Connect Wallet"

---

## That's It! 🎉

For more details, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
