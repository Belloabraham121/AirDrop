import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { keccak256, solidityPacked } from "ethers";
import { MerkleTree } from "merkletreejs";

describe("MerkleAirdrop", function () {
  async function deployFixture() {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    // Deploy ERC20 token
    const Mcbellie = await ethers.getContractFactory("Mcbellie");
    const token = await Mcbellie.deploy();

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

    return { token, airdrop, owner, addr1, addr2, addr3, merkleTree };
  }

  it("Should deploy the contract with correct ERC20 token and Merkle root", async function () {
    const { token, airdrop, merkleTree } = await loadFixture(deployFixture);

    expect(await airdrop.token()).to.equal(await token.getAddress());
    expect(await airdrop.merkleRoot()).to.equal(merkleTree.getHexRoot());
  });

  it("Should allow valid claims", async function () {
    const { airdrop, addr1, merkleTree } = await loadFixture(deployFixture);

    const leaf = keccak256(solidityPacked(
      ["address", "uint256"],
      [addr1.address, ethers.parseEther("100")]
    ));
    const proof = merkleTree.getHexProof(leaf);

    await expect(airdrop.connect(addr1).ClaimAirdrop(proof, ethers.parseEther("100")))
      .to.emit(airdrop, "AirdropClaimed")
      .withArgs(addr1.address, ethers.parseEther("100"));
  });

  it("Should reject invalid claims", async function () {
    const { airdrop, addr1, addr2, merkleTree } = await loadFixture(deployFixture);

    const leaf = keccak256(solidityPacked(
      ["address", "uint256"],
      [addr1.address, ethers.parseEther("100")]
    ));
    const proof = merkleTree.getHexProof(leaf);

    // Try to claim with wrong address
    await expect(
      airdrop.connect(addr2).ClaimAirdrop(proof, ethers.parseEther("100"))
    ).to.be.revertedWith("Invalid proof");

    // Try to claim with wrong amount
    await expect(
      airdrop.connect(addr1).ClaimAirdrop(proof, ethers.parseEther("200"))
    ).to.be.revertedWith("Invalid proof");
  });

  it("Should prevent double claims", async function () {
    const { airdrop, addr1, merkleTree } = await loadFixture(deployFixture);

    const leaf = keccak256(solidityPacked(
      ["address", "uint256"],
      [addr1.address, ethers.parseEther("100")]
    ));
    const proof = merkleTree.getHexProof(leaf);

    // First claim should succeed
    await airdrop.connect(addr1).ClaimAirdrop(proof, ethers.parseEther("100"));

    // Second claim should fail
    await expect(
      airdrop.connect(addr1).ClaimAirdrop(proof, ethers.parseEther("100"))
    ).to.be.revertedWith("Address has already claimed");
  });

  it("Should allow owner to withdraw remaining tokens", async function () {
    const { airdrop, token, owner } = await loadFixture(deployFixture);

    const initialBalance = await token.balanceOf(owner.address);
    await airdrop.connect(owner).withdrawRemainingTokens();
    const finalBalance = await token.balanceOf(owner.address);

    expect(finalBalance - initialBalance).to.equal(ethers.parseEther("1000"));
  });
});