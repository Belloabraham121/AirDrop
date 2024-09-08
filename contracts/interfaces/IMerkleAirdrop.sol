// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.24;


interface IMerkleAirdrop {

     function ClaimAirdrop(bytes32[] memory proof, uint256 amount) external;

     function withdrawRemainingTokens() external;
}