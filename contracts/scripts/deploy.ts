import { ethers, run } from "hardhat";

async function main() {
  console.log("Deploying Referendum...");

  const Referendum = await ethers.getContractFactory("Referendum");
  const referendum = await Referendum.deploy();
  await referendum.waitForDeployment();

  const address = await referendum.getAddress();
  console.log(`Referendum deployed to: ${address}`);

  // Wait for confirmations
  console.log("Waiting for confirmations...");
  await referendum.deploymentTransaction()?.wait(5);

  // Verify on Etherscan
  console.log("Verifying on Etherscan...");
  try {
    await run("verify:verify", {
      address: address,
      constructorArguments: [],
    });
    console.log("Verified!");
  } catch (e: any) {
    console.log("Verification failed:", e.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

