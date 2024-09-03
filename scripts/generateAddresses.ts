import fs from 'fs';
import crypto from 'crypto';

// Function to generate a random Ethereum address
function generateRandomAddress(): string {
  const addressBytes = crypto.randomBytes(20);
  return '0x' + addressBytes.toString('hex');
}

// Function to generate a random amount between 10 and 100
function generateRandomAmount(): number {
  return Math.floor(Math.random() * 91) + 10; // 91 is the range (100 - 10 + 1)
}

// Generate 10 random addresses with amounts
const data: string[] = ['address,amount'];
for (let i = 0; i < 10; i++) {
  const address = generateRandomAddress();
  const amount = generateRandomAmount();
  data.push(`${address},${amount}`);
}

// Write to CSV file
fs.writeFileSync('airdrop.csv', data.join('\n'));

console.log('Sample airdrop data has been generated in airdrop.csv');