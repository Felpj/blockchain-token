const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Deploy do contrato
  const HX1000Token = await hre.ethers.getContractFactory("HX1000Token");
  const token = await HX1000Token.deploy();
  await token.waitForDeployment();

  const tokenAddress = await token.getAddress();
  console.log("HX1000Token deployed to:", tokenAddress);

  // Criar arquivo de configuração com endereço e ABI do contrato
  const contractsDir = path.join(__dirname, "..", "src", "config");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  const contractData = {
    address: tokenAddress,
    abi: JSON.parse(token.interface.formatJson())
  };

  fs.writeFileSync(
    path.join(contractsDir, "contract-config.json"),
    JSON.stringify(contractData, null, 2)
  );

  console.log("Contract data saved to src/config/contract-config.json");

  // Verificar contrato
  console.log("Waiting for 5 block confirmations...");
  await token.deploymentTransaction().wait(5);

  console.log("Verifying contract...");
  await hre.run("verify:verify", {
    address: tokenAddress,
    constructorArguments: []
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });