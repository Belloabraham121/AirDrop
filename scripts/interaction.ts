import { ethers } from "hardhat";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { IERC20, IMerkleAirdrop } from "../typechain-types";

async function main() {
  const mcbellieTokenAddress = "0x4526D787658dcB156Cb00D5BF96573fA0866EeE5";
  const mcbellie = await ethers.getContractAt("IERC20", mcbellieTokenAddress);

  const merkleAirdropContractAddress = "0x93d3176Ce5Ec26b6f61884b894199825FE882812";
  const merkleAirdrop = await ethers.getContractAt("IMerkleAirdrop", merkleAirdropContractAddress);

  // Hardcode the addresses and amounts used in the original Merkle tree
  const elements = [
    ["0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2", ethers.parseEther("31")],
    ["0x65c96ea8ace84c015f97d9e7d053cd1e487d5f7c", ethers.parseEther("64")],
    ["0x64df1bb7da0ee8ea7afb70b553c3a6ed3ab217f5", ethers.parseEther("24")],
  ];
  const merkleTree = StandardMerkleTree.of(elements, ["address", "uint256"]);

  // Choose the claimer (in this case, the first address in our list)
  const claimerAddress = "0x65c96ea8ace84c015f97d9e7d053cd1e487d5f7c";
  const claimAmount = ethers.parseEther("64");

  // Find the proof for the claimer
  let proof;
  for (const [i, v] of merkleTree.entries()) {
    if (v[0] === claimerAddress) {
      proof = merkleTree.getProof(i);
      break;
    }
  }

  if (!proof) {
    throw new Error("Proof not found for the given address");
  }

  // Get the signer
  const [signer] = await ethers.getSigners();

  // Approve contract to spend token
  const approveAmount = ethers.parseEther("1000000");
  const approveTx = await mcbellie.connect(signer).approve(merkleAirdropContractAddress, approveAmount);
  await approveTx.wait();
  console.log("Approved Amount:", approveTx.hash);

  // Claim the airdrop
  const claimAirdrop = await merkleAirdrop.connect(signer).ClaimAirdrop(proof, claimAmount);
  await claimAirdrop.wait();
  console.log("Airdrop claimed:", claimAirdrop.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });