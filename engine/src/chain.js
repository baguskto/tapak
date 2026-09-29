// BSC testnet: anchor evidence hashes in EvidenceRegistry and read tUSDT transfers.
import { createPublicClient, createWalletClient, http, parseAbi, parseAbiItem, keccak256, toBytes, formatUnits, getAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bscTestnet } from 'viem/chains';
import { readFileSync } from 'node:fs';
import { config } from './config.js';

// Contract addresses: env first, else the state file written by bootstrap.js after auto-deploy.
export function addrs() {
  let st = {};
  try { st = JSON.parse(readFileSync(new URL('../state.json', import.meta.url), 'utf8')); } catch {}
  return { registry: config.chain.registry || st.registry || '', usdt: config.chain.usdt || st.usdt || '' };
}

const transport = http(config.chain.rpc);
export { account, walletClient };
export const publicClient = createPublicClient({ chain: bscTestnet, transport });
const account = config.chain.relayerKey ? privateKeyToAccount(config.chain.relayerKey) : null;
const walletClient = account ? createWalletClient({ account, chain: bscTestnet, transport }) : null;

const registryAbi = parseAbi([
  'function anchor(bytes32 caseId, bytes32[] fileHashes) returns (uint256)',
  'function verify(bytes32 fileHash) view returns (bool found, bytes32 caseId, uint64 timestamp)',
]);
const transferEvent = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

export const relayerAddress = account?.address ?? null;
export const caseIdBytes = (caseId) => keccak256(toBytes(`tapak:${caseId}`));
export const txUrl = (hash) => `${config.chain.explorer}/tx/${hash}`;

export async function relayerBalance() {
  if (!account) return null;
  return formatUnits(await publicClient.getBalance({ address: account.address }), 18);
}

export async function anchorHashes(caseId, hexHashes) {
  const { registry } = addrs();
  if (!walletClient || !registry) throw new Error('relayer not configured');
  const hashes = hexHashes.map((h) => (h.startsWith('0x') ? h : `0x${h}`));
  const hash = await walletClient.writeContract({
    address: registry,
    abi: registryAbi,
    functionName: 'anchor',
    args: [caseIdBytes(caseId), hashes],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 90_000 });
  return { txHash: hash, block: Number(receipt.blockNumber), status: receipt.status };
}

/** tUSDT transfers sent from a victim wallet (the demo stand-in for USDT on BSC). */
export async function usdtTransfersFrom(wallet) {
  const { usdt } = addrs();
  if (!usdt) return [];
  const from = getAddress(wallet);
  const latest = await publicClient.getBlockNumber();
  const out = [];
  // Public RPCs cap log ranges, so scan recent history in windows.
  const span = 49_000n;
  for (let to = latest, i = 0; i < 8 && to > 0n; i++, to -= span) {
    const fromBlock = to > span ? to - span + 1n : 0n;
    const logs = await publicClient.getLogs({ address: usdt, event: transferEvent, args: { from }, fromBlock, toBlock: to });
    for (const l of logs) {
      const block = await publicClient.getBlock({ blockNumber: l.blockNumber });
      out.push({
        txHash: l.transactionHash,
        to: l.args.to,
        amount: Number(formatUnits(l.args.value, 18)),
        timestamp: Number(block.timestamp),
        url: txUrl(l.transactionHash),
      });
    }
  }
  return out.sort((a, b) => a.timestamp - b.timestamp);
}
