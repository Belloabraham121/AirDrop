# Merkle Airdrop Project

This project implements a Merkle tree-based airdrop system using Solidity and Hardhat.

## Setup and Running the merkle.js Script

1. Install dependencies:
   ```
   npm install csv-parser merkletreejs keccak256
   ```

2. Prepare your `airdrop.csv` file with the following format:
   ```
   address,amount
   0x123...abc,100
   0x456...def,200
   ```

3. Run the script:
   ```
   node merkle.js
   ```

4. The script will output the Merkle root and generate a `proofs.json` file.

## Deploying the MerkleAirdrop Contract

1. Set up your Hardhat environment and network configurations.

2. Deploy the contract using the following command:
   ```
   npx hardhat run scripts/deploy.js --network <your-network>
   ```

   Replace `<your-network>` with your desired network (e.g., `localhost`, `rinkeby`, etc.).

3. The deployment script should pass the ERC20 token address and the Merkle root to the constructor.

## Generating Proofs for Claiming the Airdrop

1. The `merkle.js` script generates a `proofs.json` file containing proofs for each address.

2. To claim an airdrop, users need their address, amount, and the corresponding proof from `proofs.json`.

3. Example claim function call:
   ```javascript
   await merkleAirdrop.claim(amount, proof);
   ```

## Running Tests

Execute the test suite using:
```
npx hardhat test
```

## Assumptions and Limitations

1. The CSV file is assumed to be well-formed and contain valid Ethereum addresses.
2. The contract assumes that the ERC20 token has sufficient decimals to handle the amounts in the CSV file.
3. The contract owner is responsible for funding the contract with tokens before users can claim.
4. Updating the Merkle root does not invalidate previous claims, so care should be taken when updating.

## Security Considerations

1. Ensure that the Merkle root is generated from a trusted source of data.
2. Be cautious when calling `updateMerkleRoot` as it can significantly change the airdrop distribution.
3. The `withdrawRemainingTokens` function should only be called after the airdrop period has concluded.