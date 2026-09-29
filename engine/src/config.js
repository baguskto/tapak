// Runtime configuration, read once from the environment (see engine/.env.example).
const env = (k, d) => process.env[k] ?? d;

export const config = {
  host: env('HOST', '127.0.0.1'),
  port: Number(env('PORT', '8790')),
  secret: env('TAPAK_SECRET', ''),
  workerBase: env('WORKER_BASE', 'https://tapak.baguskto.workers.dev'),
  publicBase: env('PUBLIC_BASE', env('WORKER_BASE', 'https://tapak.baguskto.workers.dev')),
  telegramToken: env('TELEGRAM_TOKEN', ''),
  ai: {
    // Direct MiniMax, or the Cloudflare AI Gateway custom-provider URL
    // (https://gateway.ai.cloudflare.com/v1/<account>/<gateway>/custom-minimax).
    base: env('AI_BASE', 'https://api.minimax.io'),
    key: env('AI_KEY', ''),
    model: env('AI_MODEL', 'MiniMax-M3'),
    gatewayToken: env('CF_AIG_TOKEN', ''),
  },
  chain: {
    rpc: env('RPC_URL', 'https://bsc-testnet-rpc.publicnode.com'),
    relayerKey: env('RELAYER_PRIVATE_KEY', ''),
    registry: env('REGISTRY_ADDRESS', ''),
    usdt: env('USDT_ADDRESS', ''),
    explorer: env('EXPLORER', 'https://testnet.bscscan.com'),
    usdtIdr: Number(env('USDT_IDR', '16400')),
  },
};
