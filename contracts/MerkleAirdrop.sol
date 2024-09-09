// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";



contract MerkleAirdrop is Ownable{

    bytes32 public merkleRoot;
    IERC20 public token;

    mapping(address => bool) public hasClaimed;

    event AirdropClaimed(address indexed claimant, uint256 amount);

    
    constructor(address _token, bytes32 _merkleRoot) Ownable(msg.sender){
        token = IERC20(_token);
        merkleRoot = _merkleRoot;
    }
    


    function ClaimAirdrop(bytes32[] memory proof, uint256 amount) public {
        require(!hasClaimed[msg.sender], "Address has already claimed");
    
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender, amount))));
    
        require(MerkleProof.verify(proof, merkleRoot, leaf), "Invalid proof");
    
        // Mark the address as claimed before transferring tokens
        hasClaimed[msg.sender] = true;
    
        IERC20(token).transfer(msg.sender, amount);
        emit AirdropClaimed(msg.sender, amount);
    }
    

    function withdrawRemainingTokens() external onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        require(token.transfer(owner(), balance), "Token transfer failed");
    }

}