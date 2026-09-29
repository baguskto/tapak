// Minimal Telegram Bot API client (the engine replies to users directly).
import { config } from './config.js';

export async function sendMessage(chatId, html, extra = {}) {
  if (!chatId || !config.telegramToken) return;
  const res = await fetch(`https://api.telegram.org/bot${config.telegramToken}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: html, parse_mode: 'HTML', disable_web_page_preview: true, ...extra }),
  });
  if (!res.ok) console.error('telegram sendMessage', res.status, await res.text());
}

export const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
