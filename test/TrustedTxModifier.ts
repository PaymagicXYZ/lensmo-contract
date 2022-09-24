import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { _TypedDataEncoder, parseEther } from "ethers/lib/utils";
import { encodeMulti, MetaTransaction } from "ethers-multisend";
import { getSignedTransaction, ownerPK } from "../utils/signing";

describe("TrustedTxModifier", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployTestAvatarFixture() {
    const [owner, recipient1, recipient2] = await ethers.getSigners();

    const MultiSend = await ethers.getContractFactory("MultiSend");
    const multiSend = await MultiSend.deploy();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockERC20 = await MockERC20.deploy("Mock", "MOCK", 18);

    const MockERC20_2 = await ethers.getContractFactory("MockERC20");
    const mockERC20_2 = await MockERC20_2.deploy("Mock_2", "MOCK_2", 18);

    const TestAvatar = await ethers.getContractFactory("TestAvatar");
    const testAvatar = await TestAvatar.deploy();

    const TrustedTxModifier = await ethers.getContractFactory(
      "TrustedTxModifier"
    );
    const trustedTxModifier = await TrustedTxModifier.deploy(
      owner.address,
      testAvatar.address,
      testAvatar.address
    );

    return {
      recipient1,
      recipient2,
      multiSend,
      mockERC20,
      mockERC20_2,
      testAvatar,
      trustedTxModifier,
    };
  }

  describe("executeTransaction", function () {
    it("Should allow tokens to transfer with the correct offchain signature", async function () {
      const {
        recipient1,
        recipient2,
        multiSend,
        mockERC20,
        mockERC20_2,
        testAvatar,
        trustedTxModifier,
      } = await loadFixture(deployTestAvatarFixture);

      await testAvatar.setModule(trustedTxModifier.address);

      mockERC20.mint(testAvatar.address, parseEther("10000"));
      mockERC20_2.mint(testAvatar.address, parseEther("10000"));

      const txs: MetaTransaction[] = [
        {
          to: mockERC20.address,
          value: "0",
          data: (
            await mockERC20.populateTransaction.transfer(
              recipient1.address,
              parseEther("10000")
            )
          ).data!,
        },
        {
          to: mockERC20_2.address,
          value: "0",
          data: (
            await mockERC20_2.populateTransaction.transfer(
              recipient2.address,
              parseEther("10000")
            )
          ).data!,
        },
      ];

      const { to, value, data, operation } = encodeMulti(
        txs,
        multiSend.address
      );

      const signed = await getSignedTransaction(
        trustedTxModifier,
        ownerPK,
        to,
        value,
        data,
        operation!,
        Number(await trustedTxModifier.nonce())
      );

      const sigParams = { v: signed.v, r: signed.r, s: signed.s };

      await trustedTxModifier.executeTransaction(
        signed.to,
        signed.value,
        signed.data,
        signed.operation,
        sigParams
      );

      expect(await mockERC20.balanceOf(recipient1.address)).to.equal(
        parseEther("10000")
      );
      expect(await mockERC20_2.balanceOf(recipient2.address)).to.equal(
        parseEther("10000")
      );
    });
  });
});
