import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MerkleAirdropModule = buildModule("MerkleAirdropModule", (m) => {

    const tokenAddress = "0x4526D787658dcB156Cb00D5BF96573fA0866EeE5"

    const merkleRoot = "0x29ce1c451520e04e467abf60736a8150e816f3b7eb8957dc247b563b4f73a2b4"

    const MerkleAirdrop = m.contract("MerkleAirdrop", [tokenAddress, merkleRoot]);

    return { MerkleAirdrop };

});

export default MerkleAirdropModule;

// tokenAddress = 0x4526D787658dcB156Cb00D5BF96573fA0866EeE5
// merkleRoot = 0x29ce1c451520e04e467abf60736a8150e816f3b7eb8957dc247b563b4f73a2b4
// MebellieModule#Mcbellie - 0x4526D787658dcB156Cb00D5BF96573fA0866EeE5
// MerkleAirdropModule#MerkleAirdrop - 0x93d3176Ce5Ec26b6f61884b894199825FE882812