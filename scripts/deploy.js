const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Treasury address - this will receive the 0.5% fee
  // You can change this to any address you want to receive fees
  const treasuryAddress = deployer.address;

  console.log("\nDeploying EvolutionOfTrust contract...");
  console.log("Treasury address:", treasuryAddress);

  // Deploy the contract
  const EvolutionOfTrust = await hre.ethers.getContractFactory("EvolutionOfTrust");
  const contract = await EvolutionOfTrust.deploy(treasuryAddress);

  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();

  console.log("\n✅ EvolutionOfTrust deployed to:", contractAddress);
  console.log("\n📋 IMPORTANT: Update crypto-game.js with this address:");
  console.log(`const CONTRACT_ADDRESS = "${contractAddress}";`);

  // Get network info
  const network = await hre.ethers.provider.getNetwork();
  console.log("\nNetwork:", network.name, "(chainId:", network.chainId.toString() + ")");

  // Show contract constants
  const bondAmount = await contract.BOND_AMOUNT();
  const maxRounds = await contract.MAX_ROUNDS();
  const treasuryFee = await contract.TREASURY_FEE_BPS();

  console.log("\nContract Configuration:");
  console.log("- Bond Amount:", hre.ethers.formatEther(bondAmount), "ETH");
  console.log("- Max Rounds:", maxRounds.toString());
  console.log("- Treasury Fee:", (Number(treasuryFee) / 100).toString() + "%");

  // Verification instructions
  console.log("\n📝 To verify on block explorer, run:");
  console.log(`npx hardhat verify --network ${network.name} ${contractAddress} "${treasuryAddress}"`);

  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contractAddress: contractAddress,
    treasuryAddress: treasuryAddress,
    bondAmount: hre.ethers.formatEther(bondAmount),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address
  };

  fs.writeFileSync(
    'deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n✅ Deployment info saved to deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
