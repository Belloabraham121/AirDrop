import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import fs from "fs";
import csv from "csv-parser";

const values = [];
fs.createReadStream("airdrop.csv")
  .pipe(csv())
  .on("data", (row) => {
    values.push([row.address, row.amount]);
  })
  .on("end", () => {
    const tree = StandardMerkleTree.of(values, ["address", "uint256"]);
    console.log("Merkle Root:", tree.root);

    // Write the tree to a JSON file
    fs.writeFileSync("tree.json", JSON.stringify(tree.dump()));

    // Initialize an object to store proofs for all addresses
    const proofs = {};

    try {
      const loadedTree = StandardMerkleTree.load(JSON.parse(fs.readFileSync("tree.json", "utf8")));
      for (const [i, v] of loadedTree.entries()) {
        // Get the proof for each address
        const proof = loadedTree.getProof(i);
        proofs[v[0]] = proof; // Store the proof with the address as the key
      }

      // Write all proofs to a JSON file
      fs.writeFileSync("proofs.json", JSON.stringify(proofs, null, 2));
      console.log("All proofs have been saved to 'proofs.json'.");
      
    } catch (err) {
      console.error("Error reading or processing 'tree.json':", err);
    }
  })
  .on("error", (err) => {
    console.error("Error reading 'airdrop.csv':", err);
  });

  /// Merkle Root: 0x29ce1c451520e04e467abf60736a8150e816f3b7eb8957dc247b563b4f73a2b4
