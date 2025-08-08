# playd

[![Test](https://github.com/slava-vishnyakov/playd/actions/workflows/test.yml/badge.svg)](https://github.com/slava-vishnyakov/playd/actions/workflows/test.yml)

Browser automation tool using the Chrome DevTools Protocol (CDP) for LLMs to use. (🚨 Strongly vibe-coded)

[**Homepage**](https://slava-vishnyakov.github.io/playd/)

## Quickstart

```bash
npm install -g playd

playd session create my-run --headed

playd goto https://example.com

playd llm "Does this page have an input for search and what's its ID?" 
# uses gpt-5-nano and requires OPENAI_API_KEY

playd screenshot --path example.png

playd eval "body.html"

playd shutdown
```

## Install

```bash
npm install -g playd
```

## CLI Overview

### Sessions

```bash
playd session create <id> [--headed] [--browser chromium]
playd session ls
playd session info <id>
playd session close <id>
```

Create and manage isolated browser sessions.

### Navigation

Navigate and capture the page.

```bash
playd goto <url>
playd screenshot [--path file.png]
playd pdf [--path file.pdf]
```

`playd screenshot` works surprisingly well with Claude Code - it automatically "sees" the page.

### Page Interaction

```bash
playd click <selector>
playd type <selector> <text> [--clear]
playd fill <selector> <text>
playd press <key> [--selector <sel>]
playd wait-for <selector> [--state visible]
```

Automate user actions and waits.

### Content Extraction

```bash
playd html [--pretty]
playd text [--selector <sel>]
playd attr <selector> <name>
playd eval <javascript>
playd eval-file <file.js>
playd llm <question>
```

Pull content, run JS, or ask an LLM about the current page (requires OPENAI_API_KEY env var).

### Data Management

```bash
playd cookies [--set file.json]
playd cookie-get <name>
playd cookie-set <name> <value> [--domain <domain>] [--path <path>]
playd storage [--export file.json]
playd storage [--import file.json]
```

Move cookies and Web Storage data in and out. Individual cookie commands make it easy to get/set specific cookies without dealing with JSON files.

### Server Control

```bash
playd status
playd shutdown
```

Check status or stop the background server.

## Global Flags

* `--session <id>` – Use a specific session (auto-uses most recent if omitted)
* `--json` – JSON output
* `--timeout <ms>` – Command timeout
  These are available across commands.

## Environment

* `PLAYD_SESSION` – Default session ID
* `OPENAI_API_KEY` – Required for the `llm` command
  Configure these in your shell profile as needed.

## Why playd?

* Single binary CLI (`playd`) for scripting and CI.
* CDP-based automation that’s great for scraping, testing, and quick page ops. 

## License

**MIT**
