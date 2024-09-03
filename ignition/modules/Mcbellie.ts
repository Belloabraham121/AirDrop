import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MebellieModule = buildModule("MebellieModule", (m) => {

    const erc20 = m.contract("Mcbellie");

    return { erc20 };
});

export default MebellieModule;
