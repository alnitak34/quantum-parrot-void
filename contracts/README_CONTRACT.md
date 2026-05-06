# TitanEventLogger.sol

## What it does

`TitanEventLogger` is a minimal on-chain audit log for off-chain game events.

The deployer (owner) calls `logBatch` once per batch of game runs. The call:

1. Validates the inputs (non-zero merkle root, timestamp, and batch size)
2. Stores `latestMerkleRoot`, `latestTimestamp`, and increments `totalBatches`
3. Emits `BatchLogged(merkleRoot, timestamp, batchSize)`

The Merkle root commits to the contents of that batch. Anyone can reconstruct the tree from the raw game data and verify a specific run was included using a standard Merkle proof.

**Deploy target: Monad mainnet**

---

## What it does not do

- Does not hold, transfer, or account for any funds or tokens
- Does not implement any reward or points logic
- Does not interact with user wallets
- Does not store individual game runs or player data on-chain (only the Merkle root)
- Does not have upgrade mechanisms (`delegatecall`, proxy patterns, etc.)
- Does not use `tx.origin`
- Does not have a fallback or receive function (not payable)
- Does not have a withdrawal function

---

## Security assumptions

| Assumption | Detail |
|---|---|
| Owner key is secure | `logBatch` is `onlyOwner`. If the owner key is compromised, an attacker can write arbitrary Merkle roots. Rotate by deploying a new contract. |
| Off-chain data integrity | The contract stores a root, not the data. Integrity of individual records depends on the off-chain pipeline that builds and verifies the tree. |
| No re-entrancy risk | No external calls are made. State is written before the event is emitted. |
| No integer overflow | Solidity ^0.8.20 has built-in overflow protection. `totalBatches` would need 2^256 increments to overflow. |
| No selfdestruct | The contract has no `selfdestruct` call. Deployed state is permanent. |

---

## Interface

```solidity
function logBatch(bytes32 merkleRoot, uint256 timestamp, uint256 batchSize) external;

event BatchLogged(bytes32 indexed merkleRoot, uint256 indexed timestamp, uint256 batchSize);

// Read-only state
bytes32 public latestMerkleRoot;
uint256 public latestTimestamp;
uint256 public totalBatches;
address public owner;
```

---

## Deployment

1. Compile with `solc ^0.8.20` or Hardhat/Foundry
2. Deploy to Monad mainnet — deployer address becomes `owner`
3. Set `TITAN_EVENT_LOGGER_ADDRESS` in `.env`
4. Run `node scripts/monadBatch.js` to start logging batches

No constructor arguments required.
