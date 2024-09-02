import fs from 'fs';
import csv from 'csv-parser';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';

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
    const leaf = keccak256(Buffer.from(row.address + row.amount));
    leaves[row.address] = leaf;
    airdropData.push(row);
  })
  .on('end', () => {
    // Step 2: Create Merkle Tree
    const tree = new MerkleTree(Object.values(leaves), keccak256, { sortPairs: true });
    const root = tree.getHexRoot();
    console.log('Merkle Root:', root);

    // Step 3: Generate Proofs
    const result: {
      address: string;
      leaf: string;
      proof: string[];
    }[] = [];

    airdropData.forEach((data, index) => {
      const leaf = leaves[data.address];
      const proof = tree.getHexProof(leaf);
      result.push({
        address: data.address,
        leaf: `0x${leaf.toString('hex')}`,
        proof: proof,
      });
    });

    // Step 4: Save Proofs to JSON File
    fs.writeFileSync('proofs2.json', JSON.stringify(result, null, 2));
  });

  // Merkle Root: 0x250a4049fb2b6f1e106389c4abaf1cfc3420f8f5a4dbaf829fcbc60fe7566e69
