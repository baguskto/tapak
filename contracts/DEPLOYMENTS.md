# Deployments — BNB Smart Chain Testnet (chain id 97)

| Contract | Address | Deploy tx |
|---|---|---|
| EvidenceRegistry | [`0x61e1b8cc84dd29b1ecba405ff1ac35c94891e02f`](https://testnet.bscscan.com/address/0x61e1b8cc84dd29b1ecba405ff1ac35c94891e02f) | [`0x816aa33b…`](https://testnet.bscscan.com/tx/0x816aa33b2dd3c6da3450e806c4d8d68bec0c392d3cbdcd3eac3161b55af72838) |
| DemoUSDT (tUSDT, no value) | [`0x0d4853d6a709e50488d03a908942d4f6eeb29732`](https://testnet.bscscan.com/address/0x0d4853d6a709e50488d03a908942d4f6eeb29732) | [`0x0f8ee43a…`](https://testnet.bscscan.com/tx/0x0f8ee43aff6a49efd1332b48434352a49b0f67106730c2cb13fd2c094fd2944a) |

Relayer (sole `anchor()` caller): `0x05eDf60eD840926187e5C2705Bf1125d4C7388AE`

## Demo data (simulated love-scam case)
- Demo victim wallet: `0x00E47bFC9D61B7cF7658767f47A173A0EBD36B9c`
- Demo scammer wallet: `0xeF89f601e3E1738E8Ab931f714a986F8E2cb6Bec`
- tUSDT transfers victim → scammer (1,000 / 1,500 / 2,000):
  [`0x2f88e28b…`](https://testnet.bscscan.com/tx/0x2f88e28b0b246d09a00e6c165d28cba4070c976cd95281f0beec9833e2b45abf),
  [`0x9113d1f0…`](https://testnet.bscscan.com/tx/0x9113d1f09e55b662c654237d5712c659b1ff8a2d90c1a6925d3570e1499c2f71),
  [`0xff153fba…`](https://testnet.bscscan.com/tx/0xff153fba1cb5f68a1051f5dbe473caca0cf01a87f8ade48294b103d872f4f0ab)
- Example evidence anchor for a full case (3 receipts + chat + manifest):
  [`0x6099f36f…`](https://testnet.bscscan.com/tx/0x6099f36f7fcbff2f3135b40289a858e6980b1ff2be303ca48164b881b6906e59)

All demo data is fictional.
