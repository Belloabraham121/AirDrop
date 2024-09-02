import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MerkleAirdrop, MockERC20 } from "../typechain-types";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

describe("MerkleAirdrop", function () {
  let merkleAirdrop: MerkleAirdrop;
  let token: MockERC20;
  let owner: SignerWithAddress;
  let addrs: SignerWithAddress[];
  let merkleTree: MerkleTree;
  let merkleRoot: string;

  const airdropData = [
    { address: "0x8873a878eefdc293f63231644f5826cd9d202af0", amount: "31" },
    { address: "0x65c96ea8ace84c015f97d9e7d053cd1e487d5f7c", amount: "64" },
    { address: "0x64df1bb7da0ee8ea7afb70b553c3a6ed3ab217f5", amount: "24" },
    { address: "0x9c6b1d7464ab8f0732ddcfa72bbc1a1341e67ad6", amount: "34" },
    { address: "0x7c8fa030b2f4f886b30448dd92824ae8483811ca", amount: "94" },
    { address: "0x324c5bb20037b8b548c317446cc774db1365c7ff", amount: "32" },
    { address: "0xb94a3dd080e56c3dd639bfb61fe992b37f41c6b3", amount: "85" },
    { address: "0x767abb7beffe332eccf78056ae96dc15de00dd99", amount: "16" },
    { address: "0xa5f1d30e675985fa9da69d1ddd9139ce0bf06c46", amount: "59" },
    { address: "0x93feae513357da2037550e5b936a4ad7e91d0305", amount: "54" }
  ];

  beforeEach(async function () {
    [owner, ...addrs] = await ethers.getSigners();

    // Deploy mock ERC20 token
    const Token = await ethers.getContractFactory("MockERC20");
    token = await Token.deploy("Mock Token", "MTK") as MockERC20;
    await token.deployed();

    // Generate Merkle Tree
    const leaves = airdropData.map(x => 
      ethers.utils.solidityKeccak256(["address", "uint256"], [x.address, ethers.utils.parseEther(x.amount)])
    );
    merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    merkleRoot = merkleTree.getHexRoot();

    // Deploy MerkleAirdrop contract
    const MerkleAirdrop = await ethers.getContractFactory("MerkleAirdrop");
    merkleAirdrop = await MerkleAirdrop.deploy(token.address, merkleRoot) as MerkleAirdrop;
    await merkleAirdrop.deployed();

    // Transfer tokens to MerkleAirdrop contract
    await token.transfer(merkleAirdrop.address, ethers.utils.parseEther("1000"));
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await merkleAirdrop.owner()).to.equal(owner.address);
    });

    it("Should set the correct token address", async function () {
      expect(await merkleAirdrop.token()).to.equal(token.address);
    });

    it("Should set the correct merkle root", async function () {
      expect(await merkleAirdrop.merkleRoot()).to.equal(merkleRoot);
    });
  });

  describe("Claiming", function () {
    it("Should allow valid claims", async function () {
      const claimData = airdropData[0];
      const amount = ethers.utils.parseEther(claimData.amount);
      const leaf = ethers.utils.solidityKeccak256(["address", "uint256"], [claimData.address, amount]);
      const proof = merkleTree.getHexProof(leaf);

      await expect(merkleAirdrop.claim(amount, proof))
        .to.emit(merkleAirdrop, "AirdropClaimed")
        .withArgs(claimData.address, amount);

      expect(await token.balanceOf(claimData.address)).to.equal(amount);
    });

    it("Should reject invalid claims", async function () {
      const claimData = airdropData[0];
      const invalidAmount = ethers.utils.parseEther("100"); // Invalid amount
      const leaf = ethers.utils.solidityKeccak256(["address", "uint256"], [claimData.address, invalidAmount]);
      const proof = merkleTree.getHexProof(leaf);

      await expect(merkleAirdrop.claim(invalidAmount, proof))
        .to.be.revertedWith("Invalid merkle proof");
    });

    it("Should prevent double claims", async function () {
      const claimData = airdropData[0];
      const amount = ethers.utils.parseEther(claimData.amount);
      const leaf = ethers.utils.solidityKeccak256(["address", "uint256"], [claimData.address, amount]);
      const proof = merkleTree.getHexProof(leaf);

      await merkleAirdrop.claim(amount, proof);

      await expect(merkleAirdrop.claim(amount, proof))
        .to.be.revertedWith("Address has already claimed");
    });

    it("Should fail if contract doesn't have enough tokens", async function () {
      // First, withdraw all tokens from the contract
      await merkleAirdrop.connect(owner).withdrawRemainingTokens();

      const claimData = airdropData[0];
      const amount = ethers.utils.parseEther(claimData.amount);
      const leaf = ethers.utils.solidityKeccak256(["address", "uint256"], [claimData.address, amount]);
      const proof = merkleTree.getHexProof(leaf);

      await expect(merkleAirdrop.claim(amount, proof))
        .to.be.revertedWith("Token transfer failed");
    });

    it("Should allow claims for all addresses in the airdrop data", async function () {
      for (const data of airdropData) {
        const amount = ethers.utils.parseEther(data.amount);
        const leaf = ethers.utils.solidityKeccak256(["address", "uint256"], [data.address, amount]);
        const proof = merkleTree.getHexProof(leaf);

        await expect(merkleAirdrop.claim(amount, proof))
          .to.emit(merkleAirdrop, "AirdropClaimed")
          .withArgs(data.address, amount);

        expect(await token.balanceOf(data.address)).to.equal(amount);
      }
    });
  });

  describe("Updating Merkle Root", function () {
    it("Should allow owner to update merkle root", async function () {
      const newMerkleRoot = ethers.utils.randomBytes(32);
      await expect(merkleAirdrop.updateMerkleRoot(newMerkleRoot))
        .to.emit(merkleAirdrop, "MerkleRootUpdated")
        .withArgs(ethers.utils.hexlify(newMerkleRoot));

      expect(await merkleAirdrop.merkleRoot()).to.equal(ethers.utils.hexlify(newMerkleRoot));
    });

    it("Should not allow non-owner to update merkle root", async function () {
      const newMerkleRoot = ethers.utils.randomBytes(32);
      await expect(merkleAirdrop.connect(addrs[0]).updateMerkleRoot(newMerkleRoot))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Withdrawing Remaining Tokens", function () {
    it("Should allow owner to withdraw remaining tokens", async function () {
      const initialBalance = await token.balanceOf(owner.address);
      await merkleAirdrop.withdrawRemainingTokens();
      const finalBalance = await token.balanceOf(owner.address);

      expect(finalBalance.sub(initialBalance)).to.equal(ethers.utils.parseEther("1000"));
    });

    it("Should not allow non-owner to withdraw remaining tokens", async function () {
      await expect(merkleAirdrop.connect(addrs[0]).withdrawRemainingTokens())
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});