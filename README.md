# Trading Safety Pack (free tier)

Five read-only Claude Code review agents for retail algo-trading codebases, plus one guard hook. The agents read your code and report what can place an unintended order, fill twice, run at the wrong hour, leave an intent stuck, or leak a credential. Nothing here places orders, connects to a broker, or edits files. Broker-agnostic: patterns cover ib_async/ib_insync, Alpaca, Tradovate, ccxt, and generic REST clients, in Python and TypeScript.

## What is inside

Agents (`agents/`):
- `dry-run-enforcer`
- `double-fill-reviewer`
- `timezone-auditor`
- `hardcoded-secret-scanner`
- `orphan-signal-reviewer`

Hook (`hooks/`):
- `sacred-file-guard.js`: blocks `Edit`/`Write` on `.env*`, `*.db`, `*.sqlite*`, `credentials*`, `token*`, `*.pem`, `*.key` and `Bash` commands that delete, move, or overwrite them. Plain Node, zero dependencies, fails open on unexpected input.

## Install

As a plugin (recommended): from a terminal in this folder

```
claude plugin install .
```

Or copy the agents into a project:

```
cp agents/*.md <your-repo>/.claude/agents/
```

The hook only installs via the plugin route (`hooks/hooks.json` is read by the plugin loader).

## Use

In Claude Code inside your trading repo, ask for a review by agent name, for example "run dry-run-enforcer on this repo" or "use double-fill-reviewer on src/execution". Each agent returns a fixed-format report with P0/P1/P2 findings, `file:line`, and a concrete fix.

## Full pack

The full Trading Safety Pack has 32 agents across five families (Execution Safety, Risk & Sizing, State & Data, Time & Infra, Release), three guard hooks, and a `/trading-review` command that runs every family and merges one report. It is USD 29, one developer, unlimited repos, lifetime v1.x updates, 14-day refund:

https://ericksonautomation.lemonsqueezy.com/

## Not financial advice

These agents review code quality and safety mechanics. They do not evaluate strategies, predict markets, or constitute financial advice. You are responsible for every order your system sends.

## License

MIT. See LICENSE.