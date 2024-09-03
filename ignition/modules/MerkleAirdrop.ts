import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MerkleAirdropModule = buildModule("MerkleAirdropModule", (m) => {

    const erc20 = m.contract("MerkleAirdrop");

    return { erc20 };
});

export default MerkleAirdropModule;