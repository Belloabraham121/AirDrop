import fs from 'fs';
import csv from 'csv-parser';
import { MerkleTree } from 'merkletreejs';
import { ethers } from 'ethers';

interface AirdropData {
  address: string;
  amount: string;
}

// Step 1: Read CSV and Compute Leaves
const leaves: { [key: string]: Buffer } = {};  // Store leaves by address
const airdropData: AirdropData[] = [];         // Store airdrop data for reference

fs.createReadStream('airdrop.csv')
  .pipe(csv())
  .on('data', (row: AirdropData) => {
    const leaf = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'uint256'],
        [row.address, ethers.parseUnits(row.amount, 18)]  // Assuming 18 decimals, adjust if different
      )
    );
    leaves[row.address] = Buffer.from(leaf.slice(2), 'hex');  // Remove '0x' prefix and convert to Buffer
    airdropData.push(row);
  })
  .on('end', () => {
    // Step 2: Create Merkle Tree
    const tree = new MerkleTree(Object.values(leaves), ethers.keccak256, { sortPairs: true });
    const root = tree.getHexRoot();
    console.log('Merkle Root:', root);

    // Step 3: Generate Proofs
    const result: {
      address: string;
      amount: string;
      leaf: string;
      proof: string[];
    }[] = [];

    airdropData.forEach((data) => {
      const leaf = leaves[data.address];
      const proof = tree.getHexProof(leaf);
      result.push({
        address: data.address,
        amount: ethers.parseUnits(data.amount, 18).toString(),  // Store amount in wei
        leaf: `0x${leaf.toString('hex')}`,
        proof: proof,
      });
    });

    // Step 4: Save Proofs to JSON File
    fs.writeFileSync('proofs3.json', JSON.stringify(result, null, 2));

    console.log('Proofs generated and saved to proofs.json');
  });

  // Merkle Root: 0xb1144f7fec79e322a36b5eac327c6eaed074877a3dbeaa50e015a53a69edf56d