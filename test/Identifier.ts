import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

const baseURI = "ipfs://";

describe("Identifier", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployIdentifierFixture() {
    const [owner] = await ethers.getSigners();
    const Identifier = await ethers.getContractFactory("Identifier");
    const identifier = await Identifier.deploy(
      "Lensmo Wallet Identifier",
      "LWI",
      owner.address
    );
    // await identifier.deployed();

    const TestAvatar = await ethers.getContractFactory("TestAvatar");
    const testAvatar = await TestAvatar.deploy();
    // await testAvatar.deployed();

    return {
      identifier,
      testAvatar,
    };
  }

  describe("Mint", function () {
    it("Should log with the correct name", async function () {
      const { identifier, testAvatar } = await loadFixture(
        deployIdentifierFixture
      );
      const name = "twitter:Rory";
      const txReceipt = await identifier
        .mint(testAvatar.address, name)
        .then((tx: any) => tx.wait());
      const nameValue = txReceipt.events.find(
        ({ event }: { event: string }) => event === "Mint"
      ).args[2];

      expect(nameValue).to.eq(name);
    });
  });
});
