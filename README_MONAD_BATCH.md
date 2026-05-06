# Monad Batch — TitanEventLogger

Manual script that reads top unprocessed game runs from Supabase, commits
a Merkle root to `TitanEventLogger.sol` on Monad mainnet, then stamps each
row with the transaction hash.

No frontend changes. No user wallets. No rewards. Read → hash → write.

---

## How it works

```
Supabase (game_runs)
  │
  │  SELECT id, game, score, x_handle, created_at
  │  WHERE tx_hash IS NULL
  │  ORDER BY score DESC LIMIT 10
  ▼
scripts/merkle.js
  │
  │  keccak256(keccak256(abi.encodePacked(id, game, score, x_handle, created_at)))
  │  → sorted binary Merkle tree
  │  → merkleRoot (bytes32)
  ▼
TitanEventLogger.logBatch(merkleRoot, timestamp)  [Monad mainnet]
  │
  │  tx confirmed
  ▼
Supabase UPDATE game_runs SET tx_hash = '0x...' WHERE id IN (...)
```

---

## Prerequisites

**Node.js 18+** (ESM support required)

Install script dependencies (run from project root):

```bash
npm install --save-dev ethers @supabase/supabase-js dotenv
```

Or if you prefer keeping scripts isolated:

```bash
cd scripts
npm init -y
npm install ethers @supabase/supabase-js dotenv
```

---

## Setup

### 1. Copy and fill in `.env`

```bash
cp .env.example .env
```

Edit `.env` and set:

| Variable | Where to find it |
|---|---|
| `SUPABASE_URL` | Supabase dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API → **service_role** |
| `MONAD_RPC_URL` | `https://rpc.monad.xyz` (mainnet) |
| `MONAD_PRIVATE_KEY` | Your deployer wallet private key (0x-prefixed) |
| `TITAN_EVENT_LOGGER_ADDRESS` | Address of deployed TitanEventLogger.sol |

> **Security**: `.env` is in `.gitignore`. Never commit it. Use `SUPABASE_SERVICE_ROLE_KEY` (not the anon key) so the script can write back `tx_hash`.

### 2. Supabase schema

The script expects a `tx_hash` column on `public.game_runs`:

```sql
ALTER TABLE public.game_runs
  ADD COLUMN IF NOT EXISTS tx_hash text DEFAULT NULL;
```

Run this migration once in the Supabase SQL editor before the first batch.

---

## Running a batch

From the project root:

```bash
node scripts/monadBatch.js
```

The script will:

1. Fetch up to 10 rows where `tx_hash IS NULL`, ordered by `score DESC`
2. Print the selected runs
3. Build the Merkle tree and print the root
4. Send `logBatch(merkleRoot, timestamp)` to Monad mainnet
5. Wait for 1-block confirmation
6. Update all selected rows with `tx_hash`
7. Print a final summary

If there are no unprocessed rows it exits cleanly with no transaction.

---

## Contract interface expected

`TitanEventLogger.sol` must expose:

```solidity
function logBatch(bytes32 merkleRoot, uint256 timestamp, uint256 batchSize) external;
```

No return value required. The ABI is defined inline in `scripts/monadBatch.js`.

---

## Merkle leaf encoding

Each leaf is double-hashed (OpenZeppelin standard, prevents second-preimage attacks):

```
leaf = keccak256(
         keccak256(abi.encodePacked(id, game, score, x_handle, created_at))
       )
```

Fields and Solidity types:

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | UUID from Supabase |
| `game` | `string` | `time_dilation` / `dark_matter` / `spaghettification` |
| `score` | `uint256` | Integer score |
| `x_handle` | `string` | Empty string if null |
| `created_at` | `string` | ISO 8601 timestamp from Supabase |

Pairs in the tree are sorted before hashing — matches `OpenZeppelin/MerkleProof.sol`.

---

## Error handling

| Situation | Behavior |
|---|---|
| Missing env vars | Exits immediately with list of missing vars |
| Supabase fetch fails | Exits with error message |
| Transaction reverts | Exits — Supabase rows are **not** updated |
| Supabase update fails after tx | Prints tx hash and row IDs to update manually, then exits |

The script never partially updates rows — it either stamps all of them or none.

---

## Running on a schedule (optional)

To run the batch nightly with cron:

```cron
0 3 * * * cd /path/to/quantum-parrot-void && node scripts/monadBatch.js >> logs/monad-batch.log 2>&1
```

Or use a GitHub Actions scheduled workflow with secrets for the env vars.

---

## Files

```
scripts/
  merkle.js        — Merkle leaf builder and root calculator
  monadBatch.js    — Main batch script
.env.example       — Environment variable template
README_MONAD_BATCH.md  — This file
```
