import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { keccak256 } from "ethers";
import { solidityPacked } from "ethers";
import { MerkleTree } from "merkletreejs";
import fs from "fs";
import path from "path";

describe("MerkleAirdrop", function () {
  async function deployFixture() {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    // Deploy ERC20 token
    const Mcbellie = await ethers.getContractFactory("Mcbellie");
    const token = await Mcbellie.deploy();

    // Load proofs from file
    const proofs = JSON.parse(fs.readFileSync(path.join(__dirname, "proofs.json"), "utf8"));

    // Create merkle tree
    const leaves = [
      { address: addr1.address, amount: ethers.parseEther("100") },
      { address: addr2.address, amount: ethers.parseEther("200") },
      { address: addr3.address, amount: ethers.parseEther("300") },
    ].map((x) => keccak256(solidityPacked(["address", "uint256"], [x.address, x.amount])));

    const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = merkleTree.getHexRoot();

    // Deploy MerkleAirdrop
    const MerkleAirdrop = await ethers.getContractFactory("MerkleAirdrop");
    const airdrop = await MerkleAirdrop.deploy(await token.getAddress(), root);

    // Transfer tokens to the airdrop contract
    await token.transfer(await airdrop.getAddress(), ethers.parseEther("1000"));

    return { token, airdrop, owner, addr1, addr2, addr3, merkleTree, proofs };
  }

  it("Should allow valid claims", async function () {
    const { airdrop, addr1, proofs } = await loadFixture(deployFixture);

    const proof = proofs[addr1.address];

    await expect(airdrop.connect(addr1).ClaimAirdrop(proof, ethers.parseEther("100")))
      .to.emit(airdrop, "AirdropClaimed")
      .withArgs(addr1.address, ethers.parseEther("100"));
  });

  it("Should prevent double claims", async function () {
    const { airdrop, addr1, proofs } = await loadFixture(deployFixture);

    const proof = proofs[addr1.address];

    // First claim should succeed
    await airdrop.connect(addr1).ClaimAirdrop(proof, ethers.parseEther("100"));

    // Second claim should fail
    await expect(
      airdrop.connect(addr1).ClaimAirdrop(proof, ethers.parseEther("100"))
    ).to.be.revertedWith("Address has already claimed");
  });
});
