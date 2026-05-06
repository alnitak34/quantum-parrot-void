import { ethers } from 'ethers';

/**
 * Build a deterministic leaf hash from a game_run row.
 * Uses double-keccak256 (standard OpenZeppelin Merkle pattern) to prevent
 * second-preimage attacks.
 *
 * Fields encoded: id, game, score, x_handle, created_at
 */
export function buildLeaf(row) {
  const inner = ethers.solidityPackedKeccak256(
    ['string', 'string', 'uint256', 'string', 'string'],
    [
      row.id,
      row.game,
      BigInt(row.score),
      row.x_handle ?? '',
      row.created_at,
    ]
  );
  return ethers.keccak256(inner); // double-hash
}

/**
 * Build a binary Merkle root from an array of leaf hashes (0x hex strings).
 * Pairs are sorted before hashing for determinism (matches OpenZeppelin MerkleProof).
 * Odd nodes are carried up without hashing.
 *
 * @param {string[]} leaves - Array of 0x-prefixed keccak256 hashes
 * @returns {string} Merkle root as 0x-prefixed hex string
 */
export function buildMerkleRoot(leaves) {
  if (!leaves || leaves.length === 0) {
    throw new Error('buildMerkleRoot: no leaves provided');
  }

  let layer = [...leaves].sort(); // sort for determinism

  while (layer.length > 1) {
    const next = [];
    for (let i = 0; i < layer.length; i += 2) {
      if (i + 1 < layer.length) {
        // sort pair so keccak256(a,b) == keccak256(b,a) — OZ standard
        const [a, b] = [layer[i], layer[i + 1]].sort();
        next.push(
          ethers.keccak256(
            ethers.concat([ethers.getBytes(a), ethers.getBytes(b)])
          )
        );
      } else {
        next.push(layer[i]); // odd leaf carries up unchanged
      }
    }
    layer = next;
  }

  return layer[0];
}
