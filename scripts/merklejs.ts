import fs from 'fs';
import csv from 'csv-parser';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';

interface AirdropData {
  address: string;
  amount: string;
}

const leaves: Buffer[] = [];

fs.createReadStream('airdrop.csv')
  .pipe(csv())
  .on('data', (row: AirdropData) => {
    const leaf = keccak256(`${row.address},${row.amount}`);
    leaves.push(leaf);
  })
  .on('end', () => {
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = tree.getHexRoot();
    console.log('Merkle Root:', root);

    // Save proofs for each address
    const proofs: { [key: string]: string[] } = {};
    leaves.forEach((leaf, index) => {
      const proof = tree.getHexProof(leaf);
      proofs[`0x${leaf.toString('hex')}`] = proof;
    });
    fs.writeFileSync('proofs.json', JSON.stringify(proofs, null, 2));
  });

  /// Merkle Root: 0x250a4049fb2b6f1e106389c4abaf1cfc3420f8f5a4dbaf829fcbc60fe7566e69