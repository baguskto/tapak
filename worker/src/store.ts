// Single SQLite-backed Durable Object holding case state (free-plan friendly, strongly consistent).
import { DurableObject } from 'cloudflare:workers';

export type FileRow = {
  id: string; case_id: string; kind: string; name: string; mime: string; size: number;
  r2_key: string; sha256: string; extracted: string | null; created_at: string;
};
export type CaseRow = {
  id: string; chat_id: string; public_token: string; status: string; wallet: string | null;
  analysis: string | null; anchor_tx: string | null; manifest_sha256: string | null;
  created_at: string; updated_at: string;
};

const id = (p: string) => `${p}${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
const now = () => new Date().toISOString();

export class Store extends DurableObject {
  sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: unknown) {
    super(ctx, env as never);
    this.sql = ctx.storage.sql;
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS cases (
        id TEXT PRIMARY KEY, chat_id TEXT, public_token TEXT UNIQUE, status TEXT, wallet TEXT,
        analysis TEXT, anchor_tx TEXT, manifest_sha256 TEXT, created_at TEXT, updated_at TEXT);
      CREATE INDEX IF NOT EXISTS cases_chat ON cases(chat_id, created_at);
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY, case_id TEXT, kind TEXT, name TEXT, mime TEXT, size INTEGER,
        r2_key TEXT, sha256 TEXT, extracted TEXT, created_at TEXT);
      CREATE INDEX IF NOT EXISTS files_case ON files(case_id);
      CREATE INDEX IF NOT EXISTS files_hash ON files(sha256);
      CREATE TABLE IF NOT EXISTS users (user_id TEXT PRIMARY KEY, chat_id TEXT, created_at TEXT);
      CREATE TABLE IF NOT EXISTS link_codes (code TEXT PRIMARY KEY, user_id TEXT, expires_at INTEGER);
      CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT);`);
  }

  newCase(chatId: string): CaseRow {
    const row = { id: id('c'), chat_id: chatId, public_token: crypto.randomUUID().replace(/-/g, ''), status: 'collecting', ts: now() };
    this.sql.exec('INSERT INTO cases (id, chat_id, public_token, status, created_at, updated_at) VALUES (?,?,?,?,?,?)',
      row.id, row.chat_id, row.public_token, row.status, row.ts, row.ts);
    return this.getCaseRow(row.id)!;
  }

  activeCase(chatId: string): CaseRow {
    const r = this.sql.exec<CaseRow>('SELECT * FROM cases WHERE chat_id = ? ORDER BY created_at DESC LIMIT 1', chatId).toArray()[0];
    return r ?? this.newCase(chatId);
  }

  getCaseRow(caseId: string): CaseRow | null {
    return this.sql.exec<CaseRow>('SELECT * FROM cases WHERE id = ?', caseId).toArray()[0] ?? null;
  }

  getCase(caseId: string) {
    const c = this.getCaseRow(caseId);
    if (!c) return null;
    const files = this.sql.exec<FileRow>('SELECT * FROM files WHERE case_id = ? ORDER BY created_at', caseId).toArray();
    return { ...c, files };
  }

  caseByToken(token: string) {
    const c = this.sql.exec<CaseRow>('SELECT id FROM cases WHERE public_token = ?', token).toArray()[0];
    return c ? this.getCase(c.id) : null;
  }

  updateCase(caseId: string, patch: Partial<CaseRow>) {
    const allowed = ['status', 'wallet', 'analysis', 'anchor_tx', 'manifest_sha256'] as const;
    for (const k of allowed) {
      if (k in patch) this.sql.exec(`UPDATE cases SET ${k} = ?, updated_at = ? WHERE id = ?`, (patch as Record<string, unknown>)[k] ?? null, now(), caseId);
    }
    return this.getCaseRow(caseId);
  }

  addFile(f: Omit<FileRow, 'id' | 'created_at' | 'extracted'>): FileRow {
    const row = { ...f, id: id('f'), created_at: now() };
    this.sql.exec('INSERT INTO files (id, case_id, kind, name, mime, size, r2_key, sha256, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
      row.id, row.case_id, row.kind, row.name, row.mime, row.size, row.r2_key, row.sha256, row.created_at);
    this.sql.exec("UPDATE cases SET status = 'collecting', updated_at = ? WHERE id = ?", now(), row.case_id);
    return { ...row, extracted: null };
  }

  getFile(fileId: string): FileRow | null {
    return this.sql.exec<FileRow>('SELECT * FROM files WHERE id = ?', fileId).toArray()[0] ?? null;
  }

  updateFile(fileId: string, patch: { extracted?: string }) {
    if (patch.extracted !== undefined) this.sql.exec('UPDATE files SET extracted = ? WHERE id = ?', patch.extracted, fileId);
    return this.getFile(fileId);
  }

  findHash(sha256: string) {
    return this.sql.exec<{ case_id: string; name: string; created_at: string }>(
      'SELECT case_id, name, created_at FROM files WHERE sha256 = ? LIMIT 1', sha256).toArray()[0] ?? null;
  }

  /** Six-digit code shown in the dashboard; the user sends /hubungkan CODE to the bot. */
  createLinkCode(userId: string) {
    const code = String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000));
    this.sql.exec('DELETE FROM link_codes WHERE user_id = ? OR expires_at < ?', userId, Date.now());
    this.sql.exec('INSERT INTO link_codes (code, user_id, expires_at) VALUES (?,?,?)', code, userId, Date.now() + 15 * 60_000);
    return { code, expires_in_minutes: 15 };
  }

  redeemLinkCode(code: string, chatId: string) {
    const row = this.sql.exec<{ user_id: string; expires_at: number }>('SELECT user_id, expires_at FROM link_codes WHERE code = ?', code).toArray()[0];
    if (!row || row.expires_at < Date.now()) return null;
    this.sql.exec('DELETE FROM link_codes WHERE code = ?', code);
    this.sql.exec('INSERT INTO users (user_id, chat_id, created_at) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET chat_id = excluded.chat_id', row.user_id, chatId, now());
    return row.user_id;
  }

  profile(userId: string) {
    return this.sql.exec<{ chat_id: string | null }>('SELECT chat_id FROM users WHERE user_id = ?', userId).toArray()[0] ?? { chat_id: null };
  }

  /** Cases owned on the web (chat_id = web:<user>) plus cases from the linked Telegram chat. */
  casesForUser(userId: string) {
    const linked = this.profile(userId).chat_id;
    const rows = this.sql.exec<CaseRow>(
      'SELECT * FROM cases WHERE chat_id = ? OR (? IS NOT NULL AND chat_id = ?) ORDER BY created_at DESC LIMIT 50',
      `web:${userId}`, linked, linked).toArray();
    return rows.map((c) => {
      const n = this.sql.exec<{ n: number }>('SELECT COUNT(*) AS n FROM files WHERE case_id = ?', c.id).toArray()[0].n;
      const a = c.analysis ? JSON.parse(c.analysis) : null;
      return { id: c.id, public_token: c.public_token, status: c.status, created_at: c.created_at, source: c.chat_id.startsWith('web:') ? 'web' : 'telegram',
        files: n, drafts: a?.drafts?.length ?? 0, total_idr: a?.totals?.idr ?? null, anchor_tx: c.anchor_tx };
    });
  }

  ownsCase(userId: string, caseId: string) {
    const c = this.getCaseRow(caseId);
    if (!c) return false;
    return c.chat_id === `web:${userId}` || (this.profile(userId).chat_id ?? '') === c.chat_id;
  }

  getConfig(key: string): string | null {
    return this.sql.exec<{ value: string }>('SELECT value FROM config WHERE key = ?', key).toArray()[0]?.value ?? null;
  }

  setConfig(key: string, value: string) {
    this.sql.exec('INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, value);
  }

  /** Analysed cases whose evidence hashes are not on-chain yet (e.g. before the relayer was funded). */
  pendingAnchors() {
    return this.sql.exec<{ id: string }>("SELECT id FROM cases WHERE status = 'ready' AND anchor_tx IS NULL ORDER BY created_at").toArray().map((r) => r.id);
  }
}
