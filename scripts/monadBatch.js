/**
 * monadBatch.js
 *
 * Reads top unprocessed runs from Supabase, builds a Merkle root,
 * writes it to TitanEventLogger.sol on Monad mainnet, then stamps
 * each row with the resulting tx_hash.
 *
 * Usage:
 *   node scripts/monadBatch.js
 *
 * Dry-run (skips Monad tx, tests Supabase update only):
 *   DRY_RUN_UPDATE=true node scripts/monadBatch.js
 *
 * Required env vars (copy .env.example → .env and fill in):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   MONAD_RPC_URL, MONAD_PRIVATE_KEY, TITAN_EVENT_LOGGER_ADDRESS
 */

import 'dotenv/config';
import { ethers }       from 'ethers';
import { createClient } from '@supabase/supabase-js';
import { buildLeaf, buildMerkleRoot } from './merkle.js';

const DRY_RUN = process.env.DRY_RUN_UPDATE === 'true';

// ── Env validation ────────────────────────────────────────────────────────────

const REQUIRED = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  ...(DRY_RUN ? [] : ['MONAD_RPC_URL', 'MONAD_PRIVATE_KEY', 'TITAN_EVENT_LOGGER_ADDRESS']),
];

const missing = REQUIRED.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error('❌  Missing required env vars:', missing.join(', '));
  process.exit(1);
}

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  MONAD_RPC_URL,
  MONAD_PRIVATE_KEY,
  TITAN_EVENT_LOGGER_ADDRESS,
} = process.env;

// ── Supabase (service role — server-side only) ────────────────────────────────

console.log('URL length:', process.env.SUPABASE_URL?.length, 'First char code:', process.env.SUPABASE_URL?.charCodeAt(0));
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Contract ABI (minimal) ────────────────────────────────────────────────────

const TITAN_ABI = [
  {
    type: 'function',
    name: 'logBatch',
    inputs: [
      { name: 'merkleRoot', type: 'bytes32' },
      { name: 'timestamp',  type: 'uint256' },
      { name: 'batchSize',  type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('════════════════════════════════════════');
  console.log('  Monad Batch — TitanEventLogger');
  if (DRY_RUN) console.log('  ⚠️  DRY RUN — Monad tx will be skipped');
  console.log('════════════════════════════════════════\n');

  const VALID_GAMES = new Set(['time_dilation', 'dark_matter', 'spaghettification']);

  // 1. Fetch eligible runs ────────────────────────────────────────────────────
  console.log('📡  Fetching eligible runs from Supabase…');

  const { data: raw, error: fetchError } = await supabase
    .from('game_runs')
    .select('id, game, score, x_handle, created_at')
    .is('tx_hash', null)
    .gte('score', 3)
    .in('game', [...VALID_GAMES])
    .order('score', { ascending: false })
    .limit(10);

  if (fetchError) {
    console.error('❌  Supabase fetch failed:', fetchError);
    process.exit(1);
  }

  // Client-side safety filter: must have id, created_at, valid game, score >= 3,
  // and must not be a debug placeholder.
  const runs = (raw || []).filter(r =>
    r.id &&
    r.created_at &&
    VALID_GAMES.has(r.game) &&
    typeof r.score === 'number' && r.score >= 3 &&
    r.id !== 'debug_tx_hash'
  );

  console.log(`\nEligible runs found: ${runs.length}`);

  if (runs.length === 0) {
    console.log('No eligible runs to batch. Exiting cleanly.');
    return;
  }

  runs.forEach((r, i) => {
    const handle = r.x_handle || '—';
    console.log(`  ${String(i + 1).padStart(2)}. [${r.game.padEnd(18)}] score=${String(r.score).padStart(6)}  id=${r.id}  handle=${handle}`);
  });

  // 2. Validate run IDs ───────────────────────────────────────────────────────
  const runIds = runs.map(r => r.id).filter(Boolean);

  console.log('\n🔑  Run IDs to update:');
  runIds.forEach(id => console.log('    ', id));

  if (runIds.length === 0) {
    console.error('❌  No valid IDs after filtering. First raw object:');
    console.error(JSON.stringify((raw || [])[0] ?? null, null, 2));
    process.exit(1);
  }

  if (runIds.length !== runs.length) {
    console.warn(`⚠️   ${runs.length - runIds.length} run(s) had a missing id and were excluded.`);
  }

  // ── Pre-tx safety checks ───────────────────────────────────────────────────
  if (runs.length === 0) {
    console.error('❌  Safety check failed: runs array is empty before tx.');
    process.exit(1);
  }
  const lowScore = runs.find(r => r.score < 3);
  if (lowScore) {
    console.error(`❌  Safety check failed: run ${lowScore.id} has score ${lowScore.score} (< 3).`);
    process.exit(1);
  }

  // 3. Build Merkle root ──────────────────────────────────────────────────────
  console.log('\n🌿  Building Merkle tree…');
  const leaves     = runs.map(buildLeaf);
  const merkleRoot = buildMerkleRoot(leaves);
  console.log('    Merkle root:', merkleRoot);

  // 4. Send transaction (skipped in dry-run) ─────────────────────────────────
  let txHash;

  if (DRY_RUN) {
    txHash = 'debug_tx_hash';
    console.log('\n⚠️  DRY RUN — skipping Monad transaction.');
    console.log('    Using tx_hash:', txHash);
  } else {
    console.log('\n⛓   Connecting to Monad…');
    const provider = new ethers.JsonRpcProvider(MONAD_RPC_URL);
    const wallet   = new ethers.Wallet(MONAD_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(TITAN_EVENT_LOGGER_ADDRESS, TITAN_ABI, wallet);

    const network = await provider.getNetwork();
    console.log(`    Network  : ${network.name} (chainId ${network.chainId})`);
    console.log(`    Signer   : ${wallet.address}`);
    console.log(`    Contract : ${TITAN_EVENT_LOGGER_ADDRESS}`);

    const timestamp = BigInt(Math.floor(Date.now() / 1000));
    const batchSize = BigInt(runIds.length);
    console.log('\n🚀  Sending logBatch…');

    let tx;
    try {
      tx = await contract.logBatch(merkleRoot, timestamp, batchSize);
    } catch (err) {
      console.error('❌  Transaction failed to send:', err.message);
      process.exit(1);
    }

    console.log('    Tx hash  :', tx.hash);
    console.log('    Waiting for confirmation…');

    let receipt;
    try {
      receipt = await tx.wait(1);
    } catch (err) {
      console.error('❌  Transaction reverted or timed out:', err.message);
      console.error('    Tx hash was:', tx.hash);
      console.error('    Rows were NOT updated in Supabase.');
      process.exit(1);
    }

    console.log(`    Confirmed in block ${receipt.blockNumber} ✓`);
    txHash = tx.hash;

    // Summary printed after update step — store receipt for it
    main._receipt = receipt;
  }

  // 5. Stamp rows with tx_hash ───────────────────────────────────────────────
  console.log('\n💾  Updating game_runs with tx_hash…');

  const { data: updatedRows, error: updateError } = await supabase
    .from('game_runs')
    .update({ tx_hash: txHash, eligible_for_chain: true })
    .in('id', runIds)
    .select('id, tx_hash');

  if (updateError) {
    console.error('❌  Supabase update failed:', updateError);
    console.error('    Tx hash to store manually :', txHash);
    console.error('    Row IDs to update manually:', runIds);
    process.exit(1);
  }

  console.log(`    Updated rows: ${updatedRows.length}`);
  console.log('    Updated IDs :', updatedRows.map(r => r.id));

  if (updatedRows.length === 0) {
    console.error('❌  0 rows updated. First fetched run for debugging:');
    console.error(JSON.stringify(runs[0], null, 2));
    process.exit(1);
  }

  if (updatedRows.length !== runIds.length) {
    console.warn(`⚠️   Expected ${runIds.length} updated rows but got ${updatedRows.length} — some rows may not have been stamped.`);
  }

  // 6. Summary ───────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════');
  if (DRY_RUN) {
    console.log(`✅  Dry run complete — ${updatedRows.length} row(s) stamped in Supabase.`);
    console.log('    No Monad transaction was sent.');
  } else {
    console.log(`✅  Batch complete — ${updatedRows.length} run(s) logged on-chain.`);
    console.log('    Tx hash     :', txHash);
    console.log('    Merkle root :', merkleRoot);
    console.log('    Block       :', main._receipt?.blockNumber ?? '—');
  }
  console.log('════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('\n❌  Fatal error:', err.message || err);
  process.exit(1);
});
