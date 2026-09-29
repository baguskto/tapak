// One-shot bootstrap that finishes the on-chain setup as soon as the relayer wallet is funded:
// deploy EvidenceRegistry + DemoUSDT, register them with the Worker, create the demo USDT transfers,
// and anchor every analysed case that was waiting. Idempotent: progress is kept in state.json.
import { readFileSync, writeFileSync } from 'node:fs';
import { createWalletClient, http, parseEther, parseUnits, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bscTestnet } from 'viem/chains';
import { config } from './config.js';
import { publicClient, walletClient, account, anchorHashes, txUrl } from './chain.js';
import * as W from './worker.js';

const STATE = new URL('../state.json', import.meta.url);
const load = () => { try { return JSON.parse(readFileSync(STATE, 'utf8')); } catch { return {}; } };
const save = (s) => writeFileSync(STATE, JSON.stringify(s, null, 2));
const art = (n) => JSON.parse(readFileSync(new URL(`../artifacts/${n}.json`, import.meta.url), 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIN_BALANCE = parseEther('0.003');

async function deploy(name, args = []) {
  const { abi, bytecode } = art(name);
  const hash = await walletClient.deployContract({ abi, bytecode, args });
  const r = await publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
  console.log(`deployed ${name} ${r.contractAddress} (${txUrl(hash)})`);
  return { address: r.contractAddress, tx: hash };
}

async function write(client, address, abi, functionName, args) {
  const hash = await client.writeContract({ address, abi, functionName, args });
  await publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
  return hash;
}

async function step() {
  const st = load();
  if (st.done) return true;
  if (!account) throw new Error('RELAYER_PRIVATE_KEY missing');
  const bal = await publicClient.getBalance({ address: account.address });
  if (bal < MIN_BALANCE) {
    console.log(`waiting for tBNB on ${account.address} (balance ${formatEther(bal)})`);
    return false;
  }

  if (!st.registry) {
    const reg = await deploy('EvidenceRegistry', [account.address]);
    const usdt = await deploy('DemoUSDT');
    Object.assign(st, { registry: reg.address, registryTx: reg.tx, usdt: usdt.address, usdtTx: usdt.tx });
    save(st);
  }

  if (!st.workerConfigured) {
    await W.registerConfig({ registry: st.registry, usdt: st.usdt });
    st.workerConfigured = true; save(st);
  }

  // Demo: the victim wallet buys tUSDT and sends it to the scammer in three transfers.
  const victimKey = process.env.VICTIM_PRIVATE_KEY;
  const scammer = process.env.SCAMMER_ADDRESS;
  if (!st.demoTransfers && victimKey && scammer) {
    const victim = privateKeyToAccount(victimKey);
    const vc = createWalletClient({ account: victim, chain: bscTestnet, transport: http(config.chain.rpc) });
    const usdtAbi = art('DemoUSDT').abi;
    if ((await publicClient.getBalance({ address: victim.address })) < parseEther('0.001')) {
      const h = await walletClient.sendTransaction({ to: victim.address, value: parseEther('0.002') });
      await publicClient.waitForTransactionReceipt({ hash: h });
    }
    await write(walletClient, st.usdt, usdtAbi, 'mint', [victim.address, parseUnits('4500', 18)]);
    const txs = [];
    for (const amt of ['1000', '1500', '2000']) txs.push(await write(vc, st.usdt, usdtAbi, 'transfer', [scammer, parseUnits(amt, 18)]));
    st.demoTransfers = txs; save(st);
    console.log('demo transfers', txs.map(txUrl));
  }

  // Anchor analysed cases that were waiting for the relayer.
  for (const caseId of await W.pendingAnchors()) {
    const kase = await W.getCase(caseId);
    const a = kase.analysis ? JSON.parse(kase.analysis) : null;
    const hashes = (kase.files || []).map((f) => f.sha256).filter(Boolean);
    if (a?.manifest_sha256) hashes.push(a.manifest_sha256);
    if (!hashes.length) continue;
    const anchor = await anchorHashes(caseId, hashes);
    anchor.url = txUrl(anchor.txHash);
    if (a) a.anchor = anchor;
    await W.updateCase(caseId, { anchor_tx: anchor.txHash, analysis: a ? JSON.stringify(a) : kase.analysis });
    console.log(`anchored ${caseId} ${anchor.url}`);
  }

  st.done = true; save(st);
  console.log('bootstrap complete', st);
  return true;
}

for (;;) {
  try { if (await step()) break; } catch (e) { console.error('bootstrap', e.message); }
  await sleep(30_000);
}
