// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TitanEventLogger {
    address public owner;

    bytes32 public latestMerkleRoot;
    uint256 public latestTimestamp;
    uint256 public totalBatches;

    event BatchLogged(
        bytes32 indexed merkleRoot,
        uint256 indexed timestamp,
        uint256 batchSize
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function logBatch(
        bytes32 merkleRoot,
        uint256 timestamp,
        uint256 batchSize
    ) external onlyOwner {
        require(merkleRoot != bytes32(0), "Zero merkle root");
        require(timestamp != 0, "Zero timestamp");
        require(batchSize != 0, "Zero batch size");

        latestMerkleRoot = merkleRoot;
        latestTimestamp  = timestamp;
        totalBatches    += 1;

        emit BatchLogged(merkleRoot, timestamp, batchSize);
    }
}
