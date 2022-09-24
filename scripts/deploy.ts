import { ethers } from "hardhat";

async function main() {
  const name: string = "Test";
  const symbol: string = "TEST";
  const address: string = "0xf0d5D3FcBFc0009121A630EC8AB67e012117f40c";
  const Identifier = await ethers.getContractFactory("Identifier");
  const identifier = await Identifier.deploy(name, symbol, address);

  const tx = await identifier.deployed();

  console.log(tx);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
