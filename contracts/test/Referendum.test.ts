import { expect } from "chai";
import { ethers } from "hardhat";
import { Referendum } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Referendum Contract Tests
 * 
 * Note: FHE operations (FHE.asEuint64, FHE.select, etc.) require Zama's
 * precompiled contracts and can only be fully tested on Sepolia testnet.
 * 
 * These tests cover:
 * - Deployment verification
 * - Input validation (before FHE operations)
 * - View function behavior
 * - Edge cases
 */
describe("Referendum", function () {
  let referendum: Referendum;
  let owner: HardhatEthersSigner;
  let voter1: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, voter1] = await ethers.getSigners();
    const ReferendumFactory = await ethers.getContractFactory("Referendum");
    referendum = await ReferendumFactory.deploy();
    await referendum.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await referendum.getAddress()).to.be.properAddress;
    });

    it("Should initialize with zero proposal count", async function () {
      expect(await referendum.proposalCount()).to.equal(0);
    });
  });

  describe("Input Validation", function () {
    it("Should reject empty title", async function () {
      await expect(
        referendum.createProposal("", 5)
      ).to.be.revertedWith("Empty title");
    });

    it("Should reject zero duration", async function () {
      await expect(
        referendum.createProposal("Test Proposal", 0)
      ).to.be.revertedWith("Min 1 minute");
    });
  });

  describe("View Functions", function () {
    it("getProposal should return exists=false for non-existent proposal", async function () {
      const [, , , exists] = await referendum.getProposal(999);
      expect(exists).to.be.false;
    });

    it("hasUserVoted should return false for non-existent proposal", async function () {
      expect(await referendum.hasUserVoted(999, voter1.address)).to.be.false;
    });

    it("isEnded should return true for non-existent proposal (endTime=0)", async function () {
      expect(await referendum.isEnded(999)).to.be.true;
    });
  });

  describe("Access Control", function () {
    it("allowDecryption should reject for non-existent proposal", async function () {
      await expect(
        referendum.allowDecryption(999)
      ).to.be.revertedWith("Not found");
    });

    it("vote should reject for non-existent proposal", async function () {
      const fakeHandle = ethers.zeroPadBytes("0x00", 32);
      const fakeProof = "0x00";
      
      await expect(
        referendum.vote(999, fakeHandle, fakeProof)
      ).to.be.revertedWith("Not found");
    });

    it("getProposalHandles should reject for non-existent proposal", async function () {
      await expect(
        referendum.getProposalHandles(999)
      ).to.be.revertedWith("Not found");
    });
  });

  describe("Contract Interface", function () {
    it("Should expose proposalCount as public", async function () {
      const count = await referendum.proposalCount();
      expect(count).to.be.a("bigint");
    });

    it("Should expose hasVoted mapping", async function () {
      const voted = await referendum.hasVoted(1, owner.address);
      expect(voted).to.be.false;
    });
  });
});

/**
 * FHE Integration Tests (Sepolia Only)
 * 
 * The following scenarios require Sepolia testnet:
 * 
 * 1. createProposal with FHE initialization
 *    - FHE.asEuint64(0) creates encrypted counters
 *    - FHE.allowThis() sets ACL permissions
 * 
 * 2. vote with encrypted input
 *    - FHE.fromExternal() validates encrypted vote
 *    - FHE.select() conditionally updates counters
 *    - FHE.add() performs homomorphic addition
 * 
 * 3. allowDecryption after voting ends
 *    - FHE.makePubliclyDecryptable() enables result reveal
 *    - Relayer can then decrypt via public-decrypt API
 * 
 * To run integration tests on Sepolia:
 *   npx hardhat test --network sepolia
 */
