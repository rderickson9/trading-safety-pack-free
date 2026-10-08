# Trading Safety Pack (free tier)

Five read-only Claude Code review agents for retail algo-trading codebases, plus one guard hook. The agents read your code and report what can place an unintended order, fill twice, run at the wrong hour, leave an intent stuck, or leak a credential. Nothing here places orders, connects to a broker, or edits files. Grep patterns cover ib_async/ib_insync, Alpaca and ccxt method names, plus common order-function names (place_order, submit_order, createOrder, /orders) used by custom REST wrappers, in Python and TypeScript.

## What is inside

Agents (`agents/`):
- `dry-run-enforcer`
- `double-fill-reviewer`
- `timezone-auditor`
- `hardcoded-secret-scanner`
- `orphan-signal-reviewer`

Hook (`hooks/`):
- `sacred-file-guard.js`: blocks `Edit`/`Write` on `.env` and `.env.*`, `*.db`, `*.sqlite`, `*.sqlite3` (and their `-wal`/`-shm` files), `credentials` / `credentials.*`, `token` / `token.*` / `tokens.*`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, SSH private keys, `auth.json`, and `service-account*.json`, `service_account*.json`, or `client_secret*.json` files (`.env.example` and similar templates are allowed) and `Bash` commands that delete, move, or overwrite them. Plain Node, zero dependencies, fails open on unexpected input.

## Install

Requires the Claude Code CLI with plugin support and Node.js for the hook (no npm packages are installed).

1. Clone or download this repository into a folder you will keep. Claude Code reads the plugin from that folder, so do not delete or move it after installing.
2. Register the folder as a local plugin marketplace and install from it (use the full path of the folder):

```
claude plugin marketplace add <path-to-this-folder>
claude plugin install trading-safety-pack-free@trading-safety-pack-free
claude plugin list
```

The list shows `trading-safety-pack-free@trading-safety-pack-free` as enabled. Start a new Claude Code session so the agents and the hook load.

To remove it: `claude plugin uninstall trading-safety-pack-free@trading-safety-pack-free`, then `claude plugin marketplace remove trading-safety-pack-free`.

Without the plugin system, copy the agents into a project:

```
cp agents/*.md <your-repo>/.claude/agents/
```

The hook only installs via the plugin route (`hooks/hooks.json` is read by the plugin loader).

## Use

In Claude Code inside your trading repo, ask for a review by agent name, for example "run dry-run-enforcer on this repo" or "use double-fill-reviewer on src/execution". Each agent returns a fixed-format report with P0/P1/P2 findings, `file:line`, and a concrete fix.

## Full pack

The full Trading Safety Pack has 32 agents across five families (Execution Safety, Risk & Sizing, State & Data, Time & Infra, Release), three guard hooks, and a `/trading-review` command that runs every family and merges one report. It is USD 29, one developer, unlimited repos, free updates through every 0.x and 1.x release, 14-day refund:

https://ericksonautomation.lemonsqueezy.com/

## Not financial advice

These agents review code quality and safety mechanics. They do not evaluate strategies, predict markets, or constitute financial advice. You are responsible for every order your system sends.

## License

MIT. See LICENSE.