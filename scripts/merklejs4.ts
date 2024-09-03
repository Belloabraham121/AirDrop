import fs from 'fs';
import csv from 'csv-parser';
import { MerkleTree } from 'merkletreejs';
import { ethers } from 'ethers';

interface AirdropData {
  address: string;
  amount: string;
}

// Helper function to match the smart contract's leaf generation
function generateLeaf(address: string, amount: bigint): Buffer {
  return Buffer.from(
    ethers.keccak256(
      ethers.solidityPacked(['address', 'uint256'], [address, amount])
    ).slice(2),
    'hex'
  );
}

// Step 1: Read CSV and Compute Leaves
const leaves: { [key: string]: Buffer } = {};  // Store leaves by address
const airdropData: AirdropData[] = [];         // Store airdrop data for reference

fs.createReadStream('airdrop.csv')
  .pipe(csv())
  .on('data', (row: AirdropData) => {
    const amount = ethers.parseUnits(row.amount, 18);  // Assuming 18 decimals, adjust if different
    const leaf = generateLeaf(row.address, amount);
    leaves[row.address] = leaf;
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
      const amount = ethers.parseUnits(data.amount, 18);
      const leaf = leaves[data.address];
      const proof = tree.getHexProof(leaf);
      result.push({
        address: data.address,
        amount: amount.toString(),  // Store amount in wei
        leaf: `0x${leaf.toString('hex')}`,
        proof: proof,
      });
    });

    // Step 4: Save Proofs to JSON File
    fs.writeFileSync('proofs4.json', JSON.stringify(result, null, 2));

    console.log('Proofs generated and saved to proofs.json');
  });

  // Merkle Root: 0x346a21fb26d6e2a26409d903bbdcddae0c56ef3446512f3e3767cef74d196466