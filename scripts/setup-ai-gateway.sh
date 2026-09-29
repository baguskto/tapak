#!/usr/bin/env bash
# Creates the Cloudflare AI Gateway "tapak" (prompt logging off), registers MiniMax as a custom
# provider, verifies a request through the gateway, then points the VPS engine at it.
# Usage: CF_API_TOKEN=<token with "AI Gateway: Edit"> MINIMAX_KEY=<key> ./scripts/setup-ai-gateway.sh
set -euo pipefail
ACCOUNT=12c8e84921e8ab4d3839df13d401b0ee
GW=tapak
API="https://api.cloudflare.com/client/v4/accounts/$ACCOUNT/ai-gateway"
H=(-H "Authorization: Bearer $CF_API_TOKEN" -H "content-type: application/json")

echo "== gateway"
curl -s -X POST "$API/gateways" "${H[@]}" -d "{\"id\":\"$GW\",\"collect_logs\":false,\"cache_ttl\":0,\"cache_invalidate_on_update\":false,\"rate_limiting_interval\":60,\"rate_limiting_limit\":120,\"rate_limiting_technique\":\"sliding\"}" | head -c 300; echo

echo "== custom provider"
curl -s -X POST "$API/custom-providers" "${H[@]}" -d '{"name":"MiniMax","slug":"minimax","base_url":"https://api.minimax.io","description":"MiniMax M3 (Anthropic-compatible) for Tapak","enable":true}' | head -c 300; echo

BASE="https://gateway.ai.cloudflare.com/v1/$ACCOUNT/$GW/custom-minimax"
echo "== test through gateway"
curl -s "$BASE/anthropic/v1/messages" -H "x-api-key: $MINIMAX_KEY" -H "anthropic-version: 2023-06-01" -H "content-type: application/json" \
  -d '{"model":"MiniMax-M3","max_tokens":40,"messages":[{"role":"user","content":"Balas: OK"}]}' | head -c 300; echo

echo "== switch engine"
ssh vpsgede "sed -i 's#^AI_BASE=.*#AI_BASE=$BASE#' ~/tapak-engine/.env && sudo systemctl restart tapak-engine && sleep 2 && systemctl is-active tapak-engine"
