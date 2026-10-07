#!/usr/bin/env node
'use strict';
// sacred-file-guard: PreToolUse hook for Claude Code.
// Blocks Edit/Write whose file_path is a database, env, or credential file,
// and Bash commands that delete, move, or truncate such files.
// Exit 2 with a reason on stderr = block. Exit 0 = allow.
// Fails open: any unexpected input, parse error, or internal error exits 0
// with a warning on stderr. Zero dependencies.

const SACRED_BASENAME = [
  /^\.env(\..*)?$/i,            // .env, .env.local, .env.production
  /\.db$/i,                     // state.db
  /\.db-(wal|shm|journal)$/i,   // sqlite sidecars
  /\.sqlite3?$/i,               // .sqlite, .sqlite3
  /\.sqlite3?-(wal|shm)$/i,
  /^credentials?(\..*)?$/i,     // credentials.json, credential.yaml
  /^tokens?(\..*)?$/i,          // token.json, tokens.txt
  /\.pem$/i,
  /\.key$/i,
  /^id_(rsa|ed25519|ecdsa|dsa)(\.pub)?$/i,
  /\.p12$/i,
  /\.pfx$/i,
  /^auth\.json$/i,
  /^service[-_]?account.*\.json$/i,
  /^client_secret.*\.json$/i,
];

const SACRED_EXEMPT = [
  /^\.env\.(example|sample|template|dist)$/i,
];

const DESTRUCTIVE_CMD = /(^|[;&|]\s*|\s)(rm|del|erase|rmdir|rd|mv|move|ren|rename|Remove-Item|ri|Move-Item|mi|Rename-Item|rni|Clear-Content|clc|truncate|shred|unlink|git\s+rm|git\s+clean)\b/i;
const REDIRECT_TRUNCATE = /(^|[^<>])>\s*["']?([^\s"'|;&>]+)/g; // "> file" overwrites

function basename(p) {
  if (typeof p !== 'string') return '';
  const parts = p.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1] || '';
}

function isSacred(pathLike) {
  const b = basename(pathLike);
  if (!b) return false;
  if (SACRED_EXEMPT.some((re) => re.test(b))) return false;
  return SACRED_BASENAME.some((re) => re.test(b));
}

function tokensOf(command) {
  // Split on whitespace and shell separators; keep quoted paths intact.
  const out = [];
  const re = /"([^"]*)"|'([^']*)'|([^\s;&|<>()]+)/g;
  let m;
  while ((m = re.exec(command)) !== null) {
    out.push(m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3]);
  }
  return out;
}

function checkBash(command) {
  if (typeof command !== 'string' || !command.trim()) return null;
  const tokens = tokensOf(command);
  const sacredTokens = tokens.filter(isSacred);
  if (sacredTokens.length === 0) {
    // Also catch wildcard deletes that would sweep sacred files: rm *.db, del *.sqlite
    const wild = tokens.filter((t) => /\*/.test(t) && isSacred(t.replace(/\*/g, 'x')));
    if (wild.length && DESTRUCTIVE_CMD.test(command)) {
      return `command deletes or moves files matching ${wild.join(', ')} (database/credential pattern)`;
    }
    return null;
  }
  if (DESTRUCTIVE_CMD.test(command)) {
    return `command deletes, moves, or truncates protected file(s): ${sacredTokens.join(', ')}`;
  }
  let rm;
  REDIRECT_TRUNCATE.lastIndex = 0;
  while ((rm = REDIRECT_TRUNCATE.exec(command)) !== null) {
    if (isSacred(rm[2])) return `command overwrites protected file via redirection: ${rm[2]}`;
  }
  return null;
}

function main() {
  let raw = '';
  try {
    raw = require('fs').readFileSync(0, 'utf8');
  } catch (e) {
    process.stderr.write('[sacred-file-guard] warning: could not read stdin; allowing.\n');
    return 0;
  }
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (e) {
    process.stderr.write('[sacred-file-guard] warning: hook input was not JSON; allowing.\n');
    return 0;
  }
  if (!payload || typeof payload !== 'object') return 0;
  const tool = payload.tool_name || '';
  const input = payload.tool_input || {};

  let reason = null;
  if (tool === 'Edit' || tool === 'Write' || tool === 'MultiEdit' || tool === 'NotebookEdit') {
    const fp = input.file_path || input.notebook_path || '';
    if (isSacred(fp)) {
      reason = `direct edit of a protected file: ${fp}. Databases, .env files, and credentials are never edited by tooling. Use the application's own migration or config path, or ask the operator.`;
    }
  } else if (tool === 'Bash') {
    reason = checkBash(input.command || '');
  }

  if (reason) {
    process.stderr.write(`[sacred-file-guard] BLOCKED: ${reason}\n`);
    return 2;
  }
  return 0;
}

try {
  process.exitCode = main();
} catch (e) {
  process.stderr.write(`[sacred-file-guard] warning: internal error (${e && e.message}); allowing.\n`);
  process.exitCode = 0;
}
